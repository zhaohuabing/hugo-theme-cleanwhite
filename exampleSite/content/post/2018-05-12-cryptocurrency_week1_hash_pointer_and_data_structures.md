---
layout:     post
title:      "Hash Pointers and Data Structures"
subtitle:   "Bitcoin and Cryptocurrency Technologies-Week 1"
author:     "赵化冰"
date:       2018-05-12
image: "https://img.zhaohuabing.com/in-post/2018-05-06-cryptocurrency_week1/blockchain.png"
published: true
description: "Hash pointer is used to bulid some key data structures in cryptocurrency, such as Block chain and Merkel tree."
tags:
    - Cryptocurrency
    - Blockchain
    - Bitcoin
categories: [ "Note" ]
URL:: "/2018/05/12/cryptocurrency_week1_hash_pointer_and_data_structures/"

---

> This series of articles are my notes of "Bitcoin and Cryptocurrency Technologies" online course.

## Hash Pointer
Hash Pointer is comprised of two parts:
* Pointer to where some information is stored
* Cryptographic hash of that information    
The pointer can be used to get the information, the hash can be used to verify that information hasn't been changed    
![hashpointer](http://img.zhaohuabing.com/in-post/2018-05-12-cryptocurrency_week1_hash_pointer_and_data_structures/hashpointet.png)
<!--more-->

## Data Structures Built with Hash Pointers

### Blockchain
Hash pointers can be used to build a linked list, which is also called a blockchain.    
![blockchain](http://img.zhaohuabing.com/in-post/2018-05-12-cryptocurrency_week1_hash_pointer_and_data_structures/blockchian.png)

We should Note that the hash stored in the hash pointer is the hash of the whole data of the previous block, which also includes the hash pointer to the block before that one. This makes it's impossible to tamper a block in the blockchain without letting others know.

**Tamper Evident Property of Blockchain**    
We only need to keep the hash pointer to the last block of the blockchain. Then when somebody shows the whole blockchain later and claim the data in it is not modified, we can tell if any block in the chain is tampered by traversing the blocks backwards and verifying the hashes one by one.

**Explanation**    
* An attacker wants to tamper with one block of the chain, let's say, block 1.
* The attacker changed the content of block 1, because of "collision free" property of the hash function, he is not able to find another data which has the same hash with the old one. So now the hash of this modified block is also changed.
* To avoid others noticing the inconsistency, he also needs to change the hash pointer of that block in the next block, which is block 2.
* Now the content of block 2 is changed, so to make this story consistent, the hash pointer in block3 must be changed.
* Finally, the attacker goes to the hash pointer to the last block of the blockchain, which is a roadblock for him, because we keep and remember that hash pointer.

![tamper evident](http://img.zhaohuabing.com/in-post/2018-05-12-cryptocurrency_week1_hash_pointer_and_data_structures/tamper_evident.png)

### Merkle Tree
Merkle tree is a binary tree building with hash pointers. The leaves are data blocks, nodes further up in the tree are the hashes of their respective children.

![merkel tree](http://img.zhaohuabing.com/in-post/2018-05-12-cryptocurrency_week1_hash_pointer_and_data_structures/merkel_tree.png)

**Features**
* **Tamper evident**    
Just like blockchain, we only need to remember the hash pointer in the root (top-level node), then we can traverse down to any leaf data block to check if a node is in the tree or has it been tampered with.
* **Traversal efficiency**    
To verify a data block, we only need to traverse the path from the top to the leaf where the data is. So the complexity is O(log n), which is much more efficient compared with O(n) of a linked list blockchain.
* **None-membership proof**    
If Merkel tree is sorted, we can prove a given data is not in the tree: if the data before and after the given data are both in the tree and they're consecutive, so there's no space between them, this proves that the given data is not in three.

## Example Codes on GitHub
* [Blockchain Implementation in Java](https://github.com/zhaohuabing/blockchain)
* [Merkle Tree Implementation in Java](https://github.com/zhaohuabing/merkle-tree)
