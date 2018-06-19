---
layout:     post

title:      "Bitcoin Script"
subtitle:   "Bitcoin and Cryptocurrency Technologies-Week 3"
description: "Bitcoin Script is using to transfer coins instead of just signature and public key address, which allows more flexibilities for Bitcoin transactions"
author:     "赵化冰"
date:       2018-06-03
image: "https://img.zhaohuabing.com/in-post/2018-05-06-cryptocurrency_week1/bitcoin_2.jpg"
published: true 
tags:
    - Cryptocurrency
    - Blockchain
    - Bitcoin
    - Digital Signature
categories: [ Note ]
URL: "/2018/06/03/cryptocurrency_week3_bitcoin_script/"
---

> This series of articles are my notes of "Bitcoin and Cryptocurrency Technologies" online course.

Bitcoin Script is using to transfer coins instead of just signature and public key address, which allows more flexibilities for Bitcoin transactions.

## A Standard Transaction 
Let's say  Alice wants to spend some coins she received from a previous transaction, this is how the procedure looks like.
* Alice receives some coins from a previous transaction.  One of the outputs of that transaction specifies the public key of Alice to indicate that the coins in that output are transferred to Alice.
> Actually, it's the cryptographic hash of the public key in order to lower the risk that attacker might figure out the private key by the public key.
* Besides the public key hash, there's also some bitcoin script code in the output, which is called scriptPubkey. 
* In transaction 2, Alice wants to spend her coin, so she gives her signature to prove that she approve this transaction. She also specifies her full public key to prove her ownership of these coins. This combination is called scriptSig.
* SctiptPubkey and ScriptSig are concatenated to form a single, completed script. This script will run on Bitcoin nodes, if the output is true, then the transaction is valid and will proceed, otherwise, it's considered as invalid and will be abandoned.
![Bitcoin Transaction](http://img.zhaohuabing.com/in-post/2018-06-03-cryptocurrency_week3_bitcoin_script/standard_transaction.png)
* The most simple, standard script essentially does two things when it is executed: first, the script checks if the given public key in ScriptSig matches the public key hash in ScriptPubkey, then it validates the signature with the public key. The below table shows how the script is processed.
![Bitcoin Transaction](http://img.zhaohuabing.com/in-post/2018-06-03-cryptocurrency_week3_bitcoin_script/script_execution.png)  

## Check Multi-Signatures
Specifies N public keys, if T out of N signatures are verified as valid, the coins can be redeemed.(T<=N)
## Reference
* https://en.bitcoin.it/wiki/Script
