const WebSocket = require('ws')
const JSFunction = require('./lambda')

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
  console.info(`Cluster Node Server [${process.argv[2]}] Ready for Connections`)
})

WSS.on('connection', (socket) => {
  socket.on('message', async (content) => {
    const len = content.length
    content = JSFunction.parse(content)
    console.info(`[${content.referenceId}] Executing Payload with length of ${len}!`)
    const evalPayload = content.evalPayload
    const evalParams = content.evalParams
    const answer = await evalPayload(...evalParams)
    content.answers = answer

    content = JSFunction.stringify(content)
    socket.send(content)
  })

  socket.on('close', () => {
    socket.terminate()
  })

  socket.on('error', (err) => {
    console.error('[LAMBDA Exception] Error in Socket Systems\n', err)
    socket.terminate()
  })
})
