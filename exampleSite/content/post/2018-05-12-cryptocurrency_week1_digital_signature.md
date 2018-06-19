---
layout:     post
title:      "Digital Signature and Public Key as Identities"
subtitle:   "Bitcoin and Cryptocurrency Technologies-Week 1"
date:       2018-05-15
author:     "赵化冰"
description: "Some fundamental cryptographic technologies in Bitcoin: Asymmetic encryption(Public/Private key), Digital Signature, Digital Identity(Public key and Digital Certificate)."
image: "https://img.zhaohuabing.com/in-post/2018-05-06-cryptocurrency_week1/bitcoin_header.jpg"
published: true
tags:
    - Cryptocurrency
    - Blockchain
    - Bitcoin
    - Digital Signature
categories: [ Note ]
URL: "/2018/05/12/cryptocurrency_week1_digital_signature"

---

> This series of articles are my notes of "Bitcoin and Cryptocurrency Technologies" online course.
<!--more-->

## Digital Signature
Just like a written signature of a document, but it's in digital form. The desired features:    
* Only you can sign your own signature
* Everyone can verify your signature
* A signature is tied to a certain document, it can't be copied and used with other documents
<!--more-->

## How to Sign and Verify a Digital Signature
### Generate a Pair of Public Key and Secrete/Private Key  
**(sk, pk) := generates(keysize)**   

The mathematics feature of public/private key pair:  Messages encrypted with private can only be decrypted with the public key, and vice versa.     
You keep the private key to yourself and publish the public key to others.    
Because only you have the private key, so if anyone who receives an encrypted message and the message can be decrypted with your public key, they can make sure that the message is sent from you. 
### Sign a Message with the Private Key     
**signature: = sign(sk, message)**        

We usually sign the hash of the message rather than the message itself.  
It's because singing a fixed size hash(such as 256 bit) is much more efficient than signing a long message, and the collision-free feature of hash function can assure that no one can forge another message which has the same hash.    
So the sign function is like:   
**signature := encrypt(sk, hash(message))**
### Verify the Signature with Message
Others receive a message with a signature which is claimed to be sent by the signer.   
They verify the message with the public key of the signer, which has already been published to all.   
**isValid := verify(pk, message, signature)** 
  
Like I mentioned before, we usually sign the hash of the message, so the verify function is like:    
**isValid := isEqual(decrypt(pk, hash(message)), signature)** 
![digital signature](http://img.zhaohuabing.com/in-post/2018-05-12-cryptocurrency_week1_digital_signature/digital-signatures.jpg)

## Use Digital Signature with Cryptocurrency
Signing a hash pointer is identical to signing the whole structure of the data in the hash pointer points to.    
* Sign the head hash pointer of a blockchain(LinkedList) is identical to sign all the transaction data in the blockchain
* Sign the root of a Merkle tree is identical to sign all the transaction  data in the Merkle tree

Explanation:   
Because modification of any part in the data structure will result inconsistent at the head/root, so as long as we have verified the digital signature of the head/root, we can know for sure that the whole structure can't be forged because no one can create a fake data structure with the same head/root.

## Public Key as Identities

Because only the owner of the public key knowns the matching private key, so only the owner can send out a message signed with that private key.    

If we can verify the signature of a message with a public key，we can be sure that message has been sent out on behalf of the person behind of that public key，in other word，the public key is an identity of that person.

There are two kinds of identities
### Certificated Identities
 In some cases, such as signing a business contract or sending an email, you need to let the other side know who you are and able to verify your true identity, such as your name, your organization, so they can trust you when doing business with you.

But how can people make sure the public key they received is the original one it is claimed to be? How can people know that the public key has not been modified by a middleman or it is not forged by an attacker?    

To solve this kind of trust issues in the public key publishing process, we introduced the digital certificate, which is a document consists of a public key, user identity and a signature of a trusted authority. The public key of the trusted authority has already been planted into operating systems or browsers, it's called root certificate.

Obtain a digital certifacte from an authority
![digital certification](http://img.zhaohuabing.com/in-post/2018-05-12-cryptocurrency_week1_digital_signature/digital-certificate.png)    
Verify a digital signature using a certificate issued by an authority    
![digital certification](http://img.zhaohuabing.com/in-post/2018-05-12-cryptocurrency_week1_digital_signature/verify-signature.jpg)
 
###  Anonymous Identities
Sometimes, you may want to keep anonymous, in that case, you just publish your public key without a certification. One example is the identiy in Bitcoin, you might not want to let others known how many money you have, especially you have a lot and prefer to keep a low profile.   
  
Even without certification, you can still use that anonymous identity(the public key) to do business with others as long as the people don't care who exactly you are.    

## Example Codes on GitHub
* [Digital Signature example in Java](https://github.com/zhaohuabing/digital-signature)

