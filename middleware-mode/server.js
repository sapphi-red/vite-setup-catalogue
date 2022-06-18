import { createServer } from 'vite'
import Connect from 'connect'
import fs from 'fs/promises'

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

const server = connect.listen(3000, 'localhost')
server.on('listening', () => {
  const addr = server.address()
  console.log(`Listening on http://${addr.address}:${addr.port}`)
})
