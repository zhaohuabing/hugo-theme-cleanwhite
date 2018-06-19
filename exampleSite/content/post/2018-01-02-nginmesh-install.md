---
layout:     post 
title:      "Nginx开源Service Mesh组件Nginmesh安装指南"
subtitle:   ""
description: "Nginmesh是NGINX的Service Mesh开源项目，用于Istio服务网格平台中的数据面代理。它旨在提供七层负载均衡和服务路由功能，与Istio集成作为sidecar部署，并将以“标准，可靠和安全的方式”使得服务间通信更容易。Nginmesh在今年底已经连续发布了0.2和0.3版本，提供了服务发现，请求转发，路由规则，性能指标收集等功能。本文介绍如何采用kubeadmin安装kubernetes集群并部署Nginmesh sidecar。"
date:       2018-01-02 12:00:00
author:     "赵化冰"
image: "img/post-bg-2015.jpg"
published: true
tags:
    - Istio 
    - service Mesh
    - nginmesh
URL: "/2018/01/02/nginmesh-install/"
categories: [ Tech ]
---

## 前言

Nginmesh是NGINX的Service Mesh开源项目，用于Istio服务网格平台中的数据面代理。它旨在提供七层负载均衡和服务路由功能，与Istio集成作为sidecar部署，并将以“标准，可靠和安全的方式”使得服务间通信更容易。Nginmesh在今年底已经连续发布了0.2和0.3版本，提供了服务发现，请求转发，路由规则，性能指标收集等功能。
<!--more-->
![Nginmesh sidecar proxy](https://raw.githubusercontent.com/nginmesh/nginmesh/master/images/nginx_sidecar.png)

> 备注：本文安装指南基于Ubuntu 16.04，在Centos上某些安装步骤的命令可能需要稍作改动。

## 安装Kubernetes Cluster

Kubernetes Cluster包含etcd, api server, scheduler，controller manager等多个组件，组件之间的配置较为复杂，如果要手动去逐个安装及配置各个组件，需要了解kubernetes，操作系统及网络等多方面的知识，对安装人员的能力要求较高。kubeadm提供了一个简便，快速安装Kubernetes Cluster的方式，并且可以通过安装配置文件提供较高的灵活性，因此我们采用kubeadm安装kubernetes cluster。

首先参照[kubeadm的说明文档](https://kubernetes.io/docs/setup/independent/install-kubeadm)在计划部署kubernetes cluster的每个节点上安装docker，kubeadm, kubelet 和 kubectl。

安装docker
```
apt-get update
apt-get install -y docker.io
```

使用google的源安装kubelet kubeadm和kubectl
```
apt-get update && apt-get install -y apt-transport-https
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
cat <<EOF >/etc/apt/sources.list.d/kubernetes.list
deb http://apt.kubernetes.io/ kubernetes-xenial main
EOF
apt-get update
apt-get install -y kubelet kubeadm kubectl
```
使用kubeadmin安装kubernetes cluster

Nginmesh使用Kubernetes的[Initializer机制](https://kubernetes.io/docs/admin/extensible-admission-controllers/#initializers)来实现sidecar的自动注入。Initializer目前是kubernetes的一个Alpha feature，缺省是未启用的，需要[通过api server的参数](https://kubernetes.io/docs/admin/extensible-admission-controllers/#enable-initializers-alpha-feature)打开。因此我们先创建一个kubeadm-conf配置文件，用于配置api server的启动参数

```
apiVersion: kubeadm.k8s.io/v1alpha1
kind: MasterConfiguration
apiServerExtraArgs:
  admission-control: Initializers,NamespaceLifecycle,LimitRanger,ServiceAccount,PersistentVolumeLabel,DefaultStorageClass,ValidatingAdmissionWebhook,ResourceQuota,DefaultTolerationSeconds,MutatingAdmissionWebhook
  runtime-config: admissionregistration.k8s.io/v1alpha1
```
使用kubeadmin init命令创建kubernetes master节点。
可以先试用--dry-run参数验证一下配置文件。
```
kubeadm init --config kubeadm-conf --dry-run
```
如果一切正常，kubeadm将提示：Finished dry-running successfully. Above are the resources that would be created.

下面再实际执行创建命令
```
kubeadm init --config kubeadm-conf
```
kubeadm会花一点时间拉取docker image，命令完成后，会提示如何将一个work node加入cluster。如下所示：

```
 kubeadm join --token fffbf6.13bcb3563428cf23 10.12.5.15:6443 --discovery-token-ca-cert-hash sha256:27ad08b4cd9f02e522334979deaf09e3fae80507afde63acf88892c8b72f143f
 ```
> 备注：目前kubeadm只能支持在一个节点上安装master，支持高可用的安装将在后续版本实现。kubernetes官方给出的workaround建议是定期备份 etcd 数据[kubeadm limitations](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/#limitations)。

Kubeadm并不会安装Pod需要的网络，因此需要手动安装一个Pod网络，这里采用的是Calico
```
kubectl apply -f https://docs.projectcalico.org/v2.6/getting-started/kubernetes/installation/hosted/kubeadm/1.6/calico.yaml
```

使用kubectl 命令检查master节点安装结果

```
ubuntu@kube-1:~$ kubectl get all
NAME             TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
svc/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   12m
```

 在每台工作节点上执行上述kubeadm join命令，即可把工作节点加入集群中。使用kubectl 命令检查cluster中的节点情况。

```
 ubuntu@kube-1:~$ kubectl get nodes
NAME      STATUS    ROLES     AGE       VERSION
kube-1    Ready     master    21m       v1.9.0
kube-2    Ready     <none>    47s       v1.9.0
```

## 安装Istio控制面和Bookinfo

参考[Nginmesh文档](https://github.com/nginmesh/nginmesh)安装Istio控制面和Bookinfo
该文档的步骤清晰明确，这里不再赘述。

需要注意的是，在Niginmesh文档中，建议通过Ingress的External IP访问bookinfo应用程序。但[Loadbalancer只在支持的云环境中才会生效](https://kubernetes.io/docs/concepts/services-networking/service/#type-loadbalancer)，并且还需要进行一定的配置。如我在Openstack环境中创建的cluster，则需要参照[该文档](https://docs.openstack.org/magnum/ocata/dev/kubernetes-load-balancer.html)对Openstack进行配置后，Openstack才能够支持kubernetes的Loadbalancer service。如未进行配置，通过命令查看Ingress External IP一直显示为pending状态。

```
NAME            TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)                                                            AGE
istio-ingress   LoadBalancer   10.111.158.10   <pending>     80:32765/TCP,443:31969/TCP                                         11m
istio-mixer     ClusterIP      10.107.135.31   <none>        9091/TCP,15004/TCP,9093/TCP,9094/TCP,9102/TCP,9125/UDP,42422/TCP   11m
istio-pilot     ClusterIP      10.111.110.65   <none>        15003/TCP,443/TCP                                                  11m
```

如不能配置云环境提供Loadbalancer特性, 我们可以直接使用集群中的一个节点IP:Nodeport访问Bookinfo应用程序。

```
http://10.12.5.31:32765/productpage
```
想要了解更多关于如何从集群外部进行访问的内容，可以参考[如何从外部访问Kubernetes集群中的应用？](http://zhaohuabing.com/2017/11/28/access-application-from-outside/)

## 查看自动注入的sidecar
使用 kubectl get pod reviews-v3-5fff595d9b-zsb2q -o yaml 命令查看Bookinfo应用的reviews服务的Pod。

```
apiVersion: v1
kind: Pod
metadata:
  annotations:
    sidecar.istio.io/status: injected-version-0.2.12
  creationTimestamp: 2018-01-02T02:33:36Z
  generateName: reviews-v3-5fff595d9b-
  labels:
    app: reviews
    pod-template-hash: "1999151856"
    version: v3
  name: reviews-v3-5fff595d9b-zsb2q
  namespace: default
  ownerReferences:
  - apiVersion: extensions/v1beta1
    blockOwnerDeletion: true
    controller: true
    kind: ReplicaSet
    name: reviews-v3-5fff595d9b
    uid: 5599688c-ef65-11e7-8be6-fa163e160c7d
  resourceVersion: "3757"
  selfLink: /api/v1/namespaces/default/pods/reviews-v3-5fff595d9b-zsb2q
  uid: 559d8c6f-ef65-11e7-8be6-fa163e160c7d
spec:
  containers:
  - image: istio/examples-bookinfo-reviews-v3:0.2.3
    imagePullPolicy: IfNotPresent
    name: reviews
    ports:
    - containerPort: 9080
      protocol: TCP
    resources: {}
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: default-token-48vxx
      readOnly: true
  - args:
    - proxy
    - sidecar
    - -v
    - "2"
    - --configPath
    - /etc/istio/proxy
    - --binaryPath
    - /usr/local/bin/envoy
    - --serviceCluster
    - reviews
    - --drainDuration
    - 45s
    - --parentShutdownDuration
    - 1m0s
    - --discoveryAddress
    - istio-pilot.istio-system:15003
    - --discoveryRefreshDelay
    - 1s
    - --zipkinAddress
    - zipkin.istio-system:9411
    - --connectTimeout
    - 10s
    - --statsdUdpAddress
    - istio-mixer.istio-system:9125
    - --proxyAdminPort
    - "15000"
    - --controlPlaneAuthPolicy
    - NONE
    env:
    - name: POD_NAME
      valueFrom:
        fieldRef:
          apiVersion: v1
          fieldPath: metadata.name
    - name: POD_NAMESPACE
      valueFrom:
        fieldRef:
          apiVersion: v1
          fieldPath: metadata.namespace
    - name: INSTANCE_IP
      valueFrom:
        fieldRef:
          apiVersion: v1
          fieldPath: status.podIP
    image: nginmesh/proxy_debug:0.2.12
    imagePullPolicy: Always
    name: istio-proxy
    resources: {}
    securityContext:
      privileged: true
      readOnlyRootFilesystem: false
      runAsUser: 1337
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
    volumeMounts:
    - mountPath: /etc/istio/proxy
      name: istio-envoy
    - mountPath: /etc/certs/
      name: istio-certs
      readOnly: true
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: default-token-48vxx
      readOnly: true
  dnsPolicy: ClusterFirst
  initContainers:
  - args:
    - -p
    - "15001"
    - -u
    - "1337"
    image: nginmesh/proxy_init:0.2.12
    imagePullPolicy: Always
    name: istio-init
    resources: {}
    securityContext:
      capabilities:
        add:
        - NET_ADMIN
      privileged: true
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: default-token-48vxx
      readOnly: true
  nodeName: kube-2
  restartPolicy: Always
  schedulerName: default-scheduler
  securityContext: {}
  serviceAccount: default
  serviceAccountName: default
  terminationGracePeriodSeconds: 30
  tolerations:
  - effect: NoExecute
    key: node.kubernetes.io/not-ready
    operator: Exists
    tolerationSeconds: 300
  - effect: NoExecute
    key: node.kubernetes.io/unreachable
    operator: Exists
    tolerationSeconds: 300
  volumes:
  - emptyDir:
      medium: Memory
    name: istio-envoy
  - name: istio-certs
    secret:
      defaultMode: 420
      optional: true
      secretName: istio.default
  - name: default-token-48vxx
    secret:
      defaultMode: 420
      secretName: default-token-48vxx
status:
  conditions:
  - lastProbeTime: null
    lastTransitionTime: 2018-01-02T02:33:54Z
    status: "True"
    type: Initialized
  - lastProbeTime: null
    lastTransitionTime: 2018-01-02T02:36:06Z
    status: "True"
    type: Ready
  - lastProbeTime: null
    lastTransitionTime: 2018-01-02T02:33:36Z
    status: "True"
    type: PodScheduled
  containerStatuses:
  - containerID: docker://5d0c189b9dde8e14af4c8065ee5cf007508c0bb2b3c9535598d99dc49f531370
    image: nginmesh/proxy_debug:0.2.12
    imageID: docker-pullable://nginmesh/proxy_debug@sha256:6275934ea3a1ce5592e728717c4973ac704237b06b78966a1d50de3bc9319c71
    lastState: {}
    name: istio-proxy
    ready: true
    restartCount: 0
    state:
      running:
        startedAt: 2018-01-02T02:36:05Z
  - containerID: docker://aba3e114ac1aa87c75e969dcc1b0725696de78d3407c5341691d9db579429f28
    image: istio/examples-bookinfo-reviews-v3:0.2.3
    imageID: docker-pullable://istio/examples-bookinfo-reviews-v3@sha256:6e100e4805a8c10c47040ea7b66f10ad619c7e0068696032546ad3e35ad46570
    lastState: {}
    name: reviews
    ready: true
    restartCount: 0
    state:
      running:
        startedAt: 2018-01-02T02:35:47Z
  hostIP: 10.12.5.31
  initContainerStatuses:
  - containerID: docker://b55108625832a3205a265e8b45e5487df10276d5ae35af572ea4f30583933c1f
    image: nginmesh/proxy_init:0.2.12
    imageID: docker-pullable://nginmesh/proxy_init@sha256:f73b68839f6ac1596d6286ca498e4478b8fcfa834e4884418d23f9f625cbe5f5
    lastState: {}
    name: istio-init
    ready: true
    restartCount: 0
    state:
      terminated:
        containerID: docker://b55108625832a3205a265e8b45e5487df10276d5ae35af572ea4f30583933c1f
        exitCode: 0
        finishedAt: 2018-01-02T02:33:53Z
        reason: Completed
        startedAt: 2018-01-02T02:33:53Z
  phase: Running
  podIP: 192.168.79.138
  qosClass: BestEffort
  startTime: 2018-01-02T02:33:39Z

```

该命令行输出的内容相当长，我们可以看到Pod中注入了一个 nginmesh/proxy_debug container,还增加了一个initContainer nginmesh/proxy_init。这两个容器是通过kubernetes initializer自动注入到pod中的。这两个container分别有什么作用呢？让我们看一下[Nginmesh源代码中的说明](https://github.com/nginmesh/nginmesh/tree/49cd69a61d7d330685ef39ccd63fac06421c3da2/istio/agent)：

* proxy_debug, which comes with the agent and NGINX.

* proxy_init, which is used for configuring iptables rules for transparently injecting an NGINX proxy from the proxy_debug image into an application pod.

proxy_debug就是sidecar代理，proxy_init则用于配置iptable 规则，以将应用的流量导入到sidecar代理中。

查看proxy_init的Dockerfile文件，可以看到proxy_init其实是调用了[prepare_proxy.sh](https://github.com/nginmesh/nginmesh/blob/49cd69a61d7d330685ef39ccd63fac06421c3da2/istio/agent/docker-init/prepare_proxy.sh)这个脚本来创建iptable规则。

proxy_debug Dockerfile

```
FROM debian:stretch-slim
RUN apt-get update && apt-get install -y iptables
ADD prepare_proxy.sh /
ENTRYPOINT ["/prepare_proxy.sh"]
```

prepare_proxy.sh节选

```
...omitted for brevity 

# Create a new chain for redirecting inbound and outbound traffic to
# the common Envoy port.
iptables -t nat -N ISTIO_REDIRECT                                             -m comment --comment "istio/redirect-common-chain"
iptables -t nat -A ISTIO_REDIRECT -p tcp -j REDIRECT --to-port ${ENVOY_PORT}  -m comment --comment "istio/redirect-to-envoy-port"

# Redirect all inbound traffic to Envoy.
iptables -t nat -A PREROUTING -j ISTIO_REDIRECT                               -m comment --comment "istio/install-istio-prerouting"

# Create a new chain for selectively redirecting outbound packets to
# Envoy.
iptables -t nat -N ISTIO_OUTPUT                                               -m comment --comment "istio/common-output-chain"

...omitted for brevity
```

## 关联阅读

[Istio及Bookinfo示例程序安装试用笔记](http://zhaohuabing.com/2017/11/04/istio-install_and_example/)

## 参考

* [Service Mesh with Istio and NGINX](https://github.com/nginmesh/nginmesh/)

* [Using kubeadm to Create a Cluster](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/#14-installing-kubeadm-on-your-hosts)

* [Kubernetes Reference Documentation-Dynamic Admission Control](https://kubernetes.io/docs/admin/extensible-admission-controllers/#enable-initializers-alpha-feature)


