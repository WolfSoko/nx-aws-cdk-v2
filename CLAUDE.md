# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is the source repo for `@wolsok/nx-aws-cdk-v2`, an Nx plugin that scaffolds and manages AWS CDK v2 applications inside an Nx workspace. It's an Nx monorepo with a single plugin package (`packages/aws-cdk-v2`) plus its e2e test app (`e2e/aws-cdk-v2-e2e`). The plugin ships a generator (`application`, plus a hidden `init`) and four executors (`deploy`, `destroy`, `synth`, `bootstrap`) that wrap the `cdk` CLI.

## Commands

Install deps: `npm ci --legacy-peer-deps` (plain `npm ci`/`npm i` fails on peer deps — the Angular DevKit packages the Nx devkit pulls in declare peer ranges npm can't satisfy strictly).

- `npm run check` — lint + unit tests + build for every project
- `npm run affected` — the same three targets for what the branch changed (what CI runs)
- `npm run test` — unit tests for the plugin (`nx test aws-cdk-v2`, Jest)
- `npm run lint` — lint the plugin (`nx lint aws-cdk-v2`)
- `npm run build:aws-cdk` — build the plugin (`nx build aws-cdk-v2`)
- `npm run e2e:aws-cdk` — e2e tests (`nx e2e aws-cdk-v2-e2e`); e2e depends on `aws-cdk-v2:build` (see `nx.json` targetDefaults) so the plugin is rebuilt first automatically
- `npm run format` / `npm run format:check` — Prettier via Nx; CI fails on unformatted files
- Run a single unit test file: `npx nx test aws-cdk-v2 --testFile=<path>` or use Jest's `-t "<test name>"` via `npx nx test aws-cdk-v2 -- -t "<pattern>"`

CI (`.github/workflows/ci.yml`) is a single job that runs `nx format:check` then `npx nx affected -t lint test build e2e-ci` (e2e is atomized into one task per spec file — see the `@nx/jest/plugin` `ciTargetName` option in `nx.json`), distributed across Nx Cloud's hosted agents. `e2e-ci` requires live Nx Cloud connectivity and won't run with `NX_NO_CLOUD=true`; use the plain `e2e` target (`npm run e2e:aws-cdk`) instead when Nx Cloud is unreachable. Nx Cloud is unreachable in some sandboxes — prefix other commands with `NX_NO_CLOUD=true` if the run fails on "Unable to retrieve Nx Cloud bundle".

Once CI is green on `main`, `.github/workflows/release.yml` runs `node tools/release.js`, which drives Nx Release: versions the plugin from Conventional Commits, builds it, publishes to npm via OIDC, and creates a GitHub release — all in one job, no-op when nothing release-worthy landed. See the "Releasing" section in `CONTRIBUTING.md`.

Local plugin testing (per CONTRIBUTING.md): build the plugin, then `npm run link:aws-cdk`, then in a test workspace `npm link @wolsok/nx-aws-cdk-v2`.

## Architecture

See `docs/architecture.md` for the long form. Key points:

- `packages/aws-cdk-v2/generators.json` and `executors.json` are the Nx plugin manifests — they map generator/executor names to their factory/implementation files and JSON schemas. When adding a new generator or executor, register it here, export it from `src/index.ts`, and document it in the package README plus `docs/api-documentation.md`. The `@nx/nx-plugin-checks` lint rule (see `eslint.config.mjs`) fails if a manifest points at a file that doesn't exist.
- Each generator/executor lives in its own directory under `src/generators/*` or `src/executors/*` with: the implementation `.ts`, a `schema.json` (input options), a hand-written `schema.d.ts` (typed options interface), and a co-located `.spec.ts`.
- The `application` generator uses template files under `src/generators/application/files/**/*__template__` (EJS-style Nx templates) to scaffold a new CDK app's `main.ts`, stack, `cdk.json`, and `tsconfig.*.json`; `jest-files/**/*__template__` scaffolds the generated app's own test file. `*__template__` files are excluded from ESLint and Prettier.
- Executors shell out to the `cdk` CLI and run it **from the workspace root** with an explicit `-a "<pm-exec> <loader> <project>/src/main.ts"`, so the generated `cdk.json` is not read by them and `cdk.out` lands at the workspace root. `src/utils/executor.util.ts` builds that command; unknown executor options are forwarded verbatim as `--<key> <value>`.
- `src/utils/cdk-shared.ts` holds the dependency versions the `init` generator installs. `aws-cdk` (CLI, `2.1xxx.x`) and `aws-cdk-lib` (library, `2.x`) are separate release lines and have separate constants — don't collapse them.
- Path mapping: `@wolsok/nx-aws-cdk-v2` resolves to `packages/aws-cdk-v2/src/index.ts` (see `tsconfig.base.json`), which is the plugin's public entry point.

### e2e tests

`e2e/aws-cdk-v2-e2e/tests/aws-cdk.spec.ts` builds a throwaway Nx workspace via `@nx/plugin/testing` (`ensureNxProject`), installs the built plugin from `dist/packages/aws-cdk-v2`, and runs real `nx generate`/`nx run` commands against it. Notable patterns used there:

- Project config is read back via `nx show project <name> --json` rather than reading files directly.
- The `deploy` test replaces the workspace's `cdk` binary with a stub shell script that logs its invocation to a temp file (under `tmp/cdk-stub-<plugin>/invocation.log`) instead of calling real AWS/CDK, and restores the original binary in a `finally` block — follow this pattern for any new test that needs to observe CDK CLI invocations without hitting AWS.
- The `synth` test runs the real `cdk` CLI (no stub) and asserts against the emitted `cdk.out/manifest.json`/`<name>.template.json`.
- Bootstrap tests are `xdescribe`-skipped pending a way to test against AWS (see TODO comment for localstack).
- Each `it` uses a 120s timeout since these spin up real Nx/CDK processes.

## Notes

- Node version is pinned via `.nvmrc` to `lts/*`; the plugin declares `engines.node >= 20.19`.
- Workspace layout is non-default: apps live under `e2e/`, libs under `packages/` (see `nx.json` `workspaceLayout`).
- TypeScript is on `module`/`moduleResolution: node16` with `isolatedModules: true` and no deprecated compiler options — don't reintroduce `baseUrl` or `ignoreDeprecations`.
- Consumer-facing docs live in `packages/aws-cdk-v2/README.md` (the npm page) and `docs/`. `docs/tasks.md` is a maintainer backlog, not consumer documentation. Keep them in sync when behaviour changes.
