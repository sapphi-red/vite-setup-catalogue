# Vite 配置方法合集 ![lint](https://github.com/sapphi-red/vite-setup-catalogue/workflows/lint/badge.svg) ![test](https://github.com/sapphi-red/vite-setup-catalogue/workflows/test/badge.svg)

该存储库包含几个 Vite 配置示例。

## 简介

这些实例都没有使用[`server.proxy`](https://vitejs.dev/config/#server-proxy)但是依然可以代理某些请求。

![](/docs-image/server-proxy.svg)

## 配置类型

### [基本配置](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/basic)

最基本的设置，没有任何特点。

![](/docs-image/basic.svg)

### [中间件模式](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/middleware-mode)

在[中间件模式|middleware mode](https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server)下使用Vite。

![](/docs-image/middleware-mode.svg)

### [配合后台服务](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/backend-server)

将 Vite 与后端服务器一起使用，请参考[后端集成指南|Backend Integration Guide | Vite](https://vitejs.dev/guide/backend-integration.html).

![](/docs-image/backend-server.svg)

### [使用代理](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/with-proxy)

反向代理Vite。

![](/docs-image/with-proxy.svg)

### [使用代理（不包含WebSocket）](https://github.com/sapphi-red/vite-setup-catalogue/tree/main/examples/with-proxy-no-websocket)

> **警告**
> 我建议使用上一条设置。它用起来更简单。
> 这个配置示例的存在是为了展示[直接Websocket连接回退|"Direct websocket connection fallback"](https://vitejs.dev/config/server-options.html#server-hmr)功能。

在不支持代理Websocket的反向代理中面使用Vite。

![](/docs-image/with-proxy-no-websocket.svg)
