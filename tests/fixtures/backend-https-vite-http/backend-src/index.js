import Connect from 'connect'
import dns from 'dns'
import fs from 'fs/promises'
import https from 'https'

dns.setDefaultResultOrder('verbatim')

const connect = Connect()

const entrypoint = 'frontend-src/main.js'

const viteInject = `
  <script type="module" src="http://localhost:7001/@vite/client"></script>
  <script type="module" src="http://localhost:7001/${entrypoint}"></script>
`

const indexTemplatePath = new URL('./templates/index.html', import.meta.url)

connect.use(async (req, res, next) => {
  let content = await fs.readFile(indexTemplatePath, 'utf-8')
  content = content.replace('<%- viteInject %>', viteInject)
  res.statusCode = 200
  res.end(content)
})

/** @type {https.ServerOptions} */
const options = {
  key: await fs.readFile(new URL('./key.pem', import.meta.url)),
  cert: await fs.readFile(new URL('./cert.pem', import.meta.url))
}

const server = https.createServer(options, connect).listen(7002, 'localhost')
server.on('listening', () => {
  const addr = server.address()
  console.log(`Listening on https://localhost:${addr.port}`)
  console.log('Open your browser.')
})
