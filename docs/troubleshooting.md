# Troubleshooting

Symptoms, causes and fixes for the problems people actually hit with
`@wolsok/nx-aws-cdk-v2`. If none of these match, open an
[issue](https://github.com/WolfSoko/nx-aws-cdk-v2/issues) with the output of the failing command run
with `--verbose`.

## Table of contents

- [First: see the command that actually ran](#first-see-the-command-that-actually-ran)
- [Installation and resolution](#installation-and-resolution)
- [Generator problems](#generator-problems)
- [Running a target](#running-a-target)
- [AWS credentials and permissions](#aws-credentials-and-permissions)
- [Deploy, destroy and bootstrap](#deploy-destroy-and-bootstrap)
- [Output locations and caching](#output-locations-and-caching)
- [Getting help](#getting-help)

## First: see the command that actually ran

Almost every executor problem is really a CDK problem, and the fastest way to tell is to look at the
command line the plugin built:

```shell
nx deploy my-app --verbose
```

Nx prints the executor's debug log, including `Executing command: npx cdk -a "npx ts-node …" deploy`.
Copy that command, run it by hand, and you will usually get a much clearer error from the CDK CLI. If
the hand-run command works and the target does not, the difference is in the target's options.

## Installation and resolution

### `Cannot find module '@wolsok/nx-aws-cdk-v2'` / `Unable to resolve @wolsok/nx-aws-cdk-v2:application`

The plugin is not installed in the workspace you are running from.

```shell
npm install --save-dev @wolsok/nx-aws-cdk-v2
```

Check that it appears in `devDependencies`, and that you are in the workspace root. If you are
testing a local build via `npm link`, re-link after every rebuild — `npm link` points at the build
output, which `nx build aws-cdk-v2` replaces.

### `ERESOLVE could not resolve` while installing

npm cannot satisfy a peer range in your workspace — usually a mixed set of Nx versions.

```shell
npm install --save-dev @wolsok/nx-aws-cdk-v2 --legacy-peer-deps
```

Better: make sure every `@nx/*` package and `nx` itself are on the same version first
(`npx nx migrate latest`), then install again without the flag.

### Peer dependency warnings about `@nx/devkit` or `@nx/jest`

The plugin declares `@nx/devkit` (required) and `@nx/jest` (optional) as peers, both `>= 21`. Install
`@nx/devkit` if your workspace does not have it. `@nx/jest` is only needed when generating
applications with `--unitTestRunner=jest`, which is the default — pass `--unitTestRunner=none` if you
do not want Jest.

## Generator problems

### The application landed somewhere unexpected

The project root is `<appsDir>/<directory>/<name>`, where `<appsDir>` is `workspaceLayout.appsDir`
from `nx.json` if set, otherwise `apps/` or `packages/` if either exists, otherwise the workspace
root. Set it explicitly if you want a fixed location:

```json
{
  "workspaceLayout": { "appsDir": "apps", "libsDir": "libs" }
}
```

Preview before committing to it:

```shell
nx g @wolsok/nx-aws-cdk-v2:application my-app --dry-run
```

### `The project my-app already exists`

An Nx project with that name is already registered. Pick another name, or note that `--directory=aws`
makes the project name `aws-my-app`, which may be what you want.

### Generation succeeds but dependencies are missing

The generator writes `package.json` and then runs your package manager's install. If that install
fails (network, registry auth, lockfile conflict) the files are still on disk. Just install again:

```shell
npm install
```

## Running a target

### `cdk: command not found` / `Cannot find module 'aws-cdk'`

The CDK Toolkit is not installed in the workspace. The generator adds it, so this usually means the
post-generation install did not complete:

```shell
npm install --save-dev aws-cdk
```

### `Cannot find module 'ts-node'` or `tsx: command not found`

The executors run your `main.ts` through a TypeScript loader: `ts-node` (plus `tsconfig-paths`) for
CommonJS workspaces, `tsx` for workspaces whose `package.json` has `"type": "module"`. The generator
installs all three; install whichever is missing:

```shell
npm install --save-dev ts-node tsconfig-paths tsx
```

### `Unknown file extension ".ts"` or `Cannot use import statement outside a module`

A mismatch between your workspace's module type and the loader. The plugin picks the loader from the
nearest `package.json`: the project's own if it declares `"type"`, otherwise the workspace one. Make
that field say what you actually mean — add `"type": "module"` for ESM, remove it for CommonJS — and
run again.

### `Cannot find module '@myorg/some-lib'` when synthesizing

Your stack imports a workspace library through a `tsconfig.base.json` path alias. In CommonJS
workspaces those are resolved by `tsconfig-paths`, loaded through the project's `tsconfig.app.json`
— make sure that file still extends your workspace's base config. In ESM workspaces, `tsx` does not
read `paths`; import the library through its package name and make sure it is built, or use a
relative import.

### The target runs but ignores the options in `cdk.json`

Expected. The executors run the CDK CLI from the **workspace root** with an explicit `-a` app
argument, so the project's `cdk.json` is never read — including its `requireApproval` and `output`
settings. Put those on the target instead:

```json
{
  "targets": {
    "deploy": {
      "executor": "@wolsok/nx-aws-cdk-v2:deploy",
      "options": { "requireApproval": "never" }
    }
  }
}
```

### A CDK flag has no effect

Options are forwarded as `--flag value`, never as a bare flag. Write `--hotswap=true`, not
`--hotswap`. Confirm with `--verbose` what was actually appended.

## AWS credentials and permissions

### `Unable to resolve AWS account to use` / `Need to perform AWS calls but no credentials configured`

The AWS SDK found no usable credentials. Verify outside of Nx first:

```shell
aws sts get-caller-identity
aws sts get-caller-identity --profile my-profile
```

Then pass the profile to the target, or export `AWS_PROFILE`:

```shell
nx deploy my-app --profile=my-profile
AWS_PROFILE=my-profile nx deploy my-app
```

### `ExpiredToken` / `The security token included in the request is invalid`

Short-lived credentials expired. Refresh them (`aws sso login --profile my-profile`) and retry.

### `AccessDenied` during deploy

The principal is authenticated but lacks permissions. CDK deploys assume the CDK execution roles
created during bootstrapping, so check that the environment was bootstrapped with a trust policy your
principal can assume, and that the roles still exist.

## Deploy, destroy and bootstrap

### `This stack uses assets, so the toolkit stack must be deployed to the environment`

The account/region has not been bootstrapped:

```shell
nx bootstrap my-app --profile=my-profile
# or, explicitly
nx bootstrap my-app aws://123456789012/eu-central-1
```

### Deploy hangs waiting for input

A change touches IAM or security groups, and the CDK CLI is asking for confirmation. The generated
`cdk.json` sets `"requireApproval": "never"`, but the executors do not read it — pass it explicitly,
especially in CI:

```shell
nx deploy my-app --requireApproval=never
```

### `Stack ... is in ROLLBACK_COMPLETE state and cannot be updated`

CloudFormation state, not a plugin problem: a stack that failed its very first create cannot be
updated. Delete it and deploy again:

```shell
nx destroy my-app --stacks=MyStack
nx deploy my-app --stacks=MyStack
```

### Destroy leaves resources behind

Resources with `RemovalPolicy.RETAIN` (the default for stateful resources such as RDS instances and,
depending on configuration, S3 buckets) are deliberately kept. Non-empty S3 buckets also block
deletion unless `autoDeleteObjects` is set. Remove them manually or adjust the removal policy before
destroying.

### `--stacks` does not select what you expect

The value is appended verbatim to the `cdk` command line, so it follows CDK's stack selection rules:
names or glob patterns, space separated. Quote multiple stacks — `--stacks="network api"` — and check
`nx synth my-app` output for the names CDK actually knows.

## Output locations and caching

### Where did `cdk.out` go?

To the **workspace root**, because the executors run `cdk` from there. Add it to `.gitignore`:

```gitignore
cdk.out/
```

### Should I cache these targets?

Cache `synth` — it is a pure function of your source. Never cache `deploy`, `destroy` or `bootstrap`:
they change remote state, and a cache hit would silently skip a real deployment.

```json
{
  "targetDefaults": {
    "synth": { "cache": true, "inputs": ["default", "^default"] }
  }
}
```

### Nx does not see my changes / stale project graph

Reset the Nx cache and daemon:

```shell
npx nx reset
```

## Getting help

1. Re-run with `--verbose` and try the printed `cdk` command by hand.
2. Check the [AWS CDK v2 developer guide](https://docs.aws.amazon.com/cdk/v2/guide/home.html) if the
   error comes from the CDK CLI rather than from Nx.
3. Search the [existing issues](https://github.com/WolfSoko/nx-aws-cdk-v2/issues).
4. Open a new issue with your Nx version (`npx nx --version`), Node version, the plugin version, the
   target's configuration from `project.json`, and the `--verbose` output.
