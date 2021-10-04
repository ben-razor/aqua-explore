# Aqua Playground Guide
## Fluence Network
> [Fluence Network](https://fluence.network/) is an open application platform where apps can build on each other, share data and users.

It is a **decentralized cloud platform** maintained and governed by its developers

### Fluence Nodes
Services are distributed across nodes forming p2p networks configured for specific applications.

Nodes may be specially configured servers, or lightweight nodes running in the browser.

## Aqua
[Aqua](https://doc.fluence.dev/aqua-book/) is the language for configuring communication between services of network.

* Aqua expresses **services** and **functions** that orchestrate the execution of node services.

* Aqua is also used to express the way the nodes will be connected, for example, whether the services will be called serially or in parallel.

## Fluence JS

> [Fluence JS](https://doc.fluence.dev/docs/fluence-js) is an implementation of the Fluence protocol for JavaScript-based environments.

It enables connections to be made to nodes to consume their services, and for new APIs to be exposed to the network.

Importantly, **Aqua** can be compiled to JS so that rich applications can be written in JS.

## Prerequisites

The [Fluence JS Tutorial](https://doc.fluence.dev/docs/fluence-js/1_concepts) provides a quick guide to the steps involved in creating a Fluence Application.

The [Aqua Book](https://doc.fluence.dev/aqua-book/language) describes the Aqua language.

Having these guides open when using the Aqua Playground will be worthwhile.

# Using Aqua Playground

The Aqua Playground presents a quick way to test out what is possible with Aqua and Fluence JS.

Running code on the Aqua Playground follows these steps:

1. Write Aqua code that contains **func** and **service** definitions
2. Write JS code that calls the functions and attaches callbacks to the services
3. Hit Run to compile the Aqua code to JS
4. The functions from the compiled Aqua are automatically imported and your JS uses those functions
5. Special methods like **appendOutput** are made available to JS to provide output

### Writing Aqua

The Aqua code is about definining services and functions. In the functions you can define which nodes different aspects of the code should run.

Here is a simple example:

```
import "@fluencelabs/aqua-lib/builtin.aqua"

service HelloWorld("hello-world"):
    hello(str: string)
    
func sayHello() -> string:
    HelloWorld.hello("Hello. Welcome to the Aqua Playground.")
    
func getRelayTime() -> u64:
    on HOST_PEER_ID:
        ts <- Peer.timestamp_ms()
    <- ts
```

### Compilation of Aqua to JS

The compilation creates a JS file that the Aqua Playground automatically imports before running your entered JS.

In this JS file are two types of definition:

1. For each **service** in Aqua, a JS function named register**ServiceName** is created. register**ServiceName** is called with an JS object containing callbacks that will be called when functions of the service are triggered.
2. For each **func** in Aqua, an async JS function is created with the same name.

### Writing JS

There are a number of objects and functions exposed to the JS editor:

* The [Fluence](https://fluence.network/fluence-js/modules.html#Fluence) object

```js
Fluence.getPeer().getStatus().peerId;
Fluence.getPeer().getStatus().relayPeerId;
```

* The **krasnodar** array of test node information

```js
krasnodar[0].peerId
krasnodar[0].multiaddr
```

* The **playgroundNodes** array of currently connected node information

```js
playgroundNodes[0].peerId
playgroundNodes[0].multiaddr
```

* Output helpers:

```
setOutput - Write to console (overwriting current text)
getOutput - Get current output as text
appendOutput - Append to current output text
```

### Handling Errors

Errors in compilation of Aqua or running of JS are displayed in the Output panel.
