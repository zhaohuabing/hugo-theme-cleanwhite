---
layout:     post
title:      "使用脚本和定时任务自动设置windows HTTP 代理服务器"
subtitle:   ""
description: "使用Visual Basic Script脚本和Windows定时任务自动设置windows HTTP 代理服务器。"
author:     "赵化冰"
date:     2017-11-23
image: ""
published: true
tags:
    - Tips
URL: "/2017/11/23/windows-proxy-scripts/"
categories: [ Tips ]
---

## 问题

我非常愿意在日程使用的工作工具上进行投资，好的工具可以提升效率，因为工具的问题导致思维中断非常让人沮丧。我在办公室使用一台ThinkPad笔记本，笔记本是公司发的，我自己花钱升级了SSD，内存，安装的是Win10，秒级启动，安装vagrant和virtualbox后，用Linux虚机进行开发也很顺手。但一个小代理服务器设置的小问题却影响了我使用笔记本处理事务的体验。
<!--more-->
由于工作需要，我回家也会经常带着笔记本，以在晚上开会和处理一些工作上的事情（是的，悲催的加班狗），因此笔记本的网络会在家里和办公室网络之间切换。在公司网络上要设置浏览器HTTP代理为公司代理，回到家后又需要把代理服务器设置修改回来。虽然步骤不多，但是每天都至少要重复两次。有时候打开笔记想要上网处理一些事情，首先要修改代理服务器，很是影响思维的流畅性。因此希望可以实现在笔记本连上网络时直接根据所连接的网络自动修改代理服务器设置，以避免影响使用笔记本进行事务处理的连续性。

## 思路

根据要解决的问题：“笔记本连上网络时直接根据所连接的网络自动修改代理服务器” ，需要一个修改代理服务器的脚本和一个触发脚本的机制。可以通过windows vbs脚本来修改代理服务器，vbs是visual basic的脚本版，语法和visual basic类似，可以直接在windows上执行，并可以操作windows中的设置，因此可以用来修改代理服务器。有了脚本后，为了避免每次手动执行脚本，可以使用windows定时任务来自动触发脚本执行。

## 脚本

注意需要将下面脚本中的proxy_server的值改为你网络环境中的代理服务器的IP和端口。
该脚本根据IP地址的范围来判断是否处于办公环境，如果IP为10.*的网络，则认为在办公环境中，设置代理服务器；否则就认为是在家里的网络中，删除代理服务器。如果你的IP范围不同，可以根据实际情况修改。将脚本保存为setproxy.vbs。

``` 
Const proxy_server="http://your_proxy_server:port"
Const ip_prefix="10"

If isIPInCompany() then
  setProxy()
else
  clearProxy()
End If
WScript.Quit

Function isIPInCompany()
    Set NicList = GetObject("winmgmts:").InstancesOf("Win32_NetworkAdapterConfiguration")
    For Each Nic in NicList
        If Nic.IPEnabled then
            StrIP = Nic.IPAddress(i)
            if Left(StrIP,2) = ip_prefix then
                isIPInCompany = true
                Exit Function
            else
                isIPInCompany = false
            End If
        End If
    Next
End Function

Sub setProxy()
  Set objShell = WScript.CreateObject("WScript.Shell")
  RegLocate = "HKEY_CURRENT_USER/Software/Microsoft\Windows\CurrentVersion\Internet Settings\ProxyServer"
  objShell.RegWrite RegLocate,proxy_server,"REG_SZ"
  RegLocate = "HKEY_CURRENT_USER/Software/Microsoft\Windows\CurrentVersion\Internet Settings\ProxyEnable"
  objShell.RegWrite RegLocate,"1","REG_DWORD"
  MsgBox "HTTP Proxy is enabled"
End Sub

Sub clearProxy()
  Set objShell = WScript.CreateObject("WScript.Shell")
  RegLocate = "HKEY_CURRENT_USER/Software/Microsoft\Windows\CurrentVersion\Internet Settings\ProxyServer"
  objShell.RegWrite RegLocate,"0.0.0.0:80","REG_SZ"
  RegLocate = "HKEY_CURRENT_USER/Software/Microsoft\Windows\CurrentVersion\Internet Settings\ProxyEnable"
  objShell.RegWrite RegLocate,"0","REG_DWORD"
  MsgBox "HTTP Proxy is disabled"
End Sub
```

## 采用windows 计划任务触发

windows任务可以通过事件触发，因此通过连接到网络的事件来触发设置代理的脚本执行，这样当笔记本电脑一连上网络，代理服务器就会自动设置好了。
任务的触发条件需要选择:
Log: Microsoft-Windows-NetworkProfile/Operational
Source: NetworkProfile
Event ID: 10000

执行动作选择刚才创建的脚本就可以了。

![Windows任务触发条件](http://img.zhaohuabing.com/in-post/windows-proxy-script/windows-task-trigger.PNG)



