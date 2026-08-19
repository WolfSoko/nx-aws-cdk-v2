# Changelog

All notable changes to `@wolsok/nx-aws-cdk-v2` are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Published versions and their release notes are also on the
[releases page](https://github.com/WolfSoko/nx-aws-cdk-v2/releases).

## [Unreleased]

### Added

- Automatic releases: once CI is green on `main`, Nx Release inspects the Conventional Commits since
  the last release and, if warranted, versions the plugin, builds it, publishes it to npm and creates
  a GitHub release with generated notes, all in one CI job. See the "Releasing" section in
  [CONTRIBUTING.md](./CONTRIBUTING.md).
- Distributed CI task execution and self-healing CI via Nx Cloud agents.
- Public entry point: generators, executors and the CDK version constants are now exported from
  `@wolsok/nx-aws-cdk-v2`, together with their option types.
- `profile` and `context` are documented options on all four executors, so they show up in
  `nx run <project>:<target> --help` and are validated.
- `migrations.json`, wired up through `nx-migrations`, giving `nx migrate` a valid entry point.
- Peer dependencies on `@nx/devkit` (required) and `@nx/jest` (optional), both `>= 21`, plus an
  `engines` field requiring Node.js `>= 20.19`.
- The `init` generator now installs the TypeScript loaders the executors need (`ts-node`,
  `tsconfig-paths`, `tsx`) instead of assuming they are present.
- Architecture documentation, a pull request template, and this changelog.

### Changed

- The CDK Toolkit CLI (`aws-cdk`) and the construct library (`aws-cdk-lib`) are tracked as separate
  version lines and bumped to current releases — previously both were pinned to `^2.77.0`, which
  installed a CLI that was years out of date.
- `aws-cdk` is now added to the consumer's `devDependencies` rather than `dependencies`.
- Executor and generator schemas carry real titles and descriptions, so `--help` is useful.
- Documentation rewritten for consumers: README, getting started, API reference and troubleshooting
  now match what the plugin actually does, including the previously undocumented `synth` executor.
- Generated `cdk.json` points at the same `ts-node` invocation the executors use, and writes to
  `dist/cdk.out/<project>` instead of assuming an `apps/` layout.
- Toolchain: `moduleResolution: node16` and `target: es2022` with no deprecated compiler options,
  JSON manifests validated by `@nx/nx-plugin-checks`, and a single CI workflow that runs formatting,
  lint, tests, build and e2e.

### Fixed

- An application-level `package.json` `"type"` field is now honoured when choosing the TypeScript
  loader; the path it was looked up under could never exist.
- Executors no longer print raw `console.log` diagnostics into consumer output — everything goes
  through the Nx logger at debug level.
- Importing the plugin no longer throws when `NX_WORKSPACE_ROOT` is unset; the workspace root falls
  back to the Nx devkit's.

## Earlier releases

See the [releases page](https://github.com/WolfSoko/nx-aws-cdk-v2/releases) for the history before
this changelog was introduced.
