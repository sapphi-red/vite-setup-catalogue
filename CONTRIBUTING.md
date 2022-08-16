# Vite setup catalogue Contributing Guide

Hi! Thank you for taking your time in contributing to Vite setup catalogue. Before submitting your contribution, please read through the following guide.

## Repo Setup

This repo is a monorepo using pnpm workspaces.

Also this repo uses Docker, too.
But if you are not changing Docker related examples/tests, you won't need to install it by skipping those tests.

Note that inside Docker, npm is used instead of pnpm.

## Examples

Under the `examples` directory, there are several examples of Vite setup.

I'm trying to make this as minimal as possible. For more detailed / out-of-the box templates, it's better to send it to [`awesome-vite`](https://github.com/vitejs/awesome-vite) instead.

## Tests

This repo includes tests for Vite with several setups. These are focused on testing setup specific features. Other tests should be done in [Vite's repo](https://github.com/vitejs/vite).

### Example tests
The test cases under `tests/examples-cases` runs against projects under `examples`.

`examples-overrides` directory can be used for overriding/adding files which are only used during tests.

### Non-example (Fixture) tests
The test cases under `tests/fixtures-cases` runs against projects under `tests/fixtures`.

Use this to run tests for setups not included in `examples`.

### Testing against local Vite

Use `pnpm.overrides` for non Docker setups. See [Vite's contribution guide](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md#testing-vite-against-external-packages).

For Docker setups, you could choose:

- manually edit files inside container
- (Linux only) remove `node_modules` from named volume and use `pnpm.overrides`
- use dev container
