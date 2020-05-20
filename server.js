const WebSocket = require('ws')
const FunctionParser = require('./lib/functionParser')

const ecosystem = require('./ecosystem.config.js')
const secrets = require('./secrets.json')

const WSS = new WebSocket.Server({
  host: '0.0.0.0',
  port: parseInt(process.argv[2]),
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
})

WSS.on('listening', () => {
  console.info(`[::] Listening on ${process.argv[2]} for dispatched expressions.`)
})

WSS.on('connection', (socket) => {
  const session = {
    id: require('crypto').randomBytes(4).toString('hex'),
    authenticated: false,
    verified: false,
    version: require('./ecosystem.config').version
  }

  socket.on('message', async (message) => {
    message = FunctionParser.parse(message)
    const contentLength = message.toString().length

    const payloadId = message.payloadId || '0'
    const payloadIdLength = payloadId.toString().length

    const headers = message.headers || {}
    const headersLength = headers.toString().length

    // Check Authentication Statusazzzzzzzzzzz\
    if (!session.authenticated) {
      if (!headers['X-Live-Authentication-Handshake']) {
        return socket.send(FunctionParser.stringify({ code: 400, message: 'missing real-time authentication handshake' }))
      }
      if (headers['X-Live-Authentication-Handshake'] !== secrets.phrase) {
        return socket.send(FunctionParser.stringify({ code: 401, message: 'failed real-time authentication handshake' }))
      }
      console.info(`[${session.id}:${payloadId}:${payloadIdLength}] C<->S Authentication Check Successful.`)
      session.authenticated = true
    }

    // Check Expression Version
    if (!session.verified) {
      if (!headers['X-Live-Version-Handshake']) {
        return socket.send(FunctionParser.stringify({ code: 400, message: 'missing real-time version handshake' }))
      }
      if (headers['X-Live-Version-Handshake'] !== ecosystem.version) {
        return socket.send(FunctionParser.stringify({ code: 422, message: 'client node version mismatching, unable to process requested resource' }))
      }
      console.info(`[${session.id}:${payloadId}:${payloadIdLength}] C<->S Version Check Successful.`)
      session.verified = true
    }

    if (session.authenticated && session.verified && !session.alerted) {
      console.info(`[${session.id}:${payloadId}:${payloadIdLength}] C<--S Updated Client Status.`)
      session.alerted = true
      return socket.send(FunctionParser.stringify({ code: 200, message: 'server parser ready for for payloads' }))
    }

    // Check Payload Status
    if (message.payload) {
      // Evaluate Payload
      const payload = message.payload || ''
      const payloadLength = payload.toString().length
      const payloadBody = message.payloadBody || ''

      console.info(`[${session.id}:${payloadId}:${payloadIdLength}] C-->S Evaluating PAYLOAD:${payloadLength} for ${socket._socket.remoteAddress}'s session.`)
      return socket.send(FunctionParser.stringify({
        code: 100,
        message: '$GET(PRIME_NUMBERS)',
        results: await payload(payloadBody)
      }))
    }

    // const len = content.length
    // content = FunctionParser.parse(content)
    // console.info(`[${content.referenceId}] `)
    // const evalPayload = content.evalPayload
    // const evalParams = content.evalParams
    // const answer = await evalPayload(...evalParams)
    // content.answers = answer

    // content = FunctionParser.stringify(content)
    // socket.send(content)
  })

  socket.on('close', () => {
    socket.terminate()
  })

  socket.on('error', (err) => {
    console.error('[LAMBDA Exception] Error in Socket Systems\n', err)
    socket.terminate()
  })
})
