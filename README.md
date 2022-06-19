# Vite setup catalogue

This repository contains several example of Vite setups.

> *Currently it only contains dev setup*

## Info

None of these examples uses [`server.proxy`](https://vitejs.dev/config/#server-proxy) but it could be used to proxy some requests.

![](/docs-image/server-proxy.svg)

## Setups

### Basic
Most basic setup. Nothing special.

![](/docs-image/basic.svg)

### Middleware Mode
Using Vite with [middleware mode](https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server).

![](/docs-image/middleware-mode.svg)

### Backend Server
Using Vite with a backend server. See [Backend Integration Guide | Vite](https://vitejs.dev/guide/backend-integration.html).

![](/docs-image/backend-server.svg)

### With Proxy
Using Vite behind a reverse proxy.

![](/docs-image/with-proxy.svg)

### With Proxy (No WebSocket)
Using Vite behind a reverse proxy that does not support proxying websocket.

![](/docs-image/with-proxy-no-websocket.svg)
