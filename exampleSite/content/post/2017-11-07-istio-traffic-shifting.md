---
layout:     post
title:      "使用Istio实现应用流量转移"
subtitle:   "本文翻译自istio官方文档"
description: "本任务将演示如何将应用流量逐渐从旧版本的服务迁移到新版本。通过Istio，可以使用一系列不同权重的规则（10%，20%，··· 100%）将流量平缓地从旧版本服务迁移到新版本服务。"
excerpt: "本任务将演示如何将应用流量逐渐从旧版本的服务迁移到新版本。通过Istio，可以使用一系列不同权重的规则（10%，20%，··· 100%）将流量平缓地从旧版本服务迁移到新版本服务。"
date:     2017-11-07
author:     "赵化冰"
image: "https://img.zhaohuabing.com/in-post/istio-traffic-shifting/crossroads.png"
categories: [ "Tech"]
tags:
    - Istio
URL: "/2017/11/07/istio-traffic-shifting/"
---

关于Istio的更多内容请参考[istio中文文档](http://istio.doczh.cn/)。

原文参见[Traffic Shifting](https://istio.io/docs/tasks/traffic-management/traffic-shifting.html)。

本任务将演示如何将应用流量逐渐从旧版本的服务迁移到新版本。通过Istio，可以使用一系列不同权重的规则（10%，20%，··· 100%）将流量平缓地从旧版本服务迁移到新版本服务。
<!--more-->
为简单起见，本任务将采用两步将流量从`reviews:v1` 迁移到 `reviews:v3`，权重分别为50%，100%。


# 开始之前

* 参照文档[安装指南](http://istio.doczh.cn/docs/setup/kubernetes/index.html)中的步骤安装Istio。

* 部署[BookInfo](http://istio.doczh.cn/docs/guides/bookinfo.html) 示例应用程序。

>  请注意：本文档假设示采用kubernetes部署示例应用程序。所有的示例命令行都采用规则yaml文件（例如`samples/bookinfo/kube/route-rule-all-v1.yaml`）指定的kubernetes版本。如果在不同的环境下运行本任务，请将`kube`修改为运行环境中相应的目录（例如，对基于Consul的运行环境，目录就是`samples/bookinfo/consul/route-rule-all-v1.yaml`）。


# 基于权重的版本路由

1. 将所有微服务的缺省版本设置为v1.

   ```bash
   istioctl create -f samples/bookinfo/kube/route-rule-all-v1.yaml
   ```

1. 在浏览器中打开http://$GATEWAY_URL/productpage,  确认`reviews` 服务目前的活动版本是v1。

   可以看到浏览器中出现BooInfo应用的productpage页面。
   注意`productpage`显示的评价内容不带星级。这是由于`reviews:v1`不会访问`ratings`服务。

   > 请注意：如果之前执行过 [配置请求路由](http://istio.doczh.cn/docs/tasks/traffic-management/request-routing.html)任务，则需要先注销测试用户“jason”或者删除之前单独为该用户创建的测试规则：

     ```bash
     istioctl delete routerule reviews-test-v2
     ```

1. 首先，使用下面的命令把50%的流量从`reviews:v1`转移到`reviews:v3`:

   ```bash
   istioctl replace -f samples/bookinfo/kube/route-rule-reviews-50-v3.yaml
   ```

   注意这里使用了`istioctl replace`而不是`create`。

1. 在浏览器中多次刷新`productpage`页面，大约有50%的几率会看到页面中出现带红星的评价内容。

   > 请注意：在目前的Envoy sidecar实现中，可能需要刷新`productpage`很多次才能看到流量分发的效果。在看到页面出现变化前，有可能需要刷新15次或者更多。如果修改规则，将90%的流量路由到v3，可以看到更明显的效果。

1. 当v3版本的`reviews`服务已经稳定运行后，可以将100%的流量路由到`reviews:v3`：

   ```bash
   istioctl replace -f samples/bookinfo/kube/route-rule-reviews-v3.yaml
   ```

   此时，以任何用户登录到`productpage`页面，都可以看到带红星的评价信息。

# 理解原理

在这个任务中，我们使用了Istio的带权重路由的特性将流量从老版本的`reviews`服务逐渐迁移到了新版本服务中。

注意该方式和使用容器编排平台的部署特性来进行版本迁移是完全不同的。容器编排平台使用了实例scaling来对流量进行管理。而通过Istio，两个版本的`reviews`服务可以独立地进行scale up和scale down，并不会影响这两个版本服务之间的流量分发。

想了解更多支持scaling的按版本路由功能，请查看[Canary Deployments using Istio](https://istio.io/blog/canary-deployments-using-istio.html)。

# 清理

* 删除路由规则。

  ```bash
  istioctl delete -f samples/bookinfo/kube/route-rule-all-v1.yaml
  ```

* 如果不打算尝试后面的任务，请参照[BookInfo cleanup](http://istio.doczh.cn/docs/guides/bookinfo.html#cleanup) 中的步骤关闭应用程序。


# 进阶阅读

* 更多的内容请参见[请求路由](http://istio.doczh.cn/docs/concepts/traffic-management/rules-configuration.html)。
