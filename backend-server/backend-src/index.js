import Connect from 'connect'
import serveStatic from 'serve-static'
import fs from 'fs/promises'
import url from 'url'
import ejs from 'ejs'

const connect = Connect()

const indexTemplatePath = url.fileURLToPath(new URL('./templates/index.ejs', import.meta.url))

connect.use(async (req, res, next) => {
  const content = await ejs.renderFile(indexTemplatePath, { data: 'foo' })
  res.statusCode = 200
  res.end(content)
})

connect.use(
  serveStatic(url.fileURLToPath(new URL('./public', import.meta.url)))
)

const server = connect.listen(3000, 'localhost')
server.on('listening', () => {
  const addr = server.address()
  console.log(`Listening on http://${addr.address}:${addr.port}`)
})
