---
layout:     post
title:      "Service Mesh 和 API Gateway的关系探讨（译文）"
subtitle:   ""
description: "API Gateway和Service Mesh的关系是我最近一直在思考的问题，也和同事及社区的朋友之间进行了一些讨论。这篇短文很清晰地总结了两者之间的相似之处以及这两者在微服务架构中的不同用途。"
excerpt: "API Gateway和Service Mesh的关系是我最近一直在思考的问题，也和同事及社区的朋友之间进行了一些讨论。这篇短文很清晰地总结了两者之间的相似之处以及这两者在微服务架构中的不同用途。"
date:       2018-04-11 09:32:00
author:     "赵化冰"
image: "/img/2018-04-11-service-mesh-vs-api-gateway/background.jpg"
published: true
tags:
    - Microservice
    - Service Mesh
    - API Gateway
URL: "/2018/04/11/service-mesh-vs-api-gateway/"
categories: [ Tech ]
---

## Service Mesh vs API Gateway

在[前一篇关于Service Mesh的文章](https://medium.com/microservices-in-practice/service-mesh-for-microservices-2953109a3c9a)中,我提到了几个关于Service Mesh和API Gateway之间关系的问题，在本篇文章中，我打算就Service Mesh和API Gateway的用途进行进一步讨论。

为了区分API Gateway和Service Mesh，让我们先分别看看两者各自的关键特征。

## API Gateway: 将服务作为被管理的API向外部暴露


使用API Gateway的主要目的是将微服务作为被管理的API暴露（给外部系统）。因此，我们在API Gateway层开发的API或者边界服务对外提供了业务功能。

API/边界服务调用下游的组合或者原子微服务，通过组合/混装多个下游微服务的方式来提供业务逻辑。

在API/Edge服务调用下游服务时，需要采用一种可靠的通信方式，应用了断路器，超时，负载均衡/故障转移等可靠性模式。因此大部分的API Gateway解决方案都内置了这些特性。

API Gateway也内置了以下特性的支持，包括：服务发现，分析（可见性：性能指标，监控，分布式日志，分布式调用追踪）和安全。

API Gateway和API管理生态系统的其他组件的关系紧密，比如： API 市场/商店， API 发布门户。

## Service Mesh：微服务的网络通信基础设施

现在我们来看看Service Mesh有哪些不同。

Service Mesh是一个网络通信基础设施， 可以用于将应用层的网络通信功能从你的服务代码中剥离出来。

采用Service Mesh， 你不用在服务代码中实现用于可靠通信的模式如断路，超时等，类似地，Service Mesh也提供了服务发现，服务可见性等其他功能。

## API Gateway和Service Mesh实践

API Gateway和Service Mesh之间的主要不同点：API Gateway是暴露API/边界服务的关键组件，而Service Mesh则仅仅是一个服务间通信的基础设施，并不了解应用中的业务逻辑。

下图说明了API Gateway和Service Mesh的关系。如同前面所说，这两者之间也有一些重叠的部分（例如断路器等），但重要的是需要理解这两者是用于完全不同的用途。


图1： API Gateway和Service Mesh实践

![](/img/2018-04-11-service-mesh-vs-api-gateway/service-mesh-vs-api-gateway.png)

如上图所示，Service Mesh作为Sidecar（边车）和服务一起部署，它是独立于服务的业务逻辑的。

另一方面，API Gateway 提供了所有的API服务（这些API服务有明确定义的业务功能），它是应用业务逻辑的一部分。API Gateway可以具有内建的服务间通信能力，但它也可以使用Service Mesh来调用下游服务（API Gateway->Service Mesh->Microservices）。

在API管理层次，你可以使用API Gateway内建的服务间通信能力；也可以通过Service Mesh来调用下游服务，以将应用网络通信功能从应用程序转移到Service Mesh中。

## 译者按

API Gateway和Service Mesh的关系是我最近一直在思考的问题，也和同事及社区的朋友之间进行了一些讨论。这篇短文很清晰地总结了两者之间的相似之处以及这两者在微服务架构中的不同用途。

文章中提到“可以使用API Gateway内建的服务间通信能力；也可以通过Service Mesh来调用下游服务”。在和同事讨论时，大家提到一个比较重要的考虑因素是在API Gateway处引入一个Sidecar可能带来的额外延迟。

API Gateway作为微服务引用的流量入口，其对效率要求较高，如果随API Gateway部署一个Sidecar，可能对效率有一定影响。

我对此未进行测试，但从理论上来说，服务发现，重试，断路等逻辑无论放到API Gateway还是Service Mesh中耗时应该是差不多的，部署Sidecar只是增加了创建一个本地链接的消耗，如下图所示:
![](/img/2018-04-11-service-mesh-vs-api-gateway/api-gateway-with-service-mesh.png)

将API Gateway和Service Mesh的功能进行清晰划分，API Gateway负责应用逻辑，Service Mesh负责服务通讯，Metrics收集等微服务基础设施，这样划分后在架构上更为清晰。对于效率问题，我们可以考虑对API Gateway进行水平扩展来解决。

## 原文

本译文发表已征得原作者同意，原文参见 [Service Mesh vs API Gateway](https://medium.com/microservices-in-practice/service-mesh-vs-api-gateway-a6d814b9bf56)

