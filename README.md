[![CI](https://github.com/WolfSoko/nx-aws-cdk-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/WolfSoko/nx-aws-cdk-v2/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@wolsok/nx-aws-cdk-v2.svg)](https://www.npmjs.com/package/@wolsok/nx-aws-cdk-v2)
[![Downloads](https://img.shields.io/npm/dm/@wolsok/nx-aws-cdk-v2.svg)](https://www.npmjs.com/package/@wolsok/nx-aws-cdk-v2)
[![LICENSE](https://img.shields.io/npm/l/@wolsok/nx-aws-cdk-v2.svg)](https://www.npmjs.com/package/@wolsok/nx-aws-cdk-v2)
[![Typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://www.typescriptlang.org/)

# Nx AWS CDK v2 plugin

Monorepo for [`@wolsok/nx-aws-cdk-v2`](./packages/aws-cdk-v2) — an [Nx](https://nx.dev) plugin that
scaffolds, synthesizes, deploys and destroys [AWS CDK v2](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
applications inside an Nx workspace.

**Consumer docs live in the [package README](./packages/aws-cdk-v2/README.md) and in [`docs/`](./docs).**
This file is the map of the repository.

## Table of contents

- [Why](#why)
- [Install & quick start](#install--quick-start)
- [What the plugin ships](#what-the-plugin-ships)
- [Documentation](#documentation)
- [Repository layout](#repository-layout)
- [Working on the plugin](#working-on-the-plugin)
- [Releasing](#releasing)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)
- [Special thanks](#special-thanks)

## Why

The AWS CDK is a great fit for a monorepo — but out of the box the `cdk` CLI knows nothing about Nx
projects, and Nx knows nothing about your infrastructure. This plugin closes that gap:

- **Infrastructure is a first-class Nx project.** It shows up in the project graph, respects tags and
  module boundaries, and participates in `nx affected`, so you only synth and deploy what changed.
- **Targets instead of shell scripts.** `nx deploy`, `nx synth`, `nx destroy` and `nx bootstrap`
  replace a directory of bespoke npm scripts, and can be cached and orchestrated like any other task.
- **No abstraction to fight.** The executors build a `cdk` command line and run it. Anything the CDK
  CLI accepts can be passed through, so you never hit a wall the plugin has to grow a feature for.
- **Typed from the start.** Generated apps are TypeScript, with a Jest test for the stack.

## Install & quick start

```shell
npm install --save-dev @wolsok/nx-aws-cdk-v2

nx generate @wolsok/nx-aws-cdk-v2:application my-app
nx bootstrap my-app --profile=my-profile   # once per AWS account/region
nx synth my-app
nx deploy my-app
```

Requires Node.js `>= 20.19`, Nx `>= 21`, and AWS credentials the AWS SDK can find. The full option
reference is in the [package README](./packages/aws-cdk-v2/README.md).

## What the plugin ships

| Kind      | Name          | Purpose                                                                            |
| --------- | ------------- | ---------------------------------------------------------------------------------- |
| Generator | `application` | Scaffold a CDK v2 app with `deploy`, `synth`, `destroy` and `bootstrap` targets.   |
| Generator | `init`        | Add the CDK dependencies to the workspace. Hidden — runs as part of `application`. |
| Executor  | `deploy`      | `cdk deploy` for the project's stacks.                                             |
| Executor  | `synth`       | `cdk synth` — CloudFormation templates without touching AWS.                       |
| Executor  | `destroy`     | `cdk destroy` for the project's stacks.                                            |
| Executor  | `bootstrap`   | `cdk bootstrap` for an AWS environment.                                            |

## Documentation

| Document                                          | What it covers                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| [Package README](./packages/aws-cdk-v2/README.md) | Install, every generator and executor option, how `cdk` is invoked.   |
| [Getting started](./docs/getting-started.md)      | End-to-end walkthrough from empty workspace to a deployed stack.      |
| [API reference](./docs/api-documentation.md)      | Schemas, defaults and `project.json` configuration for every target.  |
| [Architecture](./docs/architecture.md)            | How the plugin is put together and how a target run flows through it. |
| [Troubleshooting](./docs/troubleshooting.md)      | Symptoms, causes and fixes for the errors people actually hit.        |
| [Contributing](./CONTRIBUTING.md)                 | Local setup, tests, linking the plugin into a scratch workspace.      |
| [Changelog](./CHANGELOG.md)                       | Release history.                                                      |

## Repository layout

```text
packages/aws-cdk-v2/     # the published plugin
  generators.json        # generator manifest
  executors.json         # executor manifest
  migrations.json        # nx migrate entry point
  src/
    generators/          # application, init - implementation, schema and templates
    executors/           # deploy, destroy, synth, bootstrap
    utils/               # cdk command construction, shared version constants
e2e/aws-cdk-v2-e2e/      # e2e suite - builds a throwaway workspace and runs real nx commands
docs/                    # consumer documentation
```

## Working on the plugin

```shell
npm ci --legacy-peer-deps   # --legacy-peer-deps is required, see CONTRIBUTING.md
npm run check               # lint + unit tests + build
npm run e2e:aws-cdk         # end-to-end suite (builds the plugin first)
npm run format              # prettier
```

`npm run affected` runs lint, test and build for the projects touched by your branch — the same thing
CI does.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for testing the plugin against a real workspace.

## Releasing

Publishing is automated. Creating a GitHub **release** publishes to npm under `latest`, a
**pre-release** publishes under the `beta` tag. Both run through npm OIDC trusted publishing, so no
npm token is stored in the repository — see
[`.github/workflows/release.yml`](./.github/workflows/release.yml).

## Maintainers

[@WolfSoko](https://github.com/WolfSoko)

## Contributing

PRs are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT © 2022 Wolfram Sokollek — see [LICENSE](./LICENSE).

## Special thanks

This project is based on [@adrian-goe](https://github.com/adrian-goe)'s
[nx-aws-cdk-v2](https://github.com/adrian-goe/nx-aws-cdk-v2), which in turn builds on
[@tienne](https://github.com/tienne)'s [nx-plugins](https://github.com/codebrewlab/nx-plugins).
