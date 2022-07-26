# With Proxy

## Commands
### dev using [Caddy](https://caddyserver.com/)
```shell
docker compose -p with-proxy-dev -f compose.dev.yaml up
```

### dev using [nginx](https://nginx.org/)
```shell
docker compose -p with-proxy-dev-nginx -f compose.dev-nginx.yaml up
```

### build
```shell
docker run -w /app -v "$(pwd):/app" -v node_modules:/app/node_modules node:16 bash -c "npm i && npm run build"
```

### preview
```shell
docker compose -p with-proxy-prod -f compose.prod.yaml up
```

## Notes

### Debugging

Set `"connect:dispatcher"` to `DEBUG` env variable to log what request is coming to Vite server.

For example, when an access is coming to `//@vite/client`, something is wrong with your proxy configuration.
