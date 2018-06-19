---
layout:     post
title:      "Cryptographic Hash Function"
subtitle:   "Bitcoin and Cryptocurrency Technologies-Week 1"
date:       2018-05-09 22:00:00
author:     "赵化冰"
image: "https://img.zhaohuabing.com/in-post/2018-05-06-cryptocurrency_week1/bitcoin_3.jpg"
description: "Hash function can produce a fixed lenght digest of any size of data, and the original data can not be found out if it's properly used."
published: true
tags:
    - Cryptocurrency
    - Blockchain
    - Bitcoin
categories: [ Note ]

URL: "/2018/05/07/cryptocurrency_week1_cryptographic_hash_function"
---

> This series of articles are my notes of "Bitcoin and Cryptocurrency Technologies" online course.

## Hash Function
Hash function is a mathematical function:*H(X)=Y*
* H:  A hash function which takes an input value and calculates an output value
* X: Input of the hash function, it could be any data of any length
* Y: Output of the hash function: a fix-size bit(, it can be 256, 384, 516 ..., Bitcoin uses 256)
<!--more-->

## Cryptographic Properties

A hash function which is used for cryptographic purposes should have these properties:

### Collision Free

**Definition:**

A hash function H is said to be collision free if:    
It's infeasible to find two values X1 and X2, such that *X1!=X2*, yet *H(X1)=H(X2)*  
Or in other words,  
It's infeasible to find two inputs which can produce the same outputs. 

**Explaination:**

The collision does exist because the inputs can be any data and the outputs are only 2 to 256 possibilities. 

But for a good hash function, it's just impossible to find them in an acceptable time frame even use all the computers to solve this together on the earth.

We can use this property of hash functions to create a digest for a given data.  By comparing the hash digests, we can tell if a big file is modified or corrupted during a transmission, which is often used in downloading a software.

### Hiding

**Definition:**

A hash function H is hiding if:   
when a secret value R is chosen from a highly spread-out distribution that, then given the hash result of *H( R/|X)*, it is infeasible to find X.  /| means concatenation of two strings.

**The Problem We Want to Solve:**

We want a hash function that it's infeasible to find out the input by the output of a hash function.

The problem is that if there are only a few values of inputs, it will be very easy to figure out what the input is by the output by simply trying all the possible values of inputs and see if they match the output.

**Solution:** 

Concatenating input with a random R which is randomly chosen from a highly spread-out distribution like this: *H( R/|X)*

**Explanation:**

With R appended to the input, now it's infeasible to figure out what input is by just traversing all the values because there're too many possibilities.

R is used to hide the input, by using R, the Hash function can hide the input while exposing the output.

#### Two Uses of Hiding Property
##### 1. Commitment
This use of hiding property is explained in the lecture.

**Scenario:**

We want to make a commitment, keep it as a secret, and reveal it later to others.

**Requirements:**

* The commitment can't be seen until it's revealed
* The commitment can't be changed.
* Other people can verify the commitment once it's revealed

**Implementation:**

*hash(message/|key)=commitment*

* Message: the commitment we want to make, which may only have a few values.
* Key is a generated value from a spread-out distribution used to hide the message
* commitment: the hash of message concatenated with the key

**Explanation:**

1. You want to make a commitment, the message, to others. It could be any message.
2. You choose a generated key which is used to hide the message.
3. You get the hash of the key message combination.
4. You publish the hash result, which is the commitment, to others and keep the key and message only to yourself. So other people know you have made a commitment, but they don't know what exactly it is.
5. After a while, you decide to reveal the commitment, so you publish the key and message.
6. Other people can use the hash function *hash(message/|key)* to calculate the hash result, compare it with the hash(commitment) you previously published. If it's the same, they can verify that you didn't change the commitment you have made.

> *  Because a key is used to hide the message, other people can't figure out what's the message before you reveal it.
> * Because of collision-free property, you can't find a message' such that *hash(message'/|key)=hash(message/|key)*, so it's impossible to change the committed message after publishing it.

##### 2. Secure Password
Another common use of hiding property of hash is to secure passwords.

**Scenario:**

A website needs to verify the user password when user login. Instead of storing the password in the system, a more secure approach is just storing the hash of the password and compare the hash to verify the user.  By this way, the user password won't be at risk even the system is broken by attackers because the attackers can't get the password by the hash.

But there's still a problem, many people tend to use simple words as their passwords. Attackers can make a long list of common passwords used by people, calculate the hash of these passwords in advance, and use these hashes to attack the system to figure out what's the password. It's called a rainbow attack.


**Solution:**

Use a randomly generated 'salt' to safeguard the password.

*hash(password/|salt)=output*

**Explanation:**

To solve this problem, we can append a generated random value to the password, this value is often called 'salt'. Salt is saved along with the hashed password in the system. So the system can get the hash out of the combination of user password and salt, compare it with the stored hash to verify user identity.

By appending a salt to the password, attackers can no longer use a pre-calculated password-hash map to attack the system. Even two users happened to choose the same string as their passwords, the hashes stored in the system are different because their salts are different, which is randomly generated.

**Example:**

> This example is excerpted from [wikipedia](https://en.wikipedia.org/wiki/Salt_(cryptography) )

| Username|Password|Salt value| String to be hashed|Hashed value = SHA256 (Password + Salt value)|
| ------- |--------| ---------| ---------|---------|
|user1|password123|E1F53135E559C253|  password123+E1F53135E559C253|    72AE25495A7981C40622D49F9A52E4F1565C90F048F59027BD9C8C8900D5C3D8|
|user2|password123|84B03D034B409D4E|password123+84B03D034B409D4E|  B4B6603ABC670967E99C7E7F1389E40CD16E78AD38EB1468EC2AA1E62B8BED3A|

As the table above illustrates, different salt values will create completely different hashed values, even when the plaintext passwords are exactly the same. Additionally, dictionary attacks are mitigated to a degree as an attacker cannot practically precompute the hashes. However, a salt cannot protect against common or easily guessed passwords because the attacker can still combine the salt with all the possible password in the dictionary and try to match the hash of the combinations with the hashed value stored in the attached target. The salt just makes the attack more difficult because attackers need two additional steps: 1. find out the salt of the attacked target 2. Calculate the hash every time

### Puzzle-Friendly

**Definition:**

A hash function H is said to be puzzle-friendly if:  
Given an R which is chosen from a highly spread-out distribution and a target set Y.  
Try to find a solution X such that *H(R/|X) $$/in$$ Y*.  
There is no solving strategy to find X much better than just trying every possible value of X.

**Usage:** 

Puzzle-friendly property is used for Bitcoin mining. The miner needs to find out a specific number R, which is concatenated with the data of the block, and the hash of the combination should fall into a certain range. The first one who solves this puzzle can add the outstanding transaction into the blockchain and get Bitcoin as the reward.

Bitcoin Minding Puzzle: find R such that *H(R/|BlockData) $$/in$$ ValidRange*

## SHA-256
SHA-256 is the hash function used in Bitcoin which has all the three needed properties.
![SHA-256](http://img.zhaohuabing.com/in-post/2018-05-09-cryptocurrency-week1-cryptographic-hash-function/sha-256.PNG)
