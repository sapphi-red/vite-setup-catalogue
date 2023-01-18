import { createServer } from 'vite'
import Connect from 'connect'

const { middlewares } = await createServer({
  server: {
    middlewareMode: true
  }
})

const connect = Connect()

connect.use(middlewares)

const server = connect.listen(7003, 'localhost')
server.on('listening', () => {
  const addr = server.address()
  console.log(`Listening on http://localhost:${addr.port}`)
  console.log('Open your browser.')
})
