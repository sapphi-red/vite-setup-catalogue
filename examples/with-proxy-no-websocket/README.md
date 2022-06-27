# With Proxy (No WebSocket)

## dev
```shell
docker compose -p with-proxy-no-websocket-dev -f compose.dev.yaml up
```

## build
See ["With Proxy"](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/with-proxy) instead.

## preview
See ["With Proxy"](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/with-proxy) instead.

## "Set `server.hmr.port` from `server.port`" plugin
This plugin sets `server.hmr.port` as the same value with `server.port`.
This might be useful when:

- You are using `--port portNum --strictPort` to select which port you are going to use
- You can't or don't want to configure the proxy to support WebSocket

```js
const setHmrPortFromPortPlugin = {
  name: 'set-hmr-port-from-port',
  configResolved(config) {
    if (!config.server.strictPort) {
      throw new Error('Should be strictPort=true')
    }

    if (config.server.hmr !== false) {
      if (config.server.hmr === true) config.server.hmr = {}
      config.server.hmr ??= {}
      config.server.hmr.clientPort = config.server.port
    }
  }
}
```

You could use this plugin like this:
```js
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [setHmrPortFromPortPlugin]
})
```
