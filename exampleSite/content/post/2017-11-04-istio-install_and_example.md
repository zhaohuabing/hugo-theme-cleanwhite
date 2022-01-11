---
layout:     post
title:      "Istio及Bookinfo示例程序安装试用笔记"
subtitle:   "手把手教你从零搭建Istio及Bookinfo示例程序"
description: "Istio是来自Google，IBM和Lyft的一个Service Mesh（服务网格）开源项目，是Google继Kubernetes之后的又一大作,本文将演示如何从裸机开始从零搭建Istio及Bookinfo示例程序。"
excerpt: "Istio是来自Google，IBM和Lyft的一个Service Mesh（服务网格）开源项目，是Google继Kubernetes之后的又一大作,本文将演示如何从裸机开始从零搭建Istio及Bookinfo示例程序。"
date:    2017-11-04T12:00:00
author:     "赵化冰"
image: "/img/istio-install_and_example/post-bg.jpg"
tags:
    - Istio
URL: "/2017/11/04/istio-install_and_example/"
categories: [ Tech ]
---

## 服务网格简介

**服务网格**（Service Mesh）是为解决微服务的通信和治理而出现的一种**架构模式**。

服务网格将服务间通讯以及与此相关的管理控制功能从业务程序中下移到一个基础设施层，从而彻底隔离了业务逻辑和服务通讯两个关注点。采用服务网格后，应用开发者只需要关注并实现应用业务逻辑。服务之间的通信，包括服务发现，通讯的可靠性，通讯的安全性，服务路由等由服务网格层进行处理，并对应用程序透明。

<!--more-->
让我们来回顾一下微服务架构的发展过程。在出现服务网格之前，我们在微服务应用程序进程内处理服务通讯逻辑，包括服务发现，熔断，重试，超时等逻辑，如下图所示：  
![](/img/istio-install_and_example/5-a.png)  
通过对这部分负责服务通讯的逻辑进行抽象和归纳，可以形成一个代码库供应用程序调用。但应用程序还是需要处理和各种语言代码库的调用细节，并且各种代码库互不兼容，导致对应用程序使用的语言和代码框架有较大限制。

如果我们更进一步，将这部分逻辑从应用程序进程中抽取出来，作为一个单独的进程进行部署，并将其作为服务间的通信代理，如下图所示：  
![](/img/istio-install_and_example/6-a.png)  
因为通讯代理进程和应用进程一起部署，因此形象地把这种部署方式称为“sidecar”（三轮摩托的挎斗）。
![](/img/istio-install_and_example/sidecar.jpg)
应用间的所有流量都需要经过代理，由于代理以sidecar方式和应用部署在同一台主机上，应用和代理之间的通讯被认为是可靠的。然后由代理来负责找到目的服务并负责通讯的可靠性和安全等问题。

当服务大量部署时，随着服务部署的sidecar代理之间的连接形成了一个如下图所示的网格，被称之为Service Mesh（服务网格），从而得出如下的服务网格定义。

_服务网格是一个基础设施层，用于处理服务间通信。云原生应用有着复杂的服务拓扑，服务网格保证请求可以在这些拓扑中可靠地穿梭。在实际应用当中，服务网格通常是由一系列轻量级的网络代理组成的，它们与应用程序部署在一起，但应用程序不需要知道它们的存在。_

