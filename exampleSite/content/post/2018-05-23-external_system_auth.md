---
layout:     post
title:      "微服务安全沉思录之三"
subtitle:   "外部系统访问控制"
description: "一些外部的第三方系统可能需要访问系统内部的微服务。例如在网上商店的例子中，外部的推荐服务可能需要接入系统，以获取商店的商品目录信息。相对于内部服务之间的访问而言，外部系统的访问需要进行严格的安全控制。"
excerpt: "一些外部的第三方系统也可能需要访问系统内部的微服务。例如在网上商店的例子中，外部的推荐服务可能需要接入系统，以获取商店的商品目录信息。相对于内部服务之间的访问而言，外部系统的访问需要进行严格的安全控制。"
date:       2018-05-23T18:00:00
author:     "赵化冰"
image: "https://img.zhaohuabing.com/in-post/2018-05-23-external_system_auth/background.jpg"
published: true 
tags:
    - Microservice
    - Security
URL: "/2018/05/23/external_system_auth/"
categories: [ "Tech" ]    
---

## 外部系统访问控制
除用户访问和微服务之间的相互访问外，外部的第三方系统也可能需要访问系统内部的微服务。例如在上一篇博客的网上商店例子中，外部的推荐服务可能需要接入系统，以获取商店的商品目录信息。相对于内部服务之间的访问而言，外部系统的访问需要进行严格的安全控制。

### 使用账号进行控制
可以为外部系统创建一个用户账号，类似普通用户一样对外部系统的账号进行管理，并使用该账号对外部系统进行认证和权限控制。

采用这种方式的问题是难以处理用户相关的敏感数据。因为外部系统自身也是微服务系统中的一个用户账号，因此该外部系统只能访问该账号自身的数据和一些不敏感的公共数据，而不能访问和用户相关的数据。例如在网上商店的例子中，外部系统可以采用该方式访问商品目录信息，但不应允许访问用户历史购买记录，用户余额等信息。

### API Token
是一个API Token（又称API Key）可以控制对用户敏感数据的访问。微服务应用提供一个API Token的生成界面，用户登录后可以生成自己的API Token，并在第三方应用使用该API Token访问微服务的API。在这种情况下，一般只允许第三方应用访问该Token所属用户自身的数据，而不能访问其他用户的敏感私有数据。

例如Github就提供了Personal API Token功能，用户可以在[Github的开发者设置界面](https://github.com/settings/tokens)中创建Token，然后使用该Token来访问Github的API。在创建Token时，可以设置该Token可以访问用户的哪些数据，如查看Repo信息，删除Repo，查看用户信息，更新用户信息等。

使用API Token来访问Github API
```
curl -u zhaohuabing:fbdf8e8862252ed0f3ba9dba4e328c01ac93aeec https://api.github.com/user

```
> 不用试了,这不是我的真实API Token, just for demonstration :-)

使用API Token而不是直接使用用户名/密码来访问API的好处是降低了用户密码暴露的风险，并且可以随时收回Token的权限而不用修改密码。


由于API Token只能访问指定用户的数据，因此适合于用户自己开发一些脚本或小程序对应用中自己的数据进行操作。
### OAuth
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


![OAuth认证流程](https://img.zhaohuabing.com/in-post/2018-05-23-external_system_auth/oauth_web_server_flow.png)
<center>OAuth认证流程</center>


另外在谈及OAuth时，我们需要注意微服务应用作为OAuth客户端和OAuth服务器的两种不同场景:
  
在实现微服务自身的用户认证时，也可以采用OAuth将微服务的用户认证委托给一个第三方的认证服务提供商，例如很多应用都将用户登录和微信或者QQ的OAuth服务进行了集成。
  
第三方应用接入和微服务自身用户认证采用OAuth的目的是不同的，前者是为了将微服务中用户的私有数据访问权限授权给第三方应用，微服务在OAuth架构中是认证和资源服务器的角色；而后者的目的是集成并利用知名认证提供服务商提供的OAuth认证服务，简化繁琐的注册操作，微服务在OAuth架构中是客户端的角色。
  
因此在我们需要区分这两种不同的场景，以免造成误解。

## 后记

前两篇文章在在公众号发布后，有朋友提到还要注意登录密码明文问题、防止重放攻击、防止时间差攻击、防止脱裤后的彩虹表攻击...。的确，安全是一个庞大的话题，本系列文章只阐述了我关于微服务架构对应用安全带来的影响的一点小小思考。在产品开发和运维中，还需要对安全进行全方面的考虑，最好遵循一些业界的最佳实践，如采用完善的防火墙对外部流量进行隔离，采用加盐hash对用户密码进行存储，采用tls进行加密传输，对用户输入进行严格检查防止sql注入，采用经过验证的通用加密算法等等。

