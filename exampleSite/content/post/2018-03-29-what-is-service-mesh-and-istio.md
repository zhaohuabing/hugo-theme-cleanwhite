---
layout:     post 
title:      "谈谈微服务架构中的基础设施：Service Mesh与Istio"
subtitle:   "Service Mesh模式及Istio开源项目介绍"
description: "作为一种架构模式，微服务将复杂系统切分为数十乃至上百个小服务，每个服务负责实现一个独立的业务逻辑。这些小服务易于被小型的软件工程师团队所理解和修改，并带来了语言和框架选择灵活性，缩短应用开发上线时间，可根据不同的工作负载和资源要求对服务进行独立缩扩容等优势。另一方面，当应用被拆分为多个微服务进程后，进程内的方法调用变成了了进程间的远程调用。引入了对大量服务的连接、管理和监控的复杂性,本文介绍了Service Mesh模式如何应对微服务架构的这些挑战，以及Service Mesh的明星开源项目Istio。"
date:       2018-03-29 12:00:00
author:     "赵化冰"
image: "https://img.zhaohuabing.com/in-post/istio-install_and_example/post-bg.jpg"
published: true
tags:
    - Microservice
    - Service Mesh
    - Istio
URL: "/2018/03/29/what-is-service-mesh-and-istio/"
categories: [ Tech ]    
---

## 微服务架构的演进
作为一种架构模式，微服务将复杂系统切分为数十乃至上百个小服务，每个服务负责实现一个独立的业务逻辑。这些小服务易于被小型的软件工程师团队所理解和修改，并带来了语言和框架选择灵活性，缩短应用开发上线时间，可根据不同的工作负载和资源要求对服务进行独立缩扩容等优势。

另一方面，当应用被拆分为多个微服务进程后，进程内的方法调用变成了了进程间的远程调用。引入了对大量服务的连接、管理和监控的复杂性。
 <!--more-->
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/microservice.PNG)

该变化带来了分布式系统的一系列问题，例如：
* 如何找到服务的提供方？
* 如何保证远程方法调用的可靠性？
* 如何保证服务调用的安全性？
* 如何降低服务调用的延迟？
* 如何进行端到端的调试？

另外生产部署中的微服务实例也增加了运维的难度,例如：

* 如何收集大量微服务的性能指标已进行分析？
* 如何在不影响上线业务的情况下对微服务进行升级？
* 如何测试一个微服务集群部署的容错和稳定性？

这些问题涉及到成百上千个服务的通信、管理、部署、版本、安全、故障转移、策略执行、遥测和监控等，要解决这些微服务架构引入的问题并非易事。

让我们来回顾一下微服务架构的发展过程。在出现服务网格之前，我们最开始在微服务应用程序内理服务之间的通讯逻辑，包括服务发现，熔断，重试，超时，加密，限流等逻辑。
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/1.png)
在一个分布式系统中，这部分逻辑比较复杂，为了为微服务应用提供一个稳定、可靠的基础设施层，避免大家重复造轮子，并减少犯错的可能，一般会通过对这部分负责服务通讯的逻辑进行抽象和归纳，形成一个代码库供各个微服务应用程序使用，如下图所示：
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/2.png)
公共的代码库减少了应用程序的开发和维护工作量，降低了由应用开发人员单独实现微服务通讯逻辑出现错误的机率，但还是存在下述问题：
* 微服务通讯逻辑对应用开发人员并不透明，应用开发人员需要理解并正确使用代码			库，不能将其全部精力聚焦于业务逻辑。
* 需要针对不同的语言/框架开发不同的代码库，反过来会影响微服务应用开发语言			和框架的选择，影响技术选择的灵活性。
* 随着时间的变化，代码库会存在不同的版本，不同版本代码库的兼容性和大量运行			环境中微服务的升级将成为一个难题。

