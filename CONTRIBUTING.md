# Contributing

Pull requests are welcome. This document covers everything you need to get from a clone to a merged
change.

## Table of contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Everyday commands](#everyday-commands)
- [Project structure](#project-structure)
- [Testing the plugin in a real workspace](#testing-the-plugin-in-a-real-workspace)
- [Adding a generator or executor](#adding-a-generator-or-executor)
- [Commit messages](#commit-messages)
- [Pull requests](#pull-requests)
- [Releasing](#releasing)

## Prerequisites

- Node.js as pinned in [`.nvmrc`](./.nvmrc) (`nvm use` picks it up); minimum `20.19`
- npm 10 or newer

## Setup

```shell
git clone https://github.com/WolfSoko/nx-aws-cdk-v2.git
cd nx-aws-cdk-v2
npm ci --legacy-peer-deps
```

`--legacy-peer-deps` is required: the Angular DevKit packages pulled in by the Nx devkit declare peer
ranges npm cannot satisfy strictly. Plain `npm ci` will fail.

## Everyday commands

| Command                 | What it does                                                                  |
| ----------------------- | ----------------------------------------------------------------------------- |
| `npm run check`         | Lint, unit tests and build for every project — run this before pushing.       |
| `npm run affected`      | The same three targets, but only for what your branch changed (what CI runs). |
| `npm test`              | Unit tests for the plugin (`nx test aws-cdk-v2`).                             |
| `npm run lint`          | Lint the plugin.                                                              |
| `npm run build:aws-cdk` | Build the plugin into `dist/packages/aws-cdk-v2`.                             |
| `npm run e2e:aws-cdk`   | The e2e suite; rebuilds the plugin first.                                     |
| `npm run format`        | Format with Prettier.                                                         |
| `npm run format:check`  | Verify formatting — CI fails if this does.                                    |

Run a single unit test file or test name:

```shell
npx nx test aws-cdk-v2 --testFile=packages/aws-cdk-v2/src/executors/deploy/deploy.spec.ts
npx nx test aws-cdk-v2 -- -t "run cdk deploy command"
```

The e2e suite spins up a real Nx workspace under `tmp/` and runs real `nx` and `cdk` commands, so it
is slow (each test has a 120s timeout) and needs network access. It never contacts AWS: the `deploy`
test replaces the workspace's `cdk` binary with a stub that logs its arguments, and the `synth` test
runs the real CLI but only synthesizes locally.

## Project structure

See [docs/architecture.md](./docs/architecture.md) for the full picture. The short version:

```text
packages/aws-cdk-v2/    # the published plugin
e2e/aws-cdk-v2-e2e/     # e2e suite
docs/                   # consumer documentation
```

The workspace layout is non-default — apps live in `e2e/`, libraries in `packages/` (see
`workspaceLayout` in `nx.json`).

## Testing the plugin in a real workspace

```shell
npm run build:aws-cdk
npm run link:aws-cdk        # cd dist/packages/aws-cdk-v2 && npm link
```

Then, in the workspace you want to try it in:

```shell
npm link @wolsok/nx-aws-cdk-v2
nx g @wolsok/nx-aws-cdk-v2:application my-app
```

Re-run `npm run build:aws-cdk` after every change — the link points at the build output, not at the
sources.

## Adding a generator or executor

1. Create a directory under `src/generators/<name>` or `src/executors/<name>` containing the
   implementation, `schema.json`, `schema.d.ts` and a co-located `.spec.ts`.
2. Register it in `generators.json` or `executors.json`.
3. Export it from `src/index.ts`.
4. Add e2e coverage in `e2e/aws-cdk-v2-e2e/tests/aws-cdk.spec.ts` if it is user facing.
5. Document it in the [package README](./packages/aws-cdk-v2/README.md) and in
   [docs/api-documentation.md](./docs/api-documentation.md).

The `@nx/nx-plugin-checks` lint rule validates that the manifests point at files that exist and that
the schemas are well formed, so `npm run lint` catches a half-registered generator.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and are validated by
commitlint. Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`,
`revert`, `style`, `test`, `sample`.

```text
feat(executors): add a diff executor
fix(generators): place the app in the configured apps directory
docs: document the pass-through behaviour for cdk flags
```

## Pull requests

Fill in the [pull request template](./.github/PULL_REQUEST_TEMPLATE.md) and make sure
`npm run check` passes. CI runs lint, unit tests and build for affected projects plus the full e2e
suite.

## Releasing

Releases to npm under the `latest` tag are automatic. Once CI is green on `main`,
[`.github/workflows/auto-release.yml`](./.github/workflows/auto-release.yml) runs
[semantic-release](https://semantic-release.gitbook.io/), which looks at the Conventional Commits
since the last release to decide whether a new version is warranted and, if so, creates the git tag
and GitHub release (release notes are generated from those commits — see
[`.releaserc.json`](./.releaserc.json) for how commit types map to version bumps and changelog
sections). A `feat` triggers a minor release, `fix`/`perf`/`revert` a patch release, and a
`BREAKING CHANGE` footer a major release; other types (`docs`, `chore`, `refactor`, `style`, `test`,
`build`, `ci`, `sample`) don't publish anything on their own.

Creating that GitHub release is what triggers `release.yml`, which sets the package version from the
release tag and publishes through npm OIDC trusted publishing (no npm token stored in the repo).

Creating the release itself requires a personal access token stored as the `RELEASE_GH_TOKEN`
repository secret (`repo` scope, or a fine-grained token with `contents: write` on this repo) — the
default `GITHUB_TOKEN` can't be used because GitHub does not start other workflow runs (like
`release.yml`) from events created by the default token, which would silently break npm publishing.

Beta pre-releases are still manual: publishing under the `beta` npm tag is driven by manually creating
a GitHub pre-release, which triggers
[`.github/workflows/pre_release.yml`](./.github/workflows/pre_release.yml) the same way.
