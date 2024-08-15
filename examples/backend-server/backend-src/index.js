import Connect from 'connect'
import serveStatic from 'serve-static'
import fs from 'fs/promises'
import url from 'url'
import ejs from 'ejs'
import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

const isDev = process.env.DEV === '1'

const connect = Connect()

const entrypoint = 'frontend-src/main.js'

let viteInject
if (isDev) {
  viteInject = `
    <script type="module" src="http://localhost:5183/@vite/client"></script>
    <script type="module" src="http://localhost:5183/${entrypoint}"></script>
  `
} else {
  const manifest = JSON.parse(
    await fs.readFile(
      new URL('../dist/.vite/manifest.json', import.meta.url),
      'utf-8'
    )
  )
  const main = manifest[entrypoint]

  viteInject = `
    ${main.css.map(href => `<link rel="stylesheet" href="${href}" />`)}
    <script type="module" src="${main.file}"></script>
  `
}

connect.use(
  serveStatic(url.fileURLToPath(new URL('./public', import.meta.url)), {
    index: false
  })
)
if (!isDev) {
  const serve = serveStatic(
    url.fileURLToPath(new URL('../dist', import.meta.url)),
    {
      immutable: true,
      index: false
    }
  )
  connect.use((req, res, next) => {
    if (new URL(req.url, 'http://dummy').pathname === '/manifest.json') {
      res.statusCode = 404
      res.end()
      return
    }
    serve(req, res, next)
  })
}

const indexTemplatePath = url.fileURLToPath(
  new URL('./templates/index.ejs', import.meta.url)
)

connect.use(async (req, res, _next) => {
  const content = await ejs.renderFile(indexTemplatePath, {
    data: 'foo',
    viteInject
  })
  res.statusCode = 200
  res.end(content)
})

const server = connect.listen(3000, 'localhost')
server.on('listening', () => {
  const addr = server.address()
  console.log(`Listening on http://localhost:${addr.port}`)
  console.log('Open your browser.')
})