可以将微服务之间的通讯基础设施层和TCP/IP协议栈进行类比。TCP/IP协议栈为操作系统中的所有应用提供基础通信服务，但TCP/IP协议栈和应用程序之间并没有紧密的耦合关系，应用只需要使用TCP/IP协议提供的底层通讯功能,并不关心TCP/IP协议的实现，如IP如何进行路由，TCP如何创建链接等。

同样地，微服务应用也不应该需要关注服务发现，Load balancing，Retries，Circuit Breaker等微服务之间通信的底层细节。如果将为微服务提供通信服务的这部分逻辑从应用程序进程中抽取出来，作为一个单独的进程进行部署，并将其作为服务间的通信代理，可以得到如下图所示的架构：
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/sidecar.png)
因为通讯代理进程伴随应用进程一起部署，因此形象地把这种部署方式称为“sidecar”/边车（即三轮摩托的挎斗）。

应用间的所有流量都需要经过代理，由于代理以sidecar方式和应用部署在同一台主机上，应用和代理之间的通讯可以被认为是可靠的。由代理来负责找到目的服务并负责通讯的可靠性和安全等问题。

当服务大量部署时，随着服务部署的sidecar代理之间的连接形成了一个如下图所示的网格，该网格成为了微服务的通讯基础设施层，承载了微服务之间的所有流量，被称之为Service Mesh（服务网格）。
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/mesh.png)

_服务网格是一个基础设施层，用于处理服务间通信。云原生应用有着复杂的服务拓扑，服务网格保证请求可以在这些拓扑中可靠地穿梭。在实际应用当中，服务网格通常是由一系列轻量级的网络代理组成的，它们与应用程序部署在一起，但应用程序不需要知道它们的存在。

_William Morgan _[_WHAT’S A SERVICE MESH? AND WHY DO I NEED ONE?_
](https://buoyant.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one/)_

服务网格中有数量众多的Sidecar代理，如果对每个代理分别进行设置，工作量将非常巨大。为了更方便地对服务网格中的代理进行统一集中控制，在服务网格上增加了控制面组件。

![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/controlplane.png)

这里我们可以类比SDN的概念，控制面就类似于SDN网管中的控制器，负责路由策略的指定和路由规则下发；数据面类似于SDN网络中交换机，负责数据包的转发。

由于微服务的所有通讯都由服务网格基础设施层提供，通过控制面板和数据面板的配合，可以对这些通讯进行监控、托管和控制，以实现微服务灰度发布，调用分布式追踪，故障注入模拟测试，动态路由规则，微服务闭环控制等管控功能。

## Istio服务网格
Istio是一个Service Mesh开源项目，是Google继Kubernetes之后的又一力作，主要参与的公司包括Google，IBM和Lyft。

凭借kubernetes良好的架构设计及其强大的扩展性，Google围绕kubernetes打造一个生态系统。Kubernetes用于微服务的编排（编排是英文Orchestration的直译，用大白话说就是描述一组微服务之间的关联关系，并负责微服务的部署、终止、升级、缩扩容等）。其向下用CNI(容器网络接口），CRI（容器运行时接口）标准接口可以对接不同的网络和容器运行时实现，提供微服务运行的基础设施。向上则用Istio提供了微服务治理功能。

由下图可见，Istio补充了Kubernetes生态圈的重要一环，是Google的微服务版图里一个里程碑式的扩张。
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/k8s-ecosystem.PNG)

Google借Istio的力量推动微服务治理的事实标准，对Google自身的产品Google Cloud有极其重大的意义。其他的云服务厂商，如Redhat，Pivotal，Nginx，Buoyant等看到大势所趋，也纷纷跟进，宣布自身产品和Istio进行集成，以避免自己被落下，丢失其中的市场机会。

可以预见不久的将来，对于云原生应用而言，采用kubernetes进行服务部署和集群管理，采用Istio处理服务通讯和治理，将成为微服务应用的标准配置。

Istio服务包括网格由数据面和控制面两部分。
* 数据面由一组智能代理（Envoy）组成，代理部署为边车，调解和控制微服务之间所有的网络通信。
* 控制面负责管理和配置代理来路由流量，以及在运行时执行策略。

![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/istio-architecture.png)

### Istio控制面
Istio控制面板包括3个组件:Pilot, Mixer和Istio-Auth。
#### Pilot
Pilot维护了网格中的服务的标准模型，这个标准模型是独立于各种底层平台的。Pilot通过适配器和各底层平台对接，以填充此标准模型。

例如Pilot中的Kubernetes适配器通过Kubernetes API服务器得到kubernetes中pod注册信息的更改，入口资源以及存储流量管理规则等信息，然后将该数据被翻译为标准模型提供给Pilot使用。通过适配器模式，Pilot还可以从Mesos, Cloud Foundry, Consul中获取服务信息，也可以开发适配器将其他提供服务发现的组件集成到Pilot中。

除此以外，Pilo还定义了一套和数据面通信的标准API，API提供的接口内容包括服务发现 、负载均衡池和路由表的动态更新。通过该标准API将控制面和数据面进行了解耦，简化了设计并提升了跨平台的可移植性。基于该标准API已经实现了多种Sidecar代理和Istio的集成，除Istio目前集成的Envoy外，还可以和Linkerd, Nginmesh等第三方通信代理进行集成，也可以基于该API自己编写Sidecar实现。

Pilot还定义了一套DSL（Domain Specific Language）语言，DSL语言提供了面向业务的高层抽象，可以被运维人员理解和使用。运维人员使用该DSL定义流量规则并下发到Pilot，这些规则被Pilot翻译成数据面的配置，再通过标准API分发到Envoy实例，可以在运行期对微服务的流量进行控制和调整。
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/pilot.png)

