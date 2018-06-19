---
layout:     post
title:      "Distributed Consensus"
subtitle:   "Bitcoin and Cryptocurrency Technologies-Week 2"
excerpt:    "Distributed Consensus"
date:       2018-05-27
author:     "赵化冰"
image: "https://img.zhaohuabing.com/in-post/2018-05-06-cryptocurrency_week1/bitcoin_consensus.jpg"
description: "How the nodes in the bitcoin network reach consensus on the transactions?"
published: true 
tags:
    - Cryptocurrency
    - Blockchain
    - Bitcoin
    - Digital Signature
categories: [ "Note" ]
URL: "/2018/05/26/cryptocurrency_week2_distributed_consenus/"
---

> This series of articles are my notes of "Bitcoin and Cryptocurrency Technologies" online course.
<!--more-->
## Decentralize ScroogeCoin: Distributed Consensus
Bitcoin is a peer to peer network.   When Alice wants to pay Bob:    
She broadcasts the transaction to all Bitcoin nodes 
![Transfer Bitcoin](http://img.zhaohuabing.com/in-post/2018-05-27-cryptocurrency_week2_distributed_consenus/bitcoin-network.png)
The consensus of Bitcoin network:
* The content of transactions
* The order in which these transactions happened

Transactions are put into blocks, and these blocks are linked one by one as a blockchain.
## Consensus algorithm
* New transactions are broadcast to all nodes in Bitcoin network
* Each node collects transactions into a block
* In each round a random node gets to broadcasts its block     
Actually, It's the node first figure out the mathematical problem of Bitcoin
* Other nodes accept the new block only if all transactions in it are valid(unspent, valid signature)
* Nodes express their acceptance of  the block by including its hash in the next block they create, in another word, put the block in their local copy of the blockchain

## Potential attacks 
### Steal other user's Bitcoin      
It's impossible because attackers can't forge other user's signature, so he can't propose a valid transaction to transfer other user's coins to himself. It's the security feature of cryptographic technology Bitcoin depends on.
### Denying Services    
The attacker rejects any transactions originate from a specific user. It's not a good attack because other honest nodes will propose these transactions.
### Double spending
The attacker creates two transactions, which transfer the same coins to two different addresses. In theory, these two transactions have no difference from the technology point of view. Which one is valid is only a human moral judgement.

Solution: The rule of Bitcoin is that honest nodes always chose the longest valid branch and append the next block to that branch when there is more than one branch. So the more blocks are appended to the branch which your transaction is in, more likely this branch will be ultimately recognized by the Bitcoin network.  

The suggested number is 6, experience shows that after 6 blocks have been appended to the block which your transaction is in, you can almost be sure this branch will not become an orphan branch in the future. So if you're selling something to someone，after receiving the payment by Bitcoin, you can wait until 6 more blocks are appended next to your block, then you complete this transaction and send the payer the product.
![Transfer Bitcoin](http://img.zhaohuabing.com/in-post/2018-05-27-cryptocurrency_week2_distributed_consenus/double-spending-attack.png)
> There is no guarantee that a transaction is in consensus branch, but we assume the probability is almost 100% after 6 confirmation.

I'm wondering: Does this means to avoid the potential risk of double spending attack, we always have to wait about one hour to complete a transaction?

It seems like that, more information can be found at these two links. I think it's a big issue for Bitcoin, an hour is too long compared with nearly real-time confirmation of a traditional "centralized bank transaction".

![](http://img.zhaohuabing.com/in-post/2018-05-27-cryptocurrency_week2_distributed_consenus/confirmation-time.png)

* [How long does it take for a Bitcoin transaction to be confirmed?](https://coincenter.org/entry/how-long-does-it-take-for-a-bitcoin-transaction-to-be-confirmed)
* [Average Confirmation Time of Bitcoin](https://blockchain.info/charts/avg-confirmation-time?timespan=30days)
