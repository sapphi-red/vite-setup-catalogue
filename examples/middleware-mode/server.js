import { createServer } from 'vite'
import Connect from 'connect'
import fs from 'fs/promises'
import http from 'http'
import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

const connect = Connect()
const server = http.createServer(connect)

const { middlewares } = await createServer({
  appType: 'custom',
  server: {
    middlewareMode: true,
    hmr: {
      server
    }
  }
})

connect.use(middlewares)
connect.use(async (req, res, _next) => {
  const content = await fs.readFile('./index.html')
  res.statusCode = 200
  res.end(content)
})

server.listen(3010, 'localhost')
server.on('listening', () => {
  const addr = server.address()
  console.log(`Listening on http://localhost:${addr.port}`)
  console.log('Open your browser.')
})