#### Mixer
在微服务应用中，通常需要部署一些基础的后端公共服务以用于支撑业务功能。这些基础设施包括策略类如访问控制，配额管理；以及遥测报告如APM，日志等。微服务应用和这些后端支撑系统之间一般是直接集成的，这导致了应用和基础设置之间的紧密耦合，如果因为运维原因需要对基础设置进行升级或者改动，则需要修改各个微服务的应用代码，反之亦然。

为了解决该问题，Mixer在应用程序代码和基础架构后端之间引入了一个通用中间层。该中间层解耦了应用和后端基础设施，应用程序代码不再将应用程序代码与特定后端集成在一起，而是与Mixer进行相当简单的集成，然后Mixer负责与后端系统连接。

Mixer主要提供了三个核心功能：
* 前提条件检查。允许服务在响应来自服务消费者的传入请求之前验证一些前提条件。前提条件可以包括服务使用者是否被正确认证，是否在服务的白名单上，是否通过ACL检查等等。
* 配额管理。 使服务能够在分配和释放多个维度上的配额，配额这一简单的资源管理工具可以在服务消费者对有限资源发生争用时，提供相对公平的（竞争手段）。Rate Limiting就是配额的一个例子。
* 遥测报告。使服务能够上报日志和监控。在未来，它还将启用针对服务运营商以及服务消费者的跟踪和计费流。


Mixer的架构如图所示:
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/mixer2.png)

首先，Sidecar会从每一次请求中收集相关信息，如请求的路径，时间，源IP，目地服务，tracing头，日志等，并请这些属性上报给Mixer。Mixer和后端服务之间是通过适配器进行连接的，Mixer将Sidecar上报的内容通过适配器发送给后端服务。

由于Sidecar只和Mixer进行对接，和后端服务之间并没有耦合，因此使用Mixer适配器机制可以接入不同的后端服务，而不需要修改应用的代码，例如通过不同的Mixer适配器，可以把Metrics收集到Prometheus或者InfluxDB，甚至可以在不停止应用服务的情况下动态切换后台服务。

