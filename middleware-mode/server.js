import { createServer } from 'vite'
import Connect from 'connect'
import fs from 'fs/promises'
import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

const { middlewares } = await createServer({
  server: {
    middlewareMode: true
  }
})

const connect = Connect()

connect.use(middlewares)
connect.use(async (req, res, next) => {
  const content = await fs.readFile('./index.html')
  res.statusCode = 200
  res.end(content)
})

const server = connect.listen(3010, 'localhost')
server.on('listening', () => {
  const addr = server.address()
  console.log(`Listening on http://localhost:${addr.port}`)
  console.log('Open your browser.')
})
