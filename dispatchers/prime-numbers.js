const WebSocket = require('ws')
const FunctionParser = require('../lib/functionParser')

const ecosystem = require('../ecosystem.config.js')
const secrets = require('../secrets.json')

const idling = {}

const sessions = {
  condition: '$R_MUST_BE_PRIME',
  ready: 0
}

let store = []

function range (size, startAt = 0) {
  return [...Array(size).keys()].map(i => i + startAt)
}

function chunk (arr, len) {
  var chunks = []
  var i = 0
  var n = arr.length

  while (i < n) {
    chunks.push(arr.slice(i, i += len))
  }

  return chunks
}

// Build Groups for Dispatching
const ranges = chunk(range(parseInt(process.argv[3]), parseInt(process.argv[2])), process.argv[4] ? Math.floor(parseInt(process.argv[4]) / ecosystem.maxWorkers) : Math.floor(parseInt(process.argv[3]) / ecosystem.maxWorkers))

function expression (entries) {
  function isPrime (checkNumber) {
    var sqrtCheckNumber = Math.floor(Math.sqrt(checkNumber))
    var isPrime = checkNumber !== 1

    for (var i = 2; i < sqrtCheckNumber + 1; i++) {
      if (checkNumber % i === 0) {
        isPrime = false
        break
      }
    }

    return isPrime
  }

  const answers = []

  for (const number of entries) {
    if (isPrime(number)) {
      answers.push({ input: number, prime: true })
    }
  }

  return answers
}

async function generate () {
  for (let i = 0; i < ecosystem.maxWorkers; i++) {
    await new Promise((resolve, reject) => {
      const WSS = new WebSocket(`ws://${ecosystem.hosts[Math.floor(Math.random() * ecosystem.hosts.length)]}:${ecosystem.ranges[Math.floor(Math.random() * ecosystem.ranges.length)]}/`)

      WSS.on('open', () => {
        const session = {
          id: require('crypto').randomBytes(8).toString('hex'),
          controller: new Controller(WSS)
        }
        WSS._sessionId = session.id

        WSS.on('message', (message) => {
          message = FunctionParser.parse(message)

          if (message.code === 200) {
            idling[session.id] = WSS
            sessions.ready++
            return resolve(session.id)
          } else if (message.code === 100) {
            WSS._callback(message.results)
            idling[session.id] = WSS
          } else {
            return reject(new Error(message.message))
          }
        })

        delete idling[session.id]
        session.controller.handshake()
      })
    }).then((sessionId) => {
      return console.info(`[Socket] Added worker [${sessionId}] to idle pool. [${Object.keys(idling).length}]`)
    }).catch((err) => {
      console.error('[Socket] Failed connection to remote executor.\n', err)
    })
  }
}

async function dispatchIdle (interval, clockInterval) {
  for (const key of Object.keys(idling)) {
    const idle = idling[key]

    if (ranges.length === 0) {
      const nextInterval = setInterval(() => {
        if (Object.keys(idling).length === sessions.ready) {
          exportData(nextInterval)
          return clearInterval(nextInterval)
        }
      }, 20)
      clearInterval(clockInterval)
      return clearInterval(interval)
    }

    const params = ranges.pop()
    idle.send(FunctionParser.stringify({
      payloadId: key,
      payloadBody: params,
      payload: expression
    }))
    idle._callback = (results) => {
      store = store.concat(results)
    }
    delete idling[key]
  }
}

async function exportData () {
  console.info(`[Candidates] ${store.length} / ${process.argv[3]} C:${sessions.condition}`)
  console.timeEnd('computeTime')
}

async function driver () {
  console.time('computeTime')
  await generate()

  let lastInterval = -1
  const clockInterval = setInterval(() => {
    if (ranges.length !== lastInterval) {
      console.info(`[%] Currently, ${ranges.length} blocks of data are remaining and ${Object.keys(idling).length} workers are idle.`)
      lastInterval = ranges.length
    }
  }, 500)
  const interval = setInterval(() => {
    dispatchIdle(interval, clockInterval)
  }, 1)
}

driver()

console.info('[Idle] Authorized ' + sessions.ready + ' node sessions.')

class Controller {
  constructor (socket) {
    this.socket = socket
  }

  handshake () {
    this.socket.send(FunctionParser.stringify({
      headers: {
        'X-Live-Authentication-Handshake': secrets.phrase,
        'X-Live-Version-Handshake': ecosystem.version
      }
    }))
  }
}
