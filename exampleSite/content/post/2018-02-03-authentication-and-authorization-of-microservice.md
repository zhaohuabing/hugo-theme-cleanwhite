---
layout:     post 
title:      "如何构建安全的微服务应用？"
subtitle:   "微服务架构下的认证和鉴权方案探讨"
description: "微服务架构的引入为软件应用带来了诸多好处：包括小开发团队，缩短开发周期，语言选择灵活性，增强服务伸缩能力等。与此同时，也引入了分布式系统的诸多复杂问题。其中一个挑战就是如何在微服务架构中实现一个灵活，安全，高效的认证和鉴权方案。本文将尝试就此问题进行一次比较完整的探讨。"
excerpt: "微服务架构的引入为软件应用带来了诸多好处：包括小开发团队，缩短开发周期，语言选择灵活性，增强服务伸缩能力等。与此同时，也引入了分布式系统的诸多复杂问题。其中一个挑战就是如何在微服务架构中实现一个灵活，安全，高效的认证和鉴权方案。本文将尝试就此问题进行一次比较完整的探讨。"
date:       2018-02-03 12:00:00
author:     "赵化冰"
image: "/img/2018-02-03-authentication-and-authorization-of-microservice/AuthenticationTrack.jpeg"
published: true
tags:
    - Microservice
    - Security
URL: "/2018/05/22/user_authentication_authorization/"
categories: [ Tech ]
---

## 前言

微服务架构的引入为软件应用带来了诸多好处：包括小开发团队，缩短开发周期，语言选择灵活性，增强服务伸缩能力等。与此同时，也引入了分布式系统的诸多复杂问题。其中一个挑战就是如何在微服务架构中实现一个灵活，安全，高效的认证和鉴权方案。本文将尝试就此问题进行一次比较完整的探讨。
<!--more-->
## 单体应用的实现方式
在单体架构下，整个应用是一个进程，在应用中，一般会用一个安全模块来实现用户认证和鉴权。

用户登录时，应用的安全模块对用户身份进行验证，验证用户身份合法后，为该用户生成一个会话(Session)，并为该Session关联一个唯一的编号(Session Id)。Session是应用中的一小块内存结构，其中保存了登录用户的信息，如User name, Role, Permission等。服务器把该Session的Session Id返回给客户端，客户端将Session Id以cookie或者URL重写的方式记录下来，并在后续请求中发送给应用，这样应用在接收到客户端访问请求时可以使用Session Id验证用户身份，不用每次请求时都输入用户名和密码进行身份验证。
> 备注：为了避免Session Id被第三者截取和盗用，客户端和应用之前应使用TLS加密通信，session也会设置有过期时间。

![单体应用用户登录认证序列图](/img/2018-02-03-authentication-and-authorization-of-microservice/monolith-user-login.png)
<center>单体应用用户登录认证序列图</center>

客户端访问应用时，Session Id随着HTTP请求发送到应用，客户端请求一般会通过一个拦截器处理所有收到的客户端请求。拦截器首先判断Session Id是否存在，如果该Session Id存在，就知道该用户已经登录。然后再通过查询用户权限判断用户能否执行该此请求，以实现操作鉴权。
![单体应用用户操作鉴权序列图](/img/2018-02-03-authentication-and-authorization-of-microservice/monolith-user-request.png)
<center>单体应用用户操作鉴权序列图</center>

## 微服务认证和鉴权面临的问题
在微服务架构下，一个应用被拆分为多个微服务进程，每个微服务实现原来单体应用中一个模块的业务功能。应用拆分后，对每个微服务的访问请求都需要进行认证和鉴权。如果参考单体应用的实现方式会遇到下述问题：
* 认证和鉴权逻辑需要在每个微服务中进行处理，需要在各个微服务中重复实现这部分公共逻辑。虽然我们可以使用代码库复用部分代码，但这又会导致所有微服务对特定代码库及其版本存在依赖，影响微服务语言/框架选择的灵活性。
* 微服务应遵循单一职责原理，一个微服务只处理单一的业务逻辑。认证和鉴权的公共逻辑不应该放到微服务实现中。 
* 为了充分利用微服务架构的好处，实现微服务的水平扩展(Scalability)和弹性(Resiliency),微服务最好是无状态的。因此不建议使用session这种有状态的方案。
* 微服务架构下的认证和鉴权涉及到场景更为复杂，涉及到用户访问微服务应用，第三方应用访问微服务应用，应用内多个微服务之间相互访问等多种场景，每种场景下的认证和鉴权方案都需要考虑到，以保证应用程序的安全性。
![微服务认证和鉴权涉及到的三种场景](/img/2018-02-03-authentication-and-authorization-of-microservice/auth-scenarios.png)
<center>微服务认证和鉴权涉及到的三种场景</center>

