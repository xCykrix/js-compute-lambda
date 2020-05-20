# Node.js 'super-compute'

Dispatch stateless functions to remote workers that will evaluate complex expressions, such as prime numbers calculation, using a lambda "serverless" based infrastructure to comlete expressions without needing to run a server for each specific computational environment.

## Installation

TODO

## Implementation(s)

### dispatchers/prime-number.js

Dispatch a Prime Number calculation to all workers in your configured node.

#### Usage

```sh
# Calculate 1 to 1,000,000 Prime Numbers
# Replace {RAM} with the maximum available RAM you have, in megabytes. (1024 * GB)
# 1 = Minimum
# 1,000,000 = Maximum
# 10 = Cooldown between dispatched requests.
  $: node --max-old-space-size={RAM} ./dispatchers/prime-number.js 1 1000000 10
```

## Authentication

TODO

## Networking Nodes and Clusters

TODO

## Building Expressions for Computation

TODO