其次，Sidecar在进行每次请求处理时会通过Mixer进行策略判断，并根据Mixer返回的结果决定是否继续处理该次调用。通过该方式，Mixer将策略决策移出应用层，使运维人员可以在运行期对策略进行配置，动态控制应用的行为，提高了策略控制的灵活性。例如可以配置每个微服务应用的访问白名单，不同客户端的Rate limiting，等等。

逻辑上微服务之间的每一次请求调用都会经过两次Mixer的处理：调用前进行策略判断，调用后进行遥测数据收集。Istio采用了一些机制来避免Mixer的处理影响Envoy的转发效率。

从上图可以看到，Istio在Envoy中增加了一个Mixer Filter，该Filter和控制面的Mixer组件进行通讯，完成策略控制和遥测数据收集功能。Mixer Filter中保存有策略判断所需的数据缓存，因此大部分策略判断在Envoy中就处理了，不需要发送请求到Mixer。另外Envoy收集到的遥测数据会先保存在Envoy的缓存中，每隔一段时间再通过批量的方式上报到Mixer。


#### Auth
Istio支持双向SSL认证（Mutual SSL Authentication）和基于角色的访问控制（RBAC），以提供端到端的安全解决方案。

##### 认证
Istio提供了一个内部的CA(证书机构),该CA为每个服务颁发证书，提供服务间访问的双向SSL身份认证，并进行通信加密，其架构如下图所示：
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/auth.png)

其工作机制如下：
部署时：

* CA监听Kubernetes API Server, 为集群中的每一个Service Account创建一对密钥和证书，并发送给Kubernetes API Server。注意这里不是为每个服务生成一个证书，而是为每个Service Account生成一个证书。Service Account和kubernetes中部署的服务可以是一对多的关系。Service Account被保存在证书的SAN(Subject Alternative Name)字段中。
* 当Pod创建时，Kubernetes根据该Pod关联的Service Account将密钥和证书以Kubernetes Secrets资源的方式加载为Pod的Volume，以供Envoy使用。
* Pilot生成数据面的配置，包括Envoy需使用的密钥和证书信息，以及哪个Service Account可以允许运行哪些服务，下发到Envoy。
>备注：如果是虚机环境，则采用一个Node Agent生成密钥，向Istio CA申请证书，然后将证书传递给Envoy。

运行时：

* 服务客户端的出站请求被Envoy接管。
* 客户端的Envoy和服务端的Envoy开始双向SSL握手。在握手阶段，客户端Envoy会验证服务端Envoy证书中的Service Account有没有权限运行该请求的服务，如没有权限，则认为服务端不可信，不能创建链接。
* 当加密TSL链接创建好后，请求数据被发送到服务端的Envoy，然后被Envoy通过一个本地的TCP链接发送到服务中。

##### 鉴权

Istio“基于角色的访问控制”（RBAC）提供了命名空间，服务，方法三个不同大小粒度的服务访问权限控制。其架构如下图所示：
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/authorization.png)

管理人员可以定制访问控制的安全策略，这些安全策略保存在Istio Config Store中。 Istio RBAC Engine从Config Store中获取安全策略，根据安全策略对客户端发起的请求进行判断，并返回鉴权结果（允许或者禁止）。

Istio RBAC Engine目前被实现为一个Mixer Adapter，因此其可以从Mixer传递过来的上下文中获取到访问请求者的身份（Subject）和操作请求（Action），并通过Mixer对访问请求进行策略控制，允许或者禁止某一次请求。

Istio Policy中包含两个基本概念：

* ServiceRole，定义一个角色，并为该角色指定对网格中服务的访问权限。指定角色访问权限时可以在命名空间，服务，方法的不同粒度进行设置。

* ServiceRoleBinding，将角色绑定到一个Subject，可以是一个用户，一组用户或者一个服务。