_William Morgan _[_WHAT’S A SERVICE MESH? AND WHY DO I NEED ONE?_](https://buoyant.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one/)_                                               _

![](/img/istio-install_and_example/mesh1.png)

了解了服务网格的基本概念，下一步介绍一下[Istio](https://istio.io/)。Istio是来自Google，IBM和Lyft的一个Service Mesh（服务网格）开源项目，是Google继Kubernetes之后的又一大作，Istio架构先进，设计合理，刚一宣布就获得了Linkerd，nginmesh等其他Service Mesh项目的合作以及Red hat/Pivotal/Weaveworks/Tigera/Datawire等的积极响应。  
![](/img/istio-install_and_example/Istio-Architecture.PNG)  
可以设想，在不久的将来，微服务的标准基础设施将是采用kubernetes进行服务部署和集群管理，采用Istio处理服务通讯和治理，两者相辅相成，缺一不可。

## 安装Kubernetes

Istio是微服务通讯和治理的基础设施层，本身并不负责服务的部署和集群管理，因此需要和Kubernetes等服务编排工具协同工作。

Istio在架构设计上支持各种服务部署平台，包括kubernetes，cloud foundry，Mesos等，但Istio作为Google亲儿子，对自家兄弟Kubernetes的支持肯定是首先考虑的。目前版本的0.2版本的手册中也只有Kubernetes集成的安装说明，其它部署平台和Istio的集成将在后续版本中支持。

从Istio控制面Pilot的架构图可以看到各种部署平台可以通过插件方式集成到Istio中，为Istio提供服务注册和发现功能。

![](/img/istio-install_and_example/PilotAdapters.PNG)

kubernetes集群的部署较为复杂，[Rancher](http://rancher.com)提供了kubernetes部署模板，通过一键式安装，可以大大简化kubernetes集群的安装部署过程。

本文的测试环境为两台虚机组成的集群，操作系统是Ubuntu 16.04.3 LTS。两台虚机的地址分别为：  
Rancher Server: 10.12.25.60  
工作节点: 10.12.25.116

通过Rancher安装Kubernetes集群的简要步骤如下：

### 在server和工作节点上安装docker

因为k8s并不支持最新版本的docker，因此需根据该页面安装指定版本的docker  
[http://rancher.com/docs/rancher/v1.6/en/hosts/](http://rancher.com/docs/rancher/v1.6/en/hosts/) ,目前是1.12版本。

```
curl https://releases.rancher.com/install-docker/1.12.sh | sh
```

如果需要以非root用户执行docker命令，参考[如何使用非root用户执行docker命令](http://zhaohuabing.com/2018/02/09/docker-without-sudo/)。


### 启动Rancher server

```
sudo docker run -d --restart=always -p 8080:8080 rancher/server
```

### 登录Rancher管理界面，创建k8s集群

Rancher 管理界面的缺省端口为8080，在浏览器中打开该界面，通过菜单Default-&gt;Manage Environment-&gt;Add Environment添加一个kubernetes集群。这里需要输入名称kubernetes，描述，然后选择kubernetes template，点击create，创建Kubernetes环境。![](/img/istio-install_and_example/Rancher.PNG)

点击菜单切换到kubernetes Environment，然后点击右上方的Add a host，添加一台host到kubernetes集群中。注意添加到集群中的host上必须先安装好符合要求的docker版本。

然后根据Rancher页面上的提示在host上执行脚本启动Rancher agent，以将host加入ranch cluster。注意脚本中包含了rancher server的地址，在host上必须可以ping通该地址。![](/img/istio-install_and_example/Rancher-add-host.PNG)

host加入cluster后Rancher会在host上pull kubernetes的images并启动kubernetes相关服务，根据安装环境所在网络情况不同需要等待几分钟到几十分钟不等。

### 安装并配置kubectl

待Rancher界面提示kubernetes创建成功后，安装kubernetes命令行工具kubectl

```
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.7.4/bin/linux/amd64/kubectl

chmod +x ./kubectl

sudo mv ./kubectl /usr/local/bin/kubectl
```

登录Rancher管理界面, 将 All Environments-&gt;kubernetes-&gt;KUBERNETES-&gt;CLI create config 的内容拷贝到~/.kube/config 中，以配置Kubectl和kubernetes server的连接信息。![](/img/istio-install_and_example/Rancher-kubectl.PNG)

## 安装Istio

Istio提供了安装脚本，该脚本会根据操作系统下载相应的Istio安装包并解压到当前目录。

```
 curl -L https://git.io/getLatestIstio | sh -
```

根据脚本的提示将Istio命令行所在路径加入到系统PATH环境变量中

```
export PATH="$PATH:/home/ubuntu/istio-0.2.10/bin"
```

在kubernetes集群中部署Istio控制面服务

```
kubectl apply -f istio-0.2.10/install/kubernetes/istio.yaml
```

确认Istio控制面服务已成功部署。Kubernetes会创建一个istio-system namespace，将Istio相关服务部署在该namespace中。

确认Istio相关Service的部署状态

```
kubectl get svc -n istio-system
```

```
NAME            CLUSTER-IP      EXTERNAL-IP        PORT(S)                                                  AGE
istio-egress    10.43.192.74    <none>             80/TCP                                                   25s
istio-ingress   10.43.16.24     10.12.25.116,...   80:30984/TCP,443:30254/TCP                               25s
istio-mixer     10.43.215.250   <none>             9091/TCP,9093/TCP,9094/TCP,9102/TCP,9125/UDP,42422/TCP   26s
istio-pilot     10.43.211.140   <none>             8080/TCP,443/TCP                                         25s
```

确认Istio相关Pod的部署状态

```
kubectl get pods -n istio-system
```

```
NAME                             READY     STATUS    RESTARTS   AGE
istio-ca-367485603-qvbfl         1/1       Running   0          2m
istio-egress-3571786535-gwbgk    1/1       Running   0          2m
istio-ingress-2270755287-phwvq   1/1       Running   0          2m
istio-mixer-1505455116-9hmcw     2/2       Running   0          2m
istio-pilot-2278433625-68l34     1/1       Running   0          2m
```

从上面的输出可以看到，这里部署的主要是Istio控制面的服务，而数据面的网络代理要如何部署呢？  
根据前面服务网格的架构介绍可以得知，网络代理是随着应用程序以sidecar的方式部署的，在下面部署Bookinfo示例程序时会演示如何部署网络代理。

## 部署Bookinfo示例程序

在下载的Istio安装包的samples目录中包含了示例应用程序。

通过下面的命令部署Bookinfo应用

```
kubectl apply -f <(istioctl kube-inject -f istio-0.2.10/samples/bookinfo/kube/bookinfo.yaml)
```

确认Bookinfo服务已经启动

```
kubectl get services
```

```
NAME          CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
details       10.43.175.204   <none>        9080/TCP   6m
kubernetes    10.43.0.1       <none>        443/TCP    5d
productpage   10.43.19.154    <none>        9080/TCP   6m
ratings       10.43.50.160    <none>        9080/TCP   6m
reviews       10.43.219.248   <none>        9080/TCP   6m
```

在浏览器中打开应用程序页面，地址为istio-ingress的External IP

`http://10.12.25.116/productpage`  
![](/img/istio-install_and_example/Bookinfo.PNG)

## 理解Istio Proxy实现原理

服务网格相对于sprint cloud等微服务代码库的一大优势是其对应用程序无侵入，在不修改应用程序代码的前提下对应用服务之间的通信进行接管，Istio是如何做到这点的呢？下面通过示例程序的部署剖析其中的原理。

如果熟悉kubernetes的应用部署过程，我们知道Bookinfo应用程序的标准部署方式是这样的：

```
kubectl apply -f istio-0.2.10/samples/bookinfo/kube/bookinfo.yaml
```

但从上面的部署过程可以看到，kubectl apply命令的输入并不是一个kubernetes yaml文件，而是`istioctl kube-inject -f istio-0.2.10/samples/bookinfo/kube/bookinfo.yaml`命令的输出。

这段命令在这里起到了什么作用呢？通过单独运行该命令并将输出保存到文件中，我们可以查看istioctl kube-inject命令到底在背后搞了什么小动作。

```
istioctl kube-inject -f istio-0.2.10/samples/bookinfo/kube/bookinfo.yaml >> bookinfo_with_sidecar.yaml
```

对比bookinfo/_with/_sidecar.yaml文件和bookinfo.yaml，可以看到该命令在bookinfo.yaml的基础上做了如下改动：

* 为每个pod增加了一个代理container，该container用于处理应用container之间的通信，包括服务发现，路由规则处理等。从下面的配置文件中可以看到proxy container通过15001端口进行监听，接收应用container的流量。

* 为每个pod增加了一个init-container，该container用于配置iptable，将应用container的流量导入到代理container中。

```
  #注入istio 网络代理
  image: docker.io/istio/proxy_debug:0.2.10
        imagePullPolicy: IfNotPresent
        name: istio-proxy
        resources: {}
        securityContext:
          privileged: true
          readOnlyRootFilesystem: false
          runAsUser: 1337
        volumeMounts:
        - mountPath: /etc/istio/proxy
          name: istio-envoy
        - mountPath: /etc/certs/
          name: istio-certs
          readOnly: true
      #使用init container修改iptable
      initContainers:
      - args:
        - -p
        - "15001"
        - -u
        - "1337"
        image: docker.io/istio/proxy_init:0.2.10
        imagePullPolicy: IfNotPresent
        name: istio-init
```

从上面的分析，我们可以看出Istio的kube-inject工具的用途即是将代理sidecar注入了Bookinfo的kubernetes yaml部署文件中。通过该方式，不需要用户手动修改kubernetes的部署文件，即可在部署服务时将sidecar和应用一起部署。

通过命令查看pod中部署的docker container，确认是否部署了Istio代理

```
kubectl get pods

NAME                              READY     STATUS    RESTARTS   AGE
details-v1-3688945616-8hv8x       2/2       Running   0          1d
productpage-v1-2055622944-cslw1   2/2       Running   0          1d
ratings-v1-233971408-8dcnp        2/2       Running   0          1d
reviews-v1-1360980140-474x6       2/2       Running   0          1d
reviews-v2-1193607610-cfhb5       2/2       Running   0          1d
reviews-v3-3340858212-b5c8k       2/2       Running   0          1d
```

查看reviews pod的中的container，可以看到pod中除reviews container外还部署了一个istio-proxy container

```
kubectl get pod reviews-v3-3340858212-b5c8k -o jsonpath='{.spec.containers[*].name}'

reviews istio-proxy
```

而应用container的流量是如何被导入到istio-proxy中的呢？

原理是Istio proxy在端口15001进行监听，pod中应用container的流量通过iptables规则被重定向到15001端口中。下面我们进入pod内部，通过相关命令来验证这一点。

先通过命令行找到ratings-v1-233971408-8dcnp pod的PID，以用于查看其network namespace內的iptables规则。

```
CONTAINER_ID=$(kubectl get po ratings-v1-233971408-8dcnp -o jsonpath='{.status.containerStatuses[0].containerID}' | cut -c 10-21)

PID=$(sudo docker inspect --format '{{ .State.Pid }}' $CONTAINER_ID)
```

可以使用nsenter命令来进入pod的network namespace执行命令。  
使用netstat命令可以看到istio proxy代理的监听端口15001

```
sudo nsenter -t ${PID} -n netstat -all | grep 15001

tcp        0      0 *:15001                 *:*                     LISTEN
```

使用iptables命令可以查看到下面的规则

```
sudo nsenter -t ${PID} -n iptables -t nat -L -n -v

Chain PREROUTING (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
   16   960 ISTIO_REDIRECT  all  --  *      *       0.0.0.0/0            0.0.0.0/0            /* istio/install-istio-prerouting */

Chain INPUT (policy ACCEPT 16 packets, 960 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain OUTPUT (policy ACCEPT 84838 packets, 7963K bytes)
 pkts bytes target     prot opt in     out     source               destination
 1969  118K ISTIO_OUTPUT  tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            /* istio/install-istio-output */

Chain POSTROUTING (policy ACCEPT 84838 packets, 7963K bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain ISTIO_OUTPUT (1 references)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ISTIO_REDIRECT  all  --  *      lo      0.0.0.0/0           !127.0.0.1            /* istio/redirect-implicit-loopback */
 1969  118K RETURN     all  --  *      *       0.0.0.0/0            0.0.0.0/0            owner UID match 1337 /* istio/bypass-envoy */
    0     0 RETURN     all  --  *      *       0.0.0.0/0            127.0.0.1            /* istio/bypass-explicit-loopback */
    0     0 ISTIO_REDIRECT  all  --  *      *       0.0.0.0/0            0.0.0.0/0            /* istio/redirect-default-outbound */

Chain ISTIO_REDIRECT (3 references)
 pkts bytes target     prot opt in     out     source               destination
   16   960 REDIRECT   tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            /* istio/redirect-to-envoy-port */ redir ports 15001
```

从pod所在network namespace的iptables规则中可以看到，pod的入口和出口流量分别通过PREROUTING和OUTPUT chain指向了自定义的ISTIO/_REDIRECT chain，而ISTIO/_REDIRECT chain中的规则将所有流量都重定向到了istio proxy正在监听的15001端口中。从而实现了对应用透明的通信代理。

## 测试路由规则

多次刷新Bookinfo应用的productpage页面，我们会发现该页面中显示的Book Reviews有时候有带红星的评价信息，有时有带黑星的评价信息，有时只有文字评价信息。  
这是因为Bookinfo应用程序部署了3个版本的Reviews服务，每个版本的返回结果不同，在没有设置路由规则时，缺省的路由会将请求随机路由到每个版本的服务上，如下图所示：

![](/img/istio-install_and_example/withistio.svg)

通过创建一条路由规则route-rule.yaml，将请求流量都引导到Reviews-v1服务上

```
apiVersion: config.istio.io/v1alpha2
kind: RouteRule
metadata:
  name: reviews-default
spec:
  destination:
    name: reviews
  precedence: 1
  route:
  - labels:
      version: v1
```

启用该路由规则

```
istioctl create -f route-rule.yaml -n default
```

再次打开productpage页面, 无论刷新多少次，显示的页面将始终是v1版本的输出，即不带星的评价内容。  
![](/img/istio-install_and_example/Bookinfo-no-star.PNG)  
删除该路由规则

```
istioctl delete -f route_rule.yaml -n default
```

继续刷新productpage页面,将重新随机出现三个版本的评价内容页面。

## 分布式调用追踪

首先修改安装包中的 `istio-0.2.10/install/kubernetes/addons/zipkin.yaml` 部署文件，增加Nodeport,以便能在kubernetes集群外部访问zipkin界面。

```
apiVersion: v1
kind: Service
metadata:
  name: zipkin
  namespace: istio-system
spec:
  ports:
  - name: http
    port: 9411
    nodePort: 30001
  selector:
    app: zipkin
  type: NodePort
```

部署zipkin服务。

```
kubectl apply -f istio-0.2.10/install/kubernetes/addons/zipkin.yaml
```

在浏览器中打开zipkin页面，可以追踪一个端到端调用经过了哪些服务，以及各个服务花费的时间等详细信息，如下图所示：  
`http://10.12.25.116:30001`  
![](/img/istio-install_and_example/zipkin.PNG)

## 性能指标监控

首先修改安装包中的 `istio-0.2.10/install/kubernetes/addons/grafana.yaml` 部署文件，增加Nodeport,以便能在kubernetes集群外部访问grafana界面。

```
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: istio-system
spec:
  ports:
  - port: 3000
    protocol: TCP
    name: http
    nodePort: 30002
  selector:
    app: grafana
  type: NodePort
```

prometheus用于收集和存储信息指标，grafana用于将性能指标信息进行可视化呈现，需要同时部署prometheus和grafana服务。

```
kubectl apply -f istio-0.2.10/install/kubernetes/addons/prometheus.yaml

kubectl apply -f istio-0.2.10/install/kubernetes/addons/grafana.yaml
```

首先在浏览器中打开Bookinfo的页面`http://10.12.25.116/productpage`，刷新几次，以制造一些性能指标数据。

然后打开grafana页面查看性能指标`http://10.12.25.116:30002/dashboard/db/istio-dashboard`，如下图所示：  
![](/img/istio-install_and_example/grafana.PNG)

## 参考

* [Istio官方文档](https://istio.io/docs/)
* [Pattern: Service Mesh](http://philcalcado.com/2017/08/03/pattern_service_mesh.html)
* [WHAT’S A SERVICE MESH? AND WHY DO I NEED ONE?](https://buoyant.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one/)
* [A Hacker’s Guide to Kubernetes Networking](https://thenewstack.io/hackers-guide-kubernetes-networking/)



