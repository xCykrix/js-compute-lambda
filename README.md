# Node.js 'super-compute'

Dispatch stateless functions to remote workers that will evaluate complex expressions, such as prime numbers calculation, using a lambda "serverless" based infrastructure to comlete expressions without needing to run a server for each specific computational environment.

## Installation

```sh
  $: npm install -g pm2
  $: git clone https://github.com/xCykrix/js-super-compute-lambda
  $: 

## Implementation(s)

### dispatchers/prime-number.js

Dispatch a Prime Number calculation to all workers in your configured node.

#### Usage

```sh
# Calculate 1 to 1,000,000 Prime Numbers
# Replace {RAM} with the maximum available RAM you have, in megabytes. (1024 * GB)
# 1 = Minimum Value to Dispatch
# 1,000,000 = Maximum Value to Dispatch
# 30000 = Average steps per Worker to compute
  $: node --max-old-space-size={RAM} ./dispatchers/prime-numbers.js 1 1000000 3000
```

## Authentication

All of the clusters have a **very basic** authentication system in place to prevent against malicious arbitrary code execution. To configure authentication, copy `/secrets.template.json` to `/secrets.json` and set the authentication password phrase you would wish to use. The example prime number client and server will handle all the authentication for you, but you should not use this in a production environment without taking the required steps to secure your network and infrastructure to prevent against malicious actors. I would greatly suggest running these in docker containers or a kubernetes cluster.

## Networking Nodes and Clusters

Would you like to expand beyond your personal network? Well that is fairly easy! You can configure `/ecosystem.config.js` to include the list of all remote servers that you have the server worker running, just be careful to make sure you keep the amount of clusters and servers matching across the entire compute network! You can also link many computers together and execute on the network from any worker server in the cluster.

## Building Expressions for Computation

You can copy `/dispatchers/prime-numbers.js` and modify it to meet your needs. Each expression requires its own form of input and output and can be modified to do just about anything you need, as long as authentication and versioning is handled correctly.