### Istio数据面
Istio数据面以“边车”(sidecar)的方式和微服务一起部署，为微服务提供安全、快速、可靠的服务间通讯。由于Istio的控制面和数据面以标准接口进行交互，因此数据可以有多种实现，Istio缺省使用了Envoy代理的扩展版本。

Envoy是以C ++开发的高性能代理，用于调解服务网格中所有服务的所有入站和出站流量。Envoy的许多内置功能被Istio发扬光大，例如动态服务发现，负载均衡，TLS加密，HTTP/2 & gRPC代理，熔断器，路由规则，故障注入和遥测等。

Istio数据面支持的特性如下：

| Outbound特性 | Inbound特性 |
|--------|--------|
| Service authentication（服务认证）|Service authentication（服务认证）|
|Load Balancing（负载均衡）        |Authorization（鉴权）|
|Retry and circuit breaker（重试和断路器）|Rate limits（请求限流）|
|Fine-grained routing（细粒度的路由）|Load shedding（负载控制）|
|Telemetry（遥测）|Telemetry（遥测）|
|Request Tracing（分布式追踪）|Request Tracing（分布式追踪）|
|Fault Injection（故障注入）|Fault Injection（故障注入）|

>备注：Outbound特性是指服务请求侧的Sidecar提供的功能特性，而Inbound特性是指服务提供侧Sidecar提供的功能特性。一些特性如遥测和分布式跟踪需要两侧的Sidecar都提供支持；而另一些特性则只需要在一侧提供，例如鉴权只需要在服务提供侧提供，重试只需要在请求侧提供。

### 典型应用场景
Istio服务管控包括下列的典型应用场景：

#### 分布式调用追踪
在微服务架构中，业务的调用链非常复杂，一个来自用户的请求可能涉及到几十个服务的协同处理。因此需要一个跟踪系统来记录和分析同一次请求在整个调用链上的相关事件，从而帮助研发和运维人员分析系统瓶颈，快速定位异常和优化调用链路。

Istio通过在Envoy代理上收集调用相关数据，实现了对应用无侵入的分布式调用跟踪分析。 Istio实现分布式调用追踪的原理如下图所示:
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/distributed-tracing.png)
Envoy收集一个端到端调用中的各个分段的数据，并将这些调用追踪信息发送给Mixer，Mixer Adapter 将追踪信息发送给相应的服务后端进行处理。整个调用追踪信息的生成流程不需要应用程序介入，因此不需要将分布式跟踪相关代码注入到应用程序中。

>注意：应用仍需要在进行出口调用时将收到的入口请求中tracing相关的header转发出去，传递给调用链中下一个边车进行处理。

#### 度量收集
Istio 实现度量收集的原理如下图所示:
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/metrics-collecting.png)

Envoy收集指标相关的原始数据，如请求的服务，HTTP状态码，调用时延等，这些收集到的指标数据被送到Mixer，通过Mixer Adapters 将指标信息转换后发送到后端的监控系统中。由于Mixer使用了插件机制，后端监控系统可以根据需要在运行期进行动态切换。

#### 灰度发布
当应用上线以后，运维面临的一大挑战是如何能够在不影响已上线业务的情况下进行升级。无论进行了多么完善的测试，都无法保证线下测试时发现所有潜在故障。在无法百分百避免版本升级故障的情况下，需要通过一种方式进行可控的版本发布，把故障影响控制在可以接受的范围内，并可以快速回退。

可以通过灰度发布（又名金丝雀发布）来实现业务从老版本到新版本的平滑过渡，并避免升级过程中出现的问题对用户造成的影响。

Istio通过高度的抽象和良好的设计采用一致的方式实现了灰度发布。在发布新版本后，运维人员可以通过定制路由规则将特定的流量（如具有指定特征的测试用户）导入新版本服务中以进行测试。通过渐进受控地向新版本导入生产流量，可以最小化升级中出现的故障对用户的影响。

采用Istio进行灰度发布的流程如下图所示：

