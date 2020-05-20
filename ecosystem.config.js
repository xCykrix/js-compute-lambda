const apps = []

// Settings Mirrored to Cluster
const startPort = 8000
const bindings = 4

// Settings for Server
const authenticationHandshake = {
  'X-Early-Authentication': require('./secret.json')
}

// Settings for Client
const hosts = [
  '127.0.0.1'
]

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
  hosts,
  ranges,
  apps
}
