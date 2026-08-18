# API reference

Complete reference for every generator and executor in `@wolsok/nx-aws-cdk-v2`, matching the JSON
schemas the plugin ships.

## Table of contents

- [Generators](#generators)
  - [`application`](#application)
  - [`init`](#init)
- [Executors](#executors)
  - [Common options](#common-options)
  - [`deploy`](#deploy)
  - [`synth`](#synth)
  - [`destroy`](#destroy)
  - [`bootstrap`](#bootstrap)
  - [Forwarding arbitrary CDK flags](#forwarding-arbitrary-cdk-flags)
- [Configuring targets in `project.json`](#configuring-targets-in-projectjson)
- [Programmatic API](#programmatic-api)

## Generators

### `application`

Scaffolds an AWS CDK v2 application and registers the four CDK targets on it.

```shell
nx generate @wolsok/nx-aws-cdk-v2:application <name> [options]
```

Aliases: `app`.

| Option                    | Alias | Type             | Default | Required | Description                                                                            |
| ------------------------- | ----- | ---------------- | ------- | -------- | -------------------------------------------------------------------------------------- |
| `name`                    |       | `string`         | —       | yes      | Application name. Also accepted as the first positional argument; prompted if missing. |
| `directory`               | `-d`  | `string`         | —       | no       | Directory below the workspace's apps directory to place the project in.                |
| `tags`                    | `-t`  | `string`         | —       | no       | Comma separated tags added to the project.                                             |
| `unitTestRunner`          |       | `jest` \| `none` | `jest`  | no       | Adds a Jest configuration plus a sample stack test.                                    |
| `skipFormat`              |       | `boolean`        | `false` | no       | Skip running Prettier over the generated files.                                        |
| `setParserOptionsProject` |       | `boolean`        | `false` | no       | Configure ESLint's `parserOptions.project`. Off by default for lint performance.       |

Nx's global generator flags (`--dry-run`, `--verbose`, `--skip-nx-cache`, `--interactive`) work as
usual.

**Naming.** The project root is `<appsDir>/<directory>/<name>`; the Nx project name is that path
below `<appsDir>` with `/` replaced by `-`. `--directory=aws my-app` therefore produces the project
`aws-my-app` in `<appsDir>/aws/my-app`. `<appsDir>` is `workspaceLayout.appsDir` from `nx.json`, else
`apps/` or `packages/` if either exists, else the workspace root.

**Files created**

| Path                      | Created when            | Purpose                                                       |
| ------------------------- | ----------------------- | ------------------------------------------------------------- |
| `cdk.json`                | always                  | Config for invoking the `cdk` CLI from the project directory. |
| `src/main.ts`             | always                  | CDK app entry point; the executors point `cdk -a` at it.      |
| `src/stacks/app-stack.ts` | always                  | Empty stack to build on.                                      |
| `tsconfig.json`           | always                  | Project TypeScript config.                                    |
| `tsconfig.app.json`       | always                  | Used by `ts-node` when the executors run the app.             |
| `project.json`            | always                  | Target definitions.                                           |
| `jest.config.cts`         | `--unitTestRunner=jest` | Jest configuration for the project (extension chosen by Nx).  |
| `tsconfig.spec.json`      | `--unitTestRunner=jest` | TypeScript config for the test files.                         |
| `src/main.test.ts`        | `--unitTestRunner=jest` | Sample test asserting the synthesized template.               |

**Dependencies added to the workspace**

| Package          | Section           | Why                                                    |
| ---------------- | ----------------- | ------------------------------------------------------ |
| `aws-cdk-lib`    | `dependencies`    | The CDK v2 construct library your stacks import.       |
| `constructs`     | `dependencies`    | Construct programming model, peer of `aws-cdk-lib`.    |
| `aws-cdk`        | `devDependencies` | CDK Toolkit CLI the executors shell out to.            |
| `ts-node`        | `devDependencies` | Runs `main.ts` in CommonJS workspaces.                 |
| `tsconfig-paths` | `devDependencies` | Resolves workspace path aliases for `ts-node`.         |
| `tsx`            | `devDependencies` | Runs `main.ts` in ESM (`"type": "module"`) workspaces. |

### `init`

Hidden generator (aliases: `ng-add`) that adds the dependencies listed above. It runs automatically
as part of `application`; you rarely call it yourself.

```shell
nx generate @wolsok/nx-aws-cdk-v2:init
```

| Option           | Type             | Default | Description                                   |
| ---------------- | ---------------- | ------- | --------------------------------------------- |
| `unitTestRunner` | `jest` \| `none` | `jest`  | Also initialise Jest for the workspace.       |
| `skipFormat`     | `boolean`        | `false` | Skip running Prettier over the touched files. |

## Executors

Run a target with `nx <target> <project>` or `nx run <project>:<target>`.

### Common options

Accepted by all four executors:

| Option    | Alias | Type                   | Description                                                                            |
| --------- | ----- | ---------------------- | -------------------------------------------------------------------------------------- |
| `profile` |       | `string`               | AWS profile from `~/.aws/credentials` or `~/.aws/config`. Becomes `--profile <value>`. |
| `context` | `-c`  | `string` \| `string[]` | CDK context as `KEY=VALUE`. An array becomes one `--context` flag per entry.           |

### `deploy`

`@wolsok/nx-aws-cdk-v2:deploy` — runs `cdk deploy`.

| Option   | Type     | Default           | Description                                                                      |
| -------- | -------- | ----------------- | -------------------------------------------------------------------------------- |
| `stacks` | `string` | all stacks in app | Stack names or glob patterns, space separated, appended verbatim to the command. |

```shell
nx deploy my-app
nx deploy my-app --stacks=MyStack
nx deploy my-app --stacks="network api"
nx deploy my-app --profile=production --context=env=prod
```

### `synth`

`@wolsok/nx-aws-cdk-v2:synth` — runs `cdk synth`. No AWS calls, no credentials required for stacks
that are not environment-specific.

| Option   | Type     | Default           | Description           |
| -------- | -------- | ----------------- | --------------------- |
| `stacks` | `string` | all stacks in app | Stacks to synthesize. |

```shell
nx synth my-app
```

Output goes to `cdk.out/` at the **workspace root** (the executors run `cdk` from there):
`cdk.out/manifest.json` plus one `<stack>.template.json` per stack.

### `destroy`

`@wolsok/nx-aws-cdk-v2:destroy` — runs `cdk destroy`.

| Option   | Type     | Default           | Description        |
| -------- | -------- | ----------------- | ------------------ |
| `stacks` | `string` | all stacks in app | Stacks to destroy. |

```shell
nx destroy my-app --stacks=MyStack --profile=staging
```

### `bootstrap`

`@wolsok/nx-aws-cdk-v2:bootstrap` — runs `cdk bootstrap`, preparing an AWS environment for CDK
deployments. Only the [common options](#common-options) apply; the target environment is given
positionally.

```shell
nx bootstrap my-app --profile=my-profile
nx bootstrap my-app aws://123456789012/us-east-1
```

### Forwarding arbitrary CDK flags

Options that are not part of an executor's schema are passed straight through to the CDK CLI as
`--<option> <value>`. Array values produce one flag per element. This keeps the full `cdk` surface
available:

| You run                                        | The plugin executes                      |
| ---------------------------------------------- | ---------------------------------------- |
| `nx deploy my-app --hotswap=true`              | `cdk deploy --hotswap true`              |
| `nx deploy my-app --requireApproval=never`     | `cdk deploy --requireApproval never`     |
| `nx synth my-app --quiet=true`                 | `cdk synth --quiet true`                 |
| `nx deploy my-app --context=a=1 --context=b=2` | `cdk deploy --context a=1 --context b=2` |

Two things to know: values are always emitted as `--flag value` (there are no bare boolean flags, so
write `--hotswap=true` rather than `--hotswap`), and `stacks` is the only option appended _without_ a
`--` prefix.

## Configuring targets in `project.json`

Every option above can be set as a target option instead of being typed each time:

```json
{
  "targets": {
    "deploy": {
      "executor": "@wolsok/nx-aws-cdk-v2:deploy",
      "options": {
        "profile": "production",
        "requireApproval": "never"
      },
      "configurations": {
        "staging": { "profile": "staging", "context": "env=staging" },
        "production": { "profile": "production", "context": "env=production" }
      }
    }
  }
}
```

```shell
nx deploy my-app --configuration=staging
```

CLI arguments win over target options, and target options win over `configurations` defaults in the
usual Nx precedence order.

**A note on caching.** `deploy`, `destroy` and `bootstrap` change remote state and must not be
cached. `synth` is a pure function of your source, so caching it in `nx.json` is safe and useful:

```json
{
  "targetDefaults": {
    "synth": {
      "cache": true,
      "inputs": ["default", "^default"]
    }
  }
}
```

## Programmatic API

The package's entry point re-exports the generators, executors and the dependency version constants,
for composing them from your own Nx plugin:

```ts
import {
  applicationGenerator,
  initGenerator,
  deployExecutor,
  CDK_CLI_VERSION,
  CDK_LIB_VERSION,
  type ApplicationSchema,
} from '@wolsok/nx-aws-cdk-v2';

export default async function myGenerator(tree: Tree, options: ApplicationSchema) {
  await applicationGenerator(tree, options);
  // ...your own additions
}
```

Schema types (`ApplicationSchema`, `InitGeneratorSchema`, `DeployExecutorSchema`,
`DestroyExecutorSchema`, `SynthExecutorSchema`, `BootstrapExecutorSchema`) are exported as types.
