# Vite setup catalogue ![lint](https://github.com/sapphi-red/vite-setup-catalogue/workflows/lint/badge.svg) ![test](https://github.com/sapphi-red/vite-setup-catalogue/workflows/test/badge.svg)

This repository contains several example of Vite setups.

## Info

None of these examples uses [`server.proxy`](https://vitejs.dev/config/#server-proxy) but it could be used to proxy some requests.

![](/docs-image/server-proxy.svg)

## Setups

### [Basic](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/basic)

Most basic setup. Nothing special.

![](/docs-image/basic.svg)

### [Middleware Mode](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/middleware-mode)

Using Vite with [middleware mode](https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server).

![](/docs-image/middleware-mode.svg)

### [Backend Server](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/backend-server)

Using Vite with a backend server. See [Backend Integration Guide | Vite](https://vitejs.dev/guide/backend-integration.html).

![](/docs-image/backend-server.svg)

### [With Proxy](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/with-proxy)

Using Vite behind a reverse proxy.

![](/docs-image/with-proxy.svg)

### [With Proxy (No WebSocket)](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/with-proxy-no-websocket)

> **Warning**
> I recommend to use "With Proxy" setup if possible. It is more simple.
> This exists to showcase ["Direct websocket connection fallback" feature](https://vitejs.dev/config/server-options.html#server-hmr).

Using Vite behind a reverse proxy that does not support proxying websocket.

![](/docs-image/with-proxy-no-websocket.svg)