## 微服务认证和鉴权的技术方案

### 用户身份认证
一个完整的微服务应用是由多个相互独立的微服务进程组成的，对每个微服务的访问都需要进行用户认证。如果将用户认证的工作放到每个微服务中，应用的认证逻辑将会非常复杂。因此需要考虑一个SSO（单点登录）的方案，即用户只需要登录一次，就可以访问所有微服务提供的服务。 由于在微服务架构中以API Gateway作为对外提供服务的入口，因此可以考虑在API Gateway处提供统一的用户认证。

### 用户状态保持
HTTP是一个无状态的协议，对服务器来说，用户的每次HTTP请求是相互独立的。互联网是一个巨大的分布式系统，HTTP协议作为互联网上的一个重要协议，要考虑到大量应用访问的效率问题。无状态意味着服务端可以把客户端的请求根据需要发送到集群中的任何一个节点，HTTP的无状态设计对负载均衡有明显的好处，由于没有状态，用户请求可以被分发到任意一个服务器，应用也可以在靠近用户的网络边缘部署缓存服务器。对于不需要身份认证的服务，例如浏览新闻网页等，这是没有任何问题的。但很多服务如网络购物，企业管理系统等都需要对用户的身份进行认证，因此需要在HTTP协议基础上采用一种方式保存用户的登录状态，避免用户每发起一次请求都需要进行验证。

传统方式是在服务器端采用Cookie来保存用户状态，由于在服务器是有状态的，对服务器的水平扩展有影响。在微服务架构下建议采用Token来记录用户登录状态。

Token和Seesion主要的不同点是存储的地方不同。Session是集中存储在服务器中的；而Token是用户自己持有的，一般以cookie的形式存储在浏览器中。Token中保存了用户的身份信息，每次请求都会发送给服务器，服务器因此可以判断访问者的身份，并判断其对请求的资源有没有访问权限。

