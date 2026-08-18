[![npm version](https://img.shields.io/npm/v/@wolsok/nx-aws-cdk-v2.svg)](https://www.npmjs.com/package/@wolsok/nx-aws-cdk-v2)
[![Downloads](https://img.shields.io/npm/dm/@wolsok/nx-aws-cdk-v2.svg)](https://www.npmjs.com/package/@wolsok/nx-aws-cdk-v2)
[![LICENSE](https://img.shields.io/npm/l/@wolsok/nx-aws-cdk-v2.svg)](https://www.npmjs.com/package/@wolsok/nx-aws-cdk-v2)
[![Typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://www.typescriptlang.org/)

# @wolsok/nx-aws-cdk-v2

Generate, synthesize, deploy and destroy [AWS CDK v2](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
applications from inside an [Nx](https://nx.dev) workspace.

The plugin adds one generator and four executors. The executors are thin, predictable wrappers
around the CDK Toolkit CLI: they build a `cdk` command line and run it, so anything you know about
`cdk` keeps working, and anything Nx gives you — the project graph, `nx affected`, task caching,
`nx release` — applies to your infrastructure code as well.

## Table of contents

- [Requirements](#requirements)
- [Install](#install)
- [Quick start](#quick-start)
- [Generator: `application`](#generator-application)
- [Executors](#executors)
  - [`deploy`](#deploy)
  - [`synth`](#synth)
  - [`destroy`](#destroy)
  - [`bootstrap`](#bootstrap)
  - [Passing extra CDK flags](#passing-extra-cdk-flags)
- [How the executors invoke the CDK CLI](#how-the-executors-invoke-the-cdk-cli)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Requirements

| Requirement     | Version                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| Node.js         | `>= 20.19`                                                                        |
| Nx              | `>= 21` (built and tested against Nx 23)                                          |
| AWS CDK         | v2 — installed into your workspace by the generator                               |
| AWS credentials | Any method the AWS SDK understands (`aws configure`, `AWS_PROFILE`, SSO, OIDC, …) |

`@nx/devkit` is a peer dependency. `@nx/jest` is an optional peer dependency and is only needed if
you generate applications with the default `--unitTestRunner=jest`.

## Install

```shell
npm install --save-dev @wolsok/nx-aws-cdk-v2
# or
pnpm add --save-dev @wolsok/nx-aws-cdk-v2
# or
yarn add --dev @wolsok/nx-aws-cdk-v2
```

## Quick start

```shell
# 1. Scaffold a CDK app (adds aws-cdk-lib, constructs and the CDK Toolkit to your workspace)
nx generate @wolsok/nx-aws-cdk-v2:application my-app

# 2. Prepare the target AWS environment - once per account/region
nx bootstrap my-app --profile=my-profile

# 3. Check what CloudFormation the app produces
nx synth my-app

# 4. Ship it
nx deploy my-app

# 5. Tear it down again
nx destroy my-app
```

## Generator: `application`

```shell
nx generate @wolsok/nx-aws-cdk-v2:application <name> [options]
# alias: nx g @wolsok/nx-aws-cdk-v2:app <name>
```

| Option                      | Type             | Default | Description                                                                                 |
| --------------------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------- |
| `--name`                    | `string`         | —       | Name of the application. Can also be passed as the first positional argument. **Required.** |
| `--directory`, `-d`         | `string`         | —       | Directory the project is placed in, relative to the workspace's apps directory.             |
| `--tags`, `-t`              | `string`         | —       | Comma separated tags, used by lint rules and `nx affected` filtering.                       |
| `--unitTestRunner`          | `jest` \| `none` | `jest`  | Adds a Jest configuration and a sample stack test.                                          |
| `--skipFormat`              | `boolean`        | `false` | Skip formatting the generated files with Prettier.                                          |
| `--setParserOptionsProject` | `boolean`        | `false` | Configure ESLint's `parserOptions.project`. Off by default for lint performance.            |

### Where the project is created

The project root is `<appsDir>/<directory>/<name>`, where `<appsDir>` is
`workspaceLayout.appsDir` from `nx.json` if set, otherwise `apps/` or `packages/` if either exists,
otherwise the workspace root. The Nx project name is the path below `<appsDir>` with `/` replaced by
`-`, so `--directory=aws my-app` becomes the project `aws-my-app`.

### What gets generated

```text
<project-root>/
├── cdk.json                     # used when you run the cdk CLI yourself from this directory
├── jest.config.cts              # only with --unitTestRunner=jest
├── project.json                 # deploy / synth / destroy / bootstrap targets
├── src/
│   ├── main.ts                  # CDK app entry point - the executors point cdk at this file
│   ├── main.test.ts             # only with --unitTestRunner=jest
│   └── stacks/
│       └── app-stack.ts         # your stack - start adding constructs here
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json           # only with --unitTestRunner=jest
```

The generator also adds `aws-cdk-lib` and `constructs` to `dependencies`, and the `aws-cdk` CLI plus
the TypeScript loaders (`ts-node`, `tsconfig-paths`, `tsx`) to `devDependencies` of your workspace.

> The CDK Toolkit CLI (`aws-cdk`) and the construct library (`aws-cdk-lib`) are released on separate
> version lines — `2.1xxx.x` for the CLI, `2.x` for the library. They are pinned independently.

## Executors

Every generated project gets four targets. Run them with `nx <target> <project>` or
`nx run <project>:<target>`.

Options shared by all four executors:

| Option            | Type                   | Description                                                             |
| ----------------- | ---------------------- | ----------------------------------------------------------------------- |
| `--profile`       | `string`               | AWS profile from `~/.aws/credentials` or `~/.aws/config`.               |
| `--context`, `-c` | `string` \| `string[]` | CDK context values as `KEY=VALUE`. Repeat the flag for multiple values. |

### `deploy`

Deploys the project's stacks to AWS.

| Option     | Type     | Description                                                                                  |
| ---------- | -------- | -------------------------------------------------------------------------------------------- |
| `--stacks` | `string` | Stack names or glob patterns to deploy, space separated. Defaults to every stack in the app. |

```shell
nx deploy my-app
nx deploy my-app --stacks=MyStack
nx deploy my-app --profile=production --context=env=prod
```

### `synth`

Synthesizes the app into CloudFormation templates without touching AWS. Useful in CI as a fast
"does this still compile into valid infrastructure" check.

| Option     | Type     | Description                                               |
| ---------- | -------- | --------------------------------------------------------- |
| `--stacks` | `string` | Stacks to synthesize. Defaults to every stack in the app. |

```shell
nx synth my-app
```

### `destroy`

Removes the project's deployed stacks.

| Option     | Type     | Description                                            |
| ---------- | -------- | ------------------------------------------------------ |
| `--stacks` | `string` | Stacks to destroy. Defaults to every stack in the app. |

```shell
nx destroy my-app
nx destroy my-app --stacks=MyStack --profile=staging
```

### `bootstrap`

Prepares an AWS environment (account + region pair) so CDK stacks can be deployed into it. Needed
once per environment — see the
[CDK bootstrapping guide](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html).

```shell
nx bootstrap my-app --profile=my-profile
nx bootstrap my-app aws://123456789012/us-east-1
```

### Passing extra CDK flags

Any option that is not part of an executor's schema is forwarded to the CDK CLI as
`--<option> <value>`, so the whole `cdk` surface stays reachable:

```shell
nx deploy my-app --hotswap=true          # -> cdk deploy --hotswap true
nx deploy my-app --requireApproval=never # -> cdk deploy --requireApproval never
nx synth my-app --quiet=true             # -> cdk synth --quiet true
```

You can also set them permanently in the project's `project.json`:

```json
{
  "targets": {
    "deploy": {
      "executor": "@wolsok/nx-aws-cdk-v2:deploy",
      "options": {
        "profile": "production",
        "requireApproval": "never"
      }
    }
  }
}
```

## How the executors invoke the CDK CLI

All four executors build the same shape of command and run it **from the workspace root**:

```shell
<pm-exec> cdk -a "<pm-exec> <loader> <workspace-root>/<project-root>/src/main.ts" <command> [stacks] [--flags]
```

- `<pm-exec>` is `npx` for npm workspaces, otherwise your package manager (`pnpm`, `yarn`, `bun`),
  detected by Nx.
- `<loader>` is `tsx` when the nearest `package.json` has `"type": "module"`, otherwise
  `ts-node --require tsconfig-paths/register --project <project-root>/tsconfig.app.json`.
- Because `cdk` runs with the workspace root as its working directory, `cdk.out` is written to the
  **workspace root**, and the generated `cdk.json` is _not_ read. That file exists for the times you
  invoke `cdk` yourself from the project directory.

Run any target with `--verbose` to see the exact command that is executed.

## Documentation

- [Getting started](https://github.com/WolfSoko/nx-aws-cdk-v2/blob/main/docs/getting-started.md)
- [API reference](https://github.com/WolfSoko/nx-aws-cdk-v2/blob/main/docs/api-documentation.md)
- [Architecture](https://github.com/WolfSoko/nx-aws-cdk-v2/blob/main/docs/architecture.md)
- [Troubleshooting](https://github.com/WolfSoko/nx-aws-cdk-v2/blob/main/docs/troubleshooting.md)

## Contributing

Issues and pull requests are welcome — see
[CONTRIBUTING.md](https://github.com/WolfSoko/nx-aws-cdk-v2/blob/main/CONTRIBUTING.md).

## License

MIT © Wolfram Sokollek

## Special thanks

This project is based on [@tienne](https://github.com/tienne)'s
[nx-plugins](https://github.com/codebrewlab/nx-plugins), and on
[@adrian-goe](https://github.com/adrian-goe)'s [nx-aws-cdk-v2](https://github.com/adrian-goe/nx-aws-cdk-v2).
Thanks to [@therk](https://github.com/therk) for the work on migrating to CDK v2.
