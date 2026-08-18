# Architecture

How `@wolsok/nx-aws-cdk-v2` is put together. Useful if you are contributing, debugging an
unexpected `cdk` command line, or building your own plugin on top of this one.

## Table of contents

- [The shape of the plugin](#the-shape-of-the-plugin)
- [Anatomy of a generator](#anatomy-of-a-generator)
- [Anatomy of an executor](#anatomy-of-an-executor)
- [How a `nx deploy` run flows](#how-a-nx-deploy-run-flows)
- [Command construction](#command-construction)
- [Design decisions](#design-decisions)
- [Testing strategy](#testing-strategy)

## The shape of the plugin

An Nx plugin is a package with two manifests. `generators.json` and `executors.json` map a public
name to an implementation file and a JSON schema; Nx reads them when it resolves
`@wolsok/nx-aws-cdk-v2:deploy`.

```text
packages/aws-cdk-v2/
├── generators.json           # application, init
├── executors.json            # deploy, destroy, synth, bootstrap
├── migrations.json           # entry point for `nx migrate`
├── package.json              # points Nx at the manifests via "generators"/"executors"
└── src/
    ├── index.ts              # public entry point, re-exports everything below
    ├── generators/
    │   ├── application/      # application.ts, schema.json, schema.d.ts, files/, jest-files/
    │   └── init/             # init.ts, schema.json, schema.d.ts
    ├── executors/
    │   ├── deploy/           # deploy.ts, schema.json, schema.d.ts
    │   ├── destroy/
    │   ├── synth/
    │   └── bootstrap/
    ├── interfaces/           # ParsedExecutorInterface - the normalized option shape
    └── utils/
        ├── executor.util.ts  # builds and runs the cdk command line
        ├── cdk-shared.ts     # dependency versions the init generator installs
        └── testing.ts        # ExecutorContext factory for unit tests
```

Every generator and executor keeps its implementation, schema, generated types and spec in one
directory. Adding a new one means creating that directory **and** registering it in the matching
manifest — the `@nx/nx-plugin-checks` lint rule fails the build if a manifest points at something
that does not exist.

## Anatomy of a generator

Generators are pure functions over an Nx `Tree` (a virtual file system). Nothing touches disk until
Nx flushes the tree, which is what makes `--dry-run` work for free.

`application` does five things:

1. **Normalize options** — derive `projectName`, `projectRoot` and parsed tags from the raw schema.
   The project root comes from `getWorkspaceLayout(tree).appsDir`, which is why generated projects
   follow whatever layout the consumer workspace uses.
2. **Delegate to `init`** — which adds `aws-cdk-lib`, `constructs`, the CDK Toolkit CLI and the
   TypeScript loaders to the workspace `package.json`, and returns an install task.
3. **Register the project** — `addProjectConfiguration` with the four CDK targets.
4. **Render templates** — `generateFiles` over `files/` (and `jest-files/` when Jest is on). Template
   files carry a `__template__` suffix so they are not compiled as part of the plugin, and use EJS
   placeholders such as `<%= projectName %>` and `<%= offsetFromRoot %>`.
5. **Return install tasks** — `runTasksInSerial` so Nx installs dependencies once, after the tree is
   written.

## Anatomy of an executor

All four executors have the same three-step shape:

```ts
export default async function runExecutor(options: Schema, context: ExecutorContext) {
  const normalized = normalizeOptions(options, context); // schema options + project paths
  const command = createCommand('deploy', normalized); // build the cdk command line
  return { success: await runCommandProcess(command, context.root) };
}
```

`normalizeOptions` splits the incoming options into the ones the plugin understands itself (`stacks`,
and `profile` for `bootstrap`) and everything else, which `parseArgs` collects for verbatim
forwarding. It also pulls `root` and `sourceRoot` for the current project out of the
`ExecutorContext`.

## How a `nx deploy` run flows

```text
nx deploy my-app
  │
  ├─ Nx resolves the target -> @wolsok/nx-aws-cdk-v2:deploy
  ├─ Nx validates the CLI args against src/executors/deploy/schema.json
  ├─ deploy.ts       normalizeOptions(options, context)
  │                    ├─ stacks           -> appended verbatim
  │                    └─ everything else  -> parseArgs -> --flag value
  ├─ executor.util   createCommand('deploy', normalized)
  │                    └─ generateCommandString() decides package manager + TS loader
  └─ executor.util   runCommandProcess(command, context.root)
                       └─ child_process.exec, stdio piped through, resolves on exit code 0
```

The executor resolves to `{ success: true | false }` — a non-zero exit code from `cdk` fails the Nx
target rather than throwing.

## Command construction

`generateCommandString(command, projectRoot)` produces:

```shell
<pm-exec> cdk -a "<pm-exec> <loader> <workspace-root>/<project-root>/src/main.ts" <command>
```

- **`<pm-exec>`** comes from Nx's `detectPackageManager()`: `npx` for npm, otherwise the package
  manager binary itself (`pnpm`, `yarn`, `bun`).
- **`<loader>`** is `tsx` when the nearest `package.json` declares `"type": "module"`, otherwise
  `ts-node --require tsconfig-paths/register --project <project-root>/tsconfig.app.json`. The
  project's own `package.json` wins over the workspace one.
- **The workspace root** is `process.env.NX_WORKSPACE_ROOT` — set by Nx for every task — falling back
  to the devkit's `workspaceRoot`.

`createCommand` then appends, in order: the `stacks` value (verbatim, no `--` prefix) and one
`--<key> <value>` per remaining option, expanding array values into repeated flags.

The command runs with the **workspace root** as its working directory. Two consequences worth
knowing: `cdk.out/` is written to the workspace root, and the generated `cdk.json` in the project
directory is not read by the executors — it exists for when you run `cdk` there yourself.

## Design decisions

**Shell out to the CDK CLI instead of using the CDK's programmatic API.** The CLI is the supported,
stable interface, and shelling out means every `cdk` flag — present and future — works without the
plugin growing a matching option. The cost is that options are stringly typed.

**Unknown options are forwarded, not rejected.** The executor schemas describe the options the plugin
treats specially; everything else passes through. This is why the schemas do not set
`additionalProperties: false`.

**Version constants live in one file.** `utils/cdk-shared.ts` is the single place that decides which
CDK versions a new workspace gets. The CLI (`aws-cdk`, on `2.1xxx.x`) and the construct library
(`aws-cdk-lib`, on `2.x`) are separate constants because they are separate release lines.

**The CDK Toolkit is a dev dependency of the consumer.** Deploying is a build-time activity; the
plugin does not depend on `aws-cdk` itself, so consumers control the CLI version.

## Testing strategy

**Unit tests** (`packages/aws-cdk-v2/**/*.spec.ts`, `nx test aws-cdk-v2`) run generators against an
in-memory tree and executors against a mocked `child_process.exec`, asserting the exact command line
that would have been run. They are fast and cover option handling.

**e2e tests** (`e2e/aws-cdk-v2-e2e`, `nx e2e aws-cdk-v2-e2e`) build the plugin, install it into a
throwaway Nx workspace with `ensureNxProject`, and run real `nx generate` / `nx run` commands:

- `synth` runs the **real** CDK CLI and asserts against the emitted `cdk.out/manifest.json`.
- `deploy` swaps the workspace's `cdk` binary for a stub shell script that logs its arguments, so the
  invocation can be asserted without touching AWS. The original binary is restored in a `finally`.
- `bootstrap` tests are skipped pending a way to run them against a local AWS emulator.

Project configuration is read back through `nx show project <name> --json` rather than by reading
files, so the tests assert what Nx actually resolves.