Token用于表明用户身份，因此需要对其内容进行加密，避免被请求方或者第三者篡改。[JWT(Json Web Token)](https://jwt.io)是一个定义Token格式的开放标准(RFC 7519),定义了Token的内容，加密方式，并提供了各种语言的lib。

JWT Token的结构非常简单，包括三部分：
* Header<BR>
头部包含类型,为固定值JWT。然后是JWT使用的Hash算法。
```
{
  "alg": "HS256",
  "typ": "JWT"
}
```
* Payload<BR>
包含发布者，过期时间，用户名等标准信息，也可以添加用户角色，用户自定义的信息。
```
{
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true
}
```
* Signature<BR>
Token颁发方的签名，用于客户端验证Token颁发方的身份，也用于服务器防止Token被篡改。
签名算法
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret)
```

这三部分使用Base64编码后组合在一起，成为最终返回给客户端的Token串，每部分之间采用"."分隔。下图是上面例子最终形成的Token
![](https://cdn.auth0.com/content/jwt/encoded-jwt3.png)
采用Token进行用户认证，服务器端不再保存用户状态，客户端每次请求时都需要将Token发送到服务器端进行身份验证。Token发送的方式[rfc6750](https://tools.ietf.org/html/rfc6750)进行了规定，采用一个 Authorization: Bearer HHTP Header进行发送。
```
Authorization: Bearer mF_9.B5f-4.1JqM
```
采用Token方式进行用户认证的基本流程如下图所示：
1. 用户输入用户名,密码等验证信息，向服务器发起登录请求
1. 服务器端验证用户登录信息，生成JWT token
1. 服务器端将Token返回给客户端，客户端保存在本地（一般以Cookie的方式保存）
1. 客户端向服务器端发送访问请求，请求中携带之前颁发的Token
1. 服务器端验证Token，确认用户的身份和对资源的访问权限，并进行相应的处理（拒绝或者允许访问）
![](https://cdn.auth0.com/content/jwt/jwt-diagram.png)
<center>采用Token进行用户认证的流程图</center>

### 实现单点登录
单点登录的理念很简单，即用户只需要登录应用一次，就可以访问应用中所有的微服务。API Gateway提供了客户端访问微服务应用的入口，Token实现了无状态的用户认证。结合这两种技术，可以为微服务应用实现一个单点登录方案。

用户的认证流程和采用Token方式认证的基本流程类似，不同之处是加入了API Gateway作为外部请求的入口。

用户登录
1. 客户端发送登录请求到API Gateway
2. API Gateway将登录请求转发到Security Service
3. Security Service验证用户身份，并颁发Token

用户请求
1. 客户端请求发送到API Gateway
1. API Gateway调用的Security Service对请求中的Token进行验证，检查用户的身份
2. 如果请求中没有Token，Token过期或者Token验证非法，则拒绝用户请求。
3. Security Service检查用户是否具有该操作权
4. 如果用户具有该操作权限，则把请求发送到后端的Business Service，否则拒绝用户请求
![采用API Gateway实现微服务应用的SSO](/img/2018-02-03-authentication-and-authorization-of-microservice/api-gateway-sso.png)
<center>采用API Gateway和Token实现微服务应用的单点登录</center>

### 用户权限控制
用户权限控制有两种做法，在API Gateway处统一处理，或者在各个微服务中单独处理。
#### API Gateway处进行统一的权限控制
客户端发送的HTTP请求中包含有请求的Resource及HTTP Method。如果系统遵循REST规范，以URI资源方式对访问对象进行建模，则API Gateway可以从请求中直接截取到访问的资源及需要进行的操作，然后调用Security Service进行权限判断，根据判断结果决定用户是否有权限对该资源进行操作，并转发到后端的Business Service。这种实现方式API Gateway处统一处理鉴权逻辑，各个微服务不需要考虑用户鉴权，只需要处理业务逻辑，简化了各微服务的实现。
#### 由各个微服务单独进行权限控制
如果微服务未严格遵循REST规范对访问对象进行建模，或者应用需要进行定制化的权限控制，则需要在微服务中单独对用户权限进行判断和处理。这种情况下微服务的权限控制更为灵活，但各个微服务需要单独维护用户的授权数据，实现更复杂一些。

### 第三方应用接入
对于第三方应用接入的访问控制，有两种实现方式：
#### API Token
第三方使用一个应用颁发的API Token对应用的数据进行访问。该Token由用户在应用中生成，并提供给第三方应用使用。在这种情况下，一般只允许第三方应用访问该Token所属用户自身的数据，而不能访问其他用户的敏感私有数据。

例如Github就提供了Personal API Token功能，用户可以在[Github的开发者设置界面](https://github.com/settings/tokens)中创建Token，然后使用该Token来访问Github的API。在创建Token时，可以设置该Token可以访问用户的哪些数据，如查看Repo信息，删除Repo，查看用户信息，更新用户信息等。

使用API Token来访问Github API
```
curl -u zhaohuabing:fbdf8e8862252ed0f3ba9dba4e328c01ac93aeec https://api.github.com/user

