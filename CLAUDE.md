# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is the source repo for `@wolsok/nx-aws-cdk-v2`, an Nx plugin that scaffolds and manages AWS CDK v2 applications inside an Nx workspace. It's an Nx monorepo with a single plugin package (`packages/aws-cdk-v2`) plus its e2e test app (`e2e/aws-cdk-v2-e2e`). The plugin ships a generator (`application`, plus a hidden `init`) and four executors (`deploy`, `destroy`, `synth`, `bootstrap`) that wrap the `cdk` CLI.

## Commands

Install deps: `npm i`

- `npm run test` — unit tests for the plugin (`nx test aws-cdk-v2`, Jest)
- `npm run lint` — lint the plugin (`nx lint aws-cdk-v2`)
- `npm run build:aws-cdk` — build the plugin (`nx build aws-cdk-v2`)
- `npm run e2e:aws-cdk` — e2e tests (`nx e2e aws-cdk-v2-e2e`); e2e depends on `aws-cdk-v2:build` (see `nx.json` targetDefaults) so the plugin is rebuilt first automatically
- `npm run format` — `nx format:write`
- Run a single unit test file: `npx nx test aws-cdk-v2 --testFile=<path>` or use Jest's `-t "<test name>"` via `npx nx test aws-cdk-v2 -- -t "<pattern>"`
- Run only affected targets (what CI does): `npx nx affected -t lint test build`
- CI additionally runs e2e via the Nx Cloud/e2e pipeline defined by the `@nx/jest/plugin` e2e config in `nx.json`

Local plugin testing (per CONTRIBUTING.md): build the plugin, then `cd dist/packages/aws-cdk-v2 && npm link`, then in a test workspace `npm link @wolsok/nx-aws-cdk-v2`.

## Architecture

- `packages/aws-cdk-v2/generators.json` and `executors.json` are the Nx plugin manifests — they map generator/executor names to their factory/implementation files and JSON schemas. When adding a new generator or executor, register it here as well as in `package.json`'s `generators`/`executors` fields.
- Each generator/executor lives in its own directory under `src/generators/*` or `src/executors/*` with: the implementation `.ts`, a `schema.json` (input options) and generated `schema.d.ts` (typed options interface), and a co-located `.spec.ts`.
- The `application` generator uses template files under `src/generators/application/files/**/*__template__` (EJS-style Nx templates) to scaffold a new CDK app's `main.ts`, stack, `cdk.json`, and `tsconfig.*.json`; `jest-files/**/*__template__` scaffolds the generated app's own test file.
- Executors (`deploy`, `destroy`, `synth`, `bootstrap`) shell out to the `cdk` CLI (via the workspace's `node_modules/.bin/cdk` or `aws-cdk`'s `bin/cdk.js`) using the generated app's `main.ts` as the CDK app entry point.
- `src/utils` holds shared helpers used across generators/executors (e.g. resolving project paths/config).
- Path mapping: `@wolsok/nx-aws-cdk-v2` resolves to `packages/aws-cdk-v2/src/index.ts` (see `tsconfig.base.json`), which is the plugin's public entry point.

### e2e tests

`e2e/aws-cdk-v2-e2e/tests/aws-cdk.spec.ts` builds a throwaway Nx workspace via `@nx/plugin/testing` (`ensureNxProject`), installs the built plugin from `dist/packages/aws-cdk-v2`, and runs real `nx generate`/`nx run` commands against it. Notable patterns used there:
- Project config is read back via `nx show project <name> --json` rather than reading files directly.
- The `deploy` test replaces the workspace's `cdk` binary with a stub shell script that logs its invocation to a temp file (under `tmp/cdk-stub-<plugin>/invocation.log`) instead of calling real AWS/CDK, and restores the original binary in a `finally` block — follow this pattern for any new test that needs to observe CDK CLI invocations without hitting AWS.
- The `synth` test runs the real `cdk` CLI (no stub) and asserts against the emitted `cdk.out/manifest.json`/`<name>.template.json`.
- Bootstrap tests are `xdescribe`-skipped pending a way to test against AWS (see TODO comment for localstack).
- Each `it` uses a 120s timeout since these spin up real Nx/CDK processes.

## Notes

- Node version is pinned via `.nvmrc` to `lts/*`; CI uses Node 20.
- Workspace layout is non-default: apps live under `e2e/`, libs under `packages/` (see `nx.json` `workspaceLayout`).
- `npm ci --legacy-peer-deps` is required (see CI workflow) — plain `npm ci`/`npm i` may fail on peer deps.
