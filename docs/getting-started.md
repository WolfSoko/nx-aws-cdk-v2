# Getting started with `@wolsok/nx-aws-cdk-v2`

A walkthrough from an empty machine to a deployed CDK stack, and what to do next.

## Table of contents

- [Prerequisites](#prerequisites)
- [1. Get an Nx workspace](#1-get-an-nx-workspace)
- [2. Add the plugin](#2-add-the-plugin)
- [3. Generate an application](#3-generate-an-application)
- [4. Understand what was generated](#4-understand-what-was-generated)
- [5. Write some infrastructure](#5-write-some-infrastructure)
- [6. Synthesize](#6-synthesize)
- [7. Bootstrap the AWS environment](#7-bootstrap-the-aws-environment)
- [8. Deploy](#8-deploy)
- [9. Destroy](#9-destroy)
- [Going further](#going-further)
- [Where to next](#where-to-next)

## Prerequisites

| Tool              | Version    | Notes                                                                        |
| ----------------- | ---------- | ---------------------------------------------------------------------------- |
| Node.js           | `>= 20.19` | `node --version`. Use the version in the project's `.nvmrc` if there is one. |
| npm / pnpm / yarn | any        | The executors detect your package manager through Nx.                        |
| Nx                | `>= 21`    | Installed in the workspace; no global install needed.                        |
| AWS credentials   | —          | See below.                                                                   |

You do **not** need a global `aws-cdk` install — the generator adds the CDK Toolkit to your
workspace's `devDependencies` and the executors use that copy.

Credentials can come from anywhere the AWS SDK looks: `aws configure`, `AWS_PROFILE`,
`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`, IAM Identity Center (SSO), or an OIDC role in CI. Check
that they resolve before you start:

```shell
aws sts get-caller-identity
```

## 1. Get an Nx workspace

Skip this if you already have one.

```shell
npx create-nx-workspace@latest my-aws-workspace --preset=ts
cd my-aws-workspace
```

Any Nx workspace preset works — the plugin does not assume a framework.

## 2. Add the plugin

```shell
npm install --save-dev @wolsok/nx-aws-cdk-v2
```

## 3. Generate an application

```shell
nx generate @wolsok/nx-aws-cdk-v2:application my-cdk-app
```

Useful options:

```shell
# put it in a sub directory - the project is then called "aws-my-cdk-app"
nx g @wolsok/nx-aws-cdk-v2:application my-cdk-app --directory=aws

# tag it, so `nx affected` and module boundary rules can target it
nx g @wolsok/nx-aws-cdk-v2:application my-cdk-app --tags=scope:infra,type:app

# no Jest configuration
nx g @wolsok/nx-aws-cdk-v2:application my-cdk-app --unitTestRunner=none

# see what would happen without writing anything
nx g @wolsok/nx-aws-cdk-v2:application my-cdk-app --dry-run
```

The generator also adds `aws-cdk-lib` + `constructs` to `dependencies` and `aws-cdk`, `ts-node`,
`tsconfig-paths` and `tsx` to `devDependencies`, then installs them.

## 4. Understand what was generated

The project root is `<appsDir>/<name>`, where `<appsDir>` is `workspaceLayout.appsDir` from
`nx.json` if you set it, otherwise `apps/` or `packages/` if either directory already exists, and the
workspace root if neither does. The examples below assume an `apps/` layout.

```text
apps/my-cdk-app/
├── cdk.json            # config for running the cdk CLI by hand from this directory
├── jest.config.cts
├── project.json        # the deploy / synth / destroy / bootstrap targets
├── src/
│   ├── main.ts         # the CDK app entry point
│   ├── main.test.ts    # a Jest test asserting the synthesized template
│   └── stacks/
│       └── app-stack.ts
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json
```

`src/main.ts` is the entry point the executors point the CDK CLI at:

```ts
import { App } from 'aws-cdk-lib';
import { AppStack } from './stacks/app-stack';

const app = new App();
new AppStack(app, 'my-cdk-app');
```

`src/stacks/app-stack.ts` is where your infrastructure goes:

```ts
import { App, Stack, StackProps } from 'aws-cdk-lib';

export class AppStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // Define your infrastructure here
  }
}
```

`project.json` wires up the four targets:

```json
{
  "targets": {
    "deploy": { "executor": "@wolsok/nx-aws-cdk-v2:deploy", "options": {} },
    "synth": { "executor": "@wolsok/nx-aws-cdk-v2:synth", "options": {} },
    "destroy": { "executor": "@wolsok/nx-aws-cdk-v2:destroy", "options": {} },
    "bootstrap": { "executor": "@wolsok/nx-aws-cdk-v2:bootstrap", "options": {} }
  }
}
```

## 5. Write some infrastructure

An S3 bucket, to have something real to deploy:

```ts
import { App, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';

export class AppStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    new Bucket(this, 'AssetsBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY, // fine for a sandbox, not for production data
    });
  }
}
```

The generated Jest test asserts an _empty_ stack, so update it as soon as you add resources:

```ts
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AppStack } from './stacks/app-stack';

describe('MyCdkApp', () => {
  it('creates an encrypted, versioned bucket', () => {
    const app = new App();

    const template = Template.fromStack(new AppStack(app, 'MyCdkAppTestStack'));

    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
    });
  });
});
```

```shell
nx test my-cdk-app
```

## 6. Synthesize

`synth` turns your TypeScript into CloudFormation without contacting AWS — the fastest way to check
your work, and a good CI gate:

```shell
nx synth my-cdk-app
```

The templates land in `cdk.out/` **at the workspace root**, because the executors run the CDK CLI
from there. `cdk.out/` is worth adding to `.gitignore`.

## 7. Bootstrap the AWS environment

Every AWS account + region pair needs to be bootstrapped once before CDK can deploy into it. This
creates a small CloudFormation stack (`CDKToolkit`) holding the staging bucket and roles:

```shell
# using a named profile
nx bootstrap my-cdk-app --profile=my-profile

# or an explicit environment
nx bootstrap my-cdk-app aws://123456789012/eu-central-1
```

See the [CDK bootstrapping guide](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) for
what the stack contains and how to customize it.

## 8. Deploy

```shell
nx deploy my-cdk-app

# a single stack
nx deploy my-cdk-app --stacks=MyStack

# against a specific account
nx deploy my-cdk-app --profile=production
```

Note that the generated `cdk.json` sets `"requireApproval": "never"`, but the executors run the CDK
CLI from the workspace root and therefore do not read it. If a stack changes IAM or security group
rules, the CLI will ask for confirmation — pass `--requireApproval=never` explicitly (for example in
CI) to skip the prompt.

## 9. Destroy

```shell
nx destroy my-cdk-app
nx destroy my-cdk-app --stacks=MyStack
```

Resources with a `RETAIN` removal policy survive; everything else goes.

## Going further

### Multiple stacks

Add them to `src/main.ts` and address them by name:

```ts
const app = new App();
new NetworkStack(app, 'network');
new ApiStack(app, 'api');
```

```shell
nx deploy my-cdk-app --stacks=api
nx deploy my-cdk-app --stacks="network api"
```

### Per-environment configuration

Use CDK context values and read them in your stack with `this.node.tryGetContext('env')`:

```shell
nx deploy my-cdk-app --context=env=staging --profile=staging
```

Multiple values are supported — repeat the flag.

### Pinning options in `project.json`

Anything you would type on the command line can live in the target's `options`:

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

Use `configurations` for per-environment variants:

```json
{
  "targets": {
    "deploy": {
      "executor": "@wolsok/nx-aws-cdk-v2:deploy",
      "options": { "requireApproval": "never" },
      "configurations": {
        "staging": { "profile": "staging", "context": "env=staging" },
        "production": { "profile": "production", "context": "env=production" }
      }
    }
  }
}
```

```shell
nx deploy my-cdk-app --configuration=production
```

### In CI

`synth` and `test` are safe to run on every pull request; `deploy` belongs on a protected branch with
credentials from an OIDC role rather than long-lived keys:

```shell
npx nx affected -t test synth      # pull requests
npx nx deploy my-cdk-app --requireApproval=never   # main
```

### ESM workspaces

If your workspace `package.json` has `"type": "module"`, the executors run the app through `tsx`
instead of `ts-node` automatically. Nothing to configure.

## Where to next

- [Package README](../packages/aws-cdk-v2/README.md) — every option in one place
- [API reference](./api-documentation.md) — schemas and defaults
- [Architecture](./architecture.md) — how the plugin works internally
- [Troubleshooting](./troubleshooting.md) — when something goes wrong
- [AWS CDK v2 developer guide](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
