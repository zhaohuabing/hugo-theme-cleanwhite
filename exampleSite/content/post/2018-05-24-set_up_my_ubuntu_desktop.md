---
layout:     post
title:      "Everything about Setting Up My Ubuntu Desktop"
description: "Everything about setting up my own ubuntu desktop, it's just a Note in case I need it later"
excerpt: "Everything about setting up my own ubuntu desktop, it's just a Note in case I need it later"
date:    2018-05-24
author:     "赵化冰"
image: "/img/2018-05-23-service_2_service_auth/background.jpg"
published: true 
tags:
    - ubuntu 
URL: "/2018/05/24/set_up_my_ubuntu_desktop/"
categories: [ "Tips" ]    
---

## Generate SSH Key Pair

```
ssh-keygen -C "zhaohuabing@gmail.com"
```

## Shadowsocks

Install shadowsokcs    

```
sudo apt-get install python3-pip

sudo pip3 install shadowsocks
```

Create config at ```config/shadowsocks.json```, with the following content:    

```
{
	"server":"remote-shadowsocks-server-ip-addr",
	"server_port":443,
	"local_address":"127.0.0.1",
	"local_port":1080,
	"password":"your-passwd",
	"timeout":300,
	"method":"aes-256-cfb",
	"fast_open":false,
	"workers":1
}
```

Start a local socks proxy 

```
sudo sslocal -c config/shadowsocks.json -d start
```

In case there is an openssl error, modify shadowsocks source file.

```
sudo vi /usr/local/lib/python3.6/dist-packages/shadowsocks/crypto/openssl.py 

:%s/cleanup/reset/gc
```

Convert shadowsocks socks proxy to http proxy

```
sudo apt-get install polipo

echo "socksParentProxy = localhost:1080" | sudo tee -a /etc/polipo/config 
sudo service polipo restart
```

Http proxy now is available at port 8123

# Set bing wallpaper as desktop background

```
sudo add-apt-repository ppa:whizzzkid/bingwallpaper
sudo apt-get update
sudo apt-get install bingwallpaper
```

# Use vim mode in bash

```
echo 'set -o vi'>> ~/.bashrc
```
