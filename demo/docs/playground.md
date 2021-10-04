# Fluence Aqua Playground
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

## Using Aqua Playground

1. Write Aqua code that contains **func** and **service** definitions
2. Write JS code that calls the functions and attaches callbacks to the services
3. Hit Run to compile the Aqua code to JS
4. The functions from the compiled Aqua are automatically imported and your JS uses those functions
5. Special methods like **appendOutput** are made available to JS to provide output

### Compilation of Aqua to JS

The compilation creates a JS file that the Aqua Playground automatically imports before running your entered JS.

In this JS file are two types of definition:

1. For each **service** in Aqua, a JS function named register**ServiceName** is created. register**ServiceName** is called with an JS object containing callbacks that will be called when functions of the service are triggered.
2. For each **func** in Aqua, an async JS function is created with the same name. 
