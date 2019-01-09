---
layout:     post

title:      "微服务安全沉思录之二"
subtitle:   "服务间认证与鉴权"
description: "除来自用户的访问请求以外，微服务应用中的各个微服务相互之间还有大量的访问,根据应用系统数据敏感程度不同，对于系统内微服务的访问也需要进行相应的安全控制。"
showonlyimage: false
excerpt: "除来自用户的访问请求以外，微服务应用中的各个微服务相互之间还有大量的访问,根据应用系统数据敏感程度不同，对于系统内微服务的访问也需要进行相应的安全控制。"
author:     "赵化冰"
date:     2018-05-23T15:00:00
image: "https://img.zhaohuabing.com/in-post/2018-05-23-service_2_service_auth/background.jpg"
published: true 
tags:
    - Microservice
    - Security
URL: "/2018/05/23/service_2_service_auth/"
categories: [ Tech ]    
---


## 服务间认证与鉴权

除来自用户的访问请求以外，微服务应用中的各个微服务相互之间还有大量的访问，包括下述场景：
* 用户间接触发的微服务之间的相互访问<BR>
  例如在一个网上商店应用中，用户访问购物车微服务进行结算时，购物车微服务可能需要访问用户评级微服务获取用户的会员级别，以得到用户可以享受购物折扣。 
* 非用户触发的微服务之间的相互访问<BR>
  例如数据同步或者后台定时任务导致的微服务之间的相互访问。

根据应用系统的数据敏感程度的不同，对于系统内微服务的相互访问可能有不同的安全要求。
<!--more-->
### 对微服务之间的相互访问不进行安全控制
在某些场景下，可以假设同一应用中微服务之间的相互访问都是可信的。在这种情况下，应用依赖于内部网络的防火墙及其他网络安全措施来保证安全性。在这种情况对入侵者攻击进入内部网络后没有保护措施。入侵者可以对微服务间的通信进行典型的中间人攻击，例如窃听通信内容，伪造和修改通信数据，甚至假装为一个合法的微服务进行通信。

### 采用Service Account(服务账号)进行安全控制
“内部网络中微服务之间的所有通信都是可信的”这个假设在某些场景下是不成立的，特别是在微服务中保存有用户信息这种非常重要的数据的情况下。将敏感信息直接暴露在内部攻击下的做法是非常危险的。 解决该问题的一种方案是使用服务账号来对微服务之间的相互访问进行控制。

用户权限控制的一个普遍方法是使用”用户账号（User Account）”来标识一个系统用户，并对其进行身份认证和操作鉴权。类似地，可以为系统中每一个服务也创建一个账号，称为”服务账号(Service Accout)“。 该服务账号表示了微服务的身份，以用于控制该微服务对系统中其它微服务的访问权限，如可以对哪些微服务的哪些资源进行何种操作。当一个微服务访问另一个微服务时，被访问的微服务需要验证访问者的服务账号，以确定其身份和资源操作权限。

#### SPIFEE标准
[Secure Production Identity Framework For Everyone (SPIFFE)](https://spiffe.io/)是一套服务之间相互进行身份识别的标准，主要包含以下内容：
* SPIFFE ID标准，SPIFFE ID是服务的唯一标识，实现为统一资源标识"Uniform Resource Identifier (URI)”符。
* SVID(SPIFFE Verifiable Identity Document)标准,将SPIFFE ID编码到一个加密的可验证文档中。
* 颁发/撤销 SVID的一套API标准。

SPIFFE SVID目前支持的实现方式是X.509数字证书，在x.509 SVID中，采用X.509数字证书的SAN(Subject Alternative Name)扩展字段来保存SPIFFE ID。

#### Istio Auth开源实现
Istio服务网格项目的Auth组件实现了SPIFFE标准，可以为网格中服务颁发符合SPIFFE SVID标准的证书，并为服务提供身份认证，细粒度的操作鉴权以及通信加密。Istio的架构如下图所示：
![](https://img.zhaohuabing.com/in-post/2018-05-23-service_2_service_auth/auth.png)

Istio Auth采用了Kubernetes的service account来作为服务标识，其SPIFFE ID的格式为spiffe://&lt;domain&gt;/ns/&lt;namespace&gt;/sa/&lt;serviceaccount&gt;，其中各组成部分如下：
* domain 域名
* namspace kubernetes service account所在的Namespace
* serviceaccout kubernetes中定义的service account名

Istio Auth提供了一个用于颁发证书的CA。在服务部署时，CA监听Kubernetes API Server, 为集群中的每一个Service Account创建一对密钥和证书。当Pod创建时，Kubernetes根据该Pod关联的Service Account将密钥和证书以Kubernetes Secrets资源的方式加载为Pod的Volume，以供Envoy使用。

在服务运行时，服务间的通信被Envoy接管，Envoy使用证书在服务间进行双向SSL握手验证通信双方服务的身份，并提供加密的通信通道。

### 采用用户身份进行安全控制
采用服务账号进行服务间交互的鉴权不能控制到用户粒度的访问权限，这在某些场景下可能出现数据泄露问题。

例如在网上商店应用中，用户访问购物车微服务进行结算时，购物车微服务需要访问另一个微服务中的用户历史购物数据。如果只采用服务账号对购物车微服务进行安全控制，存在用户A通过购物车微服务向后端微服务发起一个获取用户B历史购物数据请求的风险。因为后端的微服务并不能得知发起请求的是哪一个用户，因此会不加判断地返回购物车微服务请求的用户历史购物数据。

解决方案是将用户信息从用户直接访问的第一个微服务向后传递到调用链上的每一个微服务，调用链上的每一个微服务都使用该用户信息对用户能访问的资源进行判断。在一个大型的微服务系统中，一个调用链可能会非常长，导致该方案的实现比较复杂。

我们需要根据应用的使用场景，每个微服务中数据的敏感程度来决定选择哪一种服务间安全的实施方式。
