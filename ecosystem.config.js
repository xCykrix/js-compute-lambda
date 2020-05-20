const apps = []

// Settings Mirrored to Cluster
const startPort = 8000
const bindings = 4

// Settings for Server
const version = '1.0'

// Settings for Client
const hosts = [
  '127.0.0.1'
]
const maxWorkers = 8

function range (size, startAt = 0) {
  return [...Array(size).keys()].map(i => i + startAt)
}
const ranges = range(bindings, startPort)

for (const range of ranges) {
  apps.push({
    name: `super-computer-${range}`,
    script: 'server.js',
    args: [`${range}`]
  })
}

module.exports = {
  startPort,
  bindings,
  version,
  hosts,
  maxWorkers,
  ranges,
  apps
}