首先，通过部署新版本的服务，并将通过路由规则将金丝雀用户的流量导入到新版本服务中
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/canary-1.png)

测试稳定后，使用路由规则将生产流量逐渐导入到新版本系统中，如按5%，10%，50%，80%逐渐导入。
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/canary-2.png)

如果新版本工作正常，则最后将所有流量导入到新版本服务中，并将老版本服务下线；如中间出现问题，则可以将流量重新导回老版本，在新版本中修复故障后采用该流程重新发布。
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/canary-3.png)

#### 断路器
在微服务架构中，存在着许许多多的服务单元，若一个服务出现故障，就会因依赖关系形成故障蔓延，最终导致整个系统的瘫痪，这样的架构相较传统架构就更加的不稳定。为了解决这样的问题，因此产生了断路器模式。

断路器模式指，在某个服务发生故障时，断路器的故障监控向调用放返回一个及时的错误响应，而不是长时间的等待。这样就不会使得调用线程因调用故障被长时间占用，从而避免了故障在整个系统中的蔓延。

Istio 实现断路器的原理如下图所示:
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/circuitbreaker.png)
管理员通过destination policy设置断路触发条件，断路时间等参数。例如设置服务B发生10次5XX错误后断路15分钟。则当服务B的某一实例满足断路条件后，就会被从LB池中移除15分钟。在这段时间内，Envoy将不再把客户端的请求转发到该服务实例。

Istio的断路器还支持配置最大链接数，最大待处理请求数，最大请求数，每链接最大请求数，重试次数等参数。当达到设置的最大请求数后，新发起的请求会被Envoy直接拒绝。
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/circuitbreaker-parameters.png)

#### 故障注入
对于一个大型微服务应用而言，系统的健壮性非常重要。在微服务系统中存在大量的服务实例，当部分服务实例出现问题时，微服务应用需要具有较高的容错性，通过重试，断路，自愈等手段保证系统能够继续对外正常提供服务。因此在应用发布到生产系统强需要对系统进行充分的健壮性测试。

对微服务应用进行健壮性测试的一个最大的困难是如何对系统故障进行模拟。在一个部署了成百上千微服务的测试环境中，如果想通过对应用，主机或者交换机进行设置来模拟微服务之间的通信故障是非常困难的。

Istio通过服务网格承载了微服务之间的通信流量，因此可以在网格中通过规则进行故障注入，模拟部分微服务出现故障的情况，对整个应用的健壮性进行测试。

故障注入的原理如下图所示：
![](https://img.zhaohuabing.com/in-post/2018-03-29-what-is-service-mesh-and-istio/fault-injection.png)
测试人员通过Pilot向Envoy注入了一个规则，为发向服务MS-B的请求加入了指定时间的延迟。当客户端请求发向MSB-B时，Envoy会根据该规则为该请求加入时延，引起客户的请求超时。通过设置规则注入故障的方式，测试人员可以很方便地模拟微服务之间的各种通信故障，对微服务应用的健壮性进行较为完整的模拟测试。

## 总结
服务网格为微服务提供了一个对应用程序透明的安全、可靠的通信基础设施层。采用服务网格后，微服务应用开发人员可以专注于解决业务领域问题，将一些通用问题交给服务网格处理。采用服务网格后，避免了代码库带来的依赖，可以充分发挥微服务的异构优势，开发团队可以根据业务需求和开发人员能力自由选择技术栈。

Istio具有良好的架构设计，提供了强大的二次开发扩展性和用户定制能力。虽然Istio目前还处于beta阶段，但已经获得众多知名公司和产品的支持，是一个非常具有前景的开源服务网格开源项目。

## 参考

* [Istio online documentation](https://istio.io/docs/)
* [Pattern: Service Mesh](http://philcalcado.com/2017/08/03/pattern_service_mesh.html)
* [Mixer and the SPOF Myth](https://istio.io/blog/2017/mixer-spof-myth.html)