```
使用API Token而不是直接使用用户名/密码来访问API的好处是降低了用户密码暴露的风险，并且可以随时收回Token的权限而不用修改密码。


由于API Token只能访问指定用户的数据，因此适合于用户自己开发一些脚本或小程序对应用中自己的数据进行操作。
#### OAuth
某些第三方应用需要访问不同用户的数据，或者对多个用户的数据进行整合处理，则可以考虑采用OAuth。采用OAuth，当第三方应用访问服务时，应用会提示用户授权第三方应用相应的访问权限，根据用户的授权操作结果生成用于访问的Token，以对第三方应用的操作请求进行访问控制。

同样以Github为例，一些第三方应用如Travis CI，GitBook等就是通过OAuth和Github进行集成的。
OAuth针对不同场景有不同的认证流程，一个典型的认证流程如下图所示：
* 用户向OAuth客户端程序发起一个请求，OAuth客户端程序在处理该请求时发现需要访问用户在资源服务器中的数据。
* 客户端程序将用户请求重定向到认证服务器，该请求中包含一个callback的URL。
* 认证服务器返回授权页面，要求用户对OAuth客户端的资源请求进行授权。
* 用户对该操作进行授权后，认证服务器将请求重定向到客户端程序的callback url，将授权码返回给客户端程序。
* 客户端程序将授权码发送给认证服务器，请求token。
* 认证服务器验证授权码后将token颁发给客户端程序。
* 客户端程序采用颁发的token访问资源，完成用户请求。

>备注：
>1. OAuth中按照功能区分了资源服务器和认证服务器这两个角色，在实现时这两个角色常常是同一个应用。将该流程图中的各个角色对应到Github的例子中，资源服务器和认证服务器都是Github，客户端程序是Travis CI或者GitBook，用户则是使用Travis CI或者GitBook的直接用户。
>
>2. 有人可能会疑惑在该流程中为何要使用一个授权码(Authorization Code)来申请Token，而不是由认证服务器直接返回Token给客户端。OAuth这样设计的原因是在重定向到客户端Callback URL的过程中会经过用户代理（浏览器），如果直接传递Token存在被窃取的风险。采用授权码的方式，申请Token时客户端直接和认证服务器进行交互，并且认证服务期在处理客户端的Token申请请求时还会对客户端进行身份认证，避免其他人伪造客户端身份来使用认证码申请Token。
>下面是一个客户端程序采用Authorization Code来申请Token的示例，client_id和client_secret被用来验证客户端的身份。
>
>```
>POST /oauth/token HTTP/1.1
>Host: authorization-server.com
>  			
>grant_type=authorization_code
>&code=xxxxxxxxxxx
>&redirect_uri=https://example-app.com/redirect
>&client_id=xxxxxxxxxx
>&client_secret=xxxxxxxxxx
>```


![OAuth认证流程](/img/2018-02-03-authentication-and-authorization-of-microservice/oauth_web_server_flow.png)
<center>OAuth认证流程</center>


另外在谈及OAuth时，我们需要注意微服务应用作为OAuth客户端和OAuth服务器的两种不同场景:
  
在实现微服务自身的用户认证时，也可以采用OAuth将微服务的用户认证委托给一个第三方的认证服务提供商，例如很多应用都将用户登录和微信或者QQ的OAuth服务进行了集成。
  
第三方应用接入和微服务自身用户认证采用OAuth的目的是不同的，前者是为了将微服务中用户的私有数据访问权限授权给第三方应用，微服务在OAuth架构中是认证和资源服务器的角色；而后者的目的是集成并利用知名认证提供服务商提供的OAuth认证服务，简化繁琐的注册操作，微服务在OAuth架构中是客户端的角色。
  
因此在我们需要区分这两种不同的场景，以免造成误解。

### 微服务之间的认证
除了来自用户和第三方的北向流量外，微服务之间还有大量的东西向流量，这些流量可能在同一个局域网中，也可能跨越不同的数据中心,这些服务间的流量存在被第三方的嗅探和攻击的危险，因此也需要进行安全控制。

通过双向SSL可以实现服务之间的相互身份认证，并通过TLS加密服务间的数据传输。需要为每个服务生成一个证书，服务之间通过彼此的证书进行身份验证。在微服务运行环境中，可能存在大量的微服务实例，并且微服务实例经常会动态变化，例如随着水平扩展增加服务实例。在这种情况下，为每个服务创建并分发证书变得非常困难。我们可以通过创建一个私有的证书中心(Internal PKI/CA)来为各个微服务提供证书管理如颁发、撤销、更新等。


## 参考

* [How We Solved Authentication and Authorization in Our Microservice Architecture](https://initiate.andela.com/how-we-solved-authentication-and-authorization-in-our-microservice-architecture-994539d1b6e6)
* [How to build your own public key infrastructure](https://blog.cloudflare.com/how-to-build-your-own-public-key-infrastructure/)
* [OAuth 2.0 Authorization Code Request](https://www.oauth.com/oauth2-servers/access-tokens/authorization-code-request/)
* [PKI/CA工作原理及架构](https://www.jianshu.com/p/c65fa3af1c01)
* [深入聊聊微服务架构的身份认证问题](http://www.primeton.com/read.php?id=2390)


