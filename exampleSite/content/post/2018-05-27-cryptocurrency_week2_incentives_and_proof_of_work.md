---
layout:     post

title:      "Incentives and Proof of Work"
subtitle:   "Bitcoin and Cryptocurrency Technologies-Week 2"
excerpt:    "Incentives and Proof of Work"
description: "How bitcoin system implements the mechanism to motivate the participants and how the participants prove their work?"
date:       2018-05-26
author:     "赵化冰"
image:      "https://img.zhaohuabing.com/in-post/2018-05-06-cryptocurrency_week1/bitcoin_mining.jpg"
published: true 
tags:
    - Cryptocurrency
    - Blockchain
    - Bitcoin
    - Digital Signature
categories: [ "Note" ]
URL: "/2018/05/26/cryptocurrency_week2_incentives_and_proof_of_work/"
---

> This series of articles are my notes of "Bitcoin and Cryptocurrency Technologies" online course.

## Incentive 
The mechanism to motivate nodes join the Bitcoin network and create blocks.
### Incentive 1: Block Reward
Creator of block gets to
* include special coin-creation transaction in the block
* choose reciptient address of this transaction (Of course, it is the miner's address)

Explanation: Because the coin-creation transaction is just like other transaction in that block, it will only be valid if the created block ends up in the consensus chain, it's the incentive which encourages the nodes to be honest, otherwise they can't get their rewards.

The value of the created coin is fixed in a period of 4 years, and it halves every 4 years.    
The reward of the first block(the Genesis block) was 50 BTC. Because the Genesis was created on 03/Jan/2009, now 9 years past, so the reward halved twice, the current reward is 12.5 BTC.   
The total number of BTC is 21 million, at the current rate, all the BTC will be mined out around 2140.

I would have the chance be a miner if I started this lesson in 2009, what a shame! :-(

![Bitcoin and Block Reward](http://img.zhaohuabing.com/in-post/2018-05-27-cryptocurrency_week2_incentives_and_proof_of_work/block_reward.png)

[Genesis Block](https://en.bitcoin.it/wiki/Genesis_block)    
[Bitcoin Block Reward Halving Countdown](https://www.bitcoinblockhalf.com/)

### Incentive 2: Transaction Fees
* Transaction creator can choose to make the output value less than the input value
* Remainder is a transaction fee and it goes to the block creator
Right now it's purely voluntary, like a tip. But after all the Bitcoins are mined out after 2140, it might become mandatory.

## Proof of Work
### Why Bitcoin network needs proof of work?

To select node who gets to propose the block based on their computing power(the proportion of computing power in the whole Bitcoin network), so the adversary can't simply create a lot of civil nodes to try to get more rewards.

### How to prove the work?

A hash puzzle needs computing power to solve: find a nonce to get a hash output falling into a small target space.

![Hash Puzzle](http://img.zhaohuabing.com/in-post/2018-05-27-cryptocurrency_week2_incentives_and_proof_of_work/hash-puzzle.png)

### PoW properties
* Difficult to Compute    
In Aug 2014, a node needs to try about 10^20 times to find a hash in the target space.    
* parameterizable cost    
Nodes automatically re-calculate the target every 2 weeks to keep the average time between blocks = 10 minutes.    
It means if a miner invests a fixed amount of hardware into Bitcoin mining, as time goes by, the BTC he can find during a certain period will be less because the mining ecosystem is growing, his proportion of computing power is decreasing.    
**probability(Alice wins the next block) = fraction of global hash power she controls**    
Why keep the time as 10 minutes: for efficiency, this allows to keep a certain number of transactions into one block 
 
## Key Security Assumption
Attacks are infeasible if the majority of the miners weighted by hash power follows the protocol because the competition of hash power can ensure the probability of the next block proposing by an honest node is higher than 50%.
