# Maintainer backlog

Internal improvement backlog for the repository. This is **not** consumer documentation — start at
the [package README](../packages/aws-cdk-v2/README.md) if you are using the plugin.

`[x]` means done and on `main`.

## Documentation

- [x] Comprehensive root README covering purpose, features and usage
- [x] API reference for every executor and generator, matching the shipped schemas
- [x] Getting started guide with an end-to-end walkthrough
- [x] Troubleshooting guide with symptoms, causes and fixes
- [x] Architecture documentation explaining the plugin's design and components
- [x] Document all configuration options with examples and best practices
- [x] Changelog and documented release process
- [ ] Rendered diagrams (the architecture doc currently uses ASCII flow diagrams)
- [ ] Publish the docs as a site rather than as Markdown in the repo

## Testing

- [x] Unit tests for all executors (deploy, destroy, synth, bootstrap)
- [x] e2e coverage for generate, synth and deploy
- [ ] Complete the skipped bootstrap e2e tests (LocalStack or an equivalent emulator)
- [ ] e2e coverage for destroy
- [ ] Raise unit test coverage to at least 80% and enforce it in CI
- [ ] Snapshot tests for the generated files
- [ ] Run CI against multiple Node.js versions

## Code quality

- [x] Replace ad-hoc `console.log` output with the Nx logger
- [x] Type the executor and generator schemas properly
- [x] Validate the plugin manifests in CI (`@nx/nx-plugin-checks`)
- [ ] Factor the four near-identical executors onto a shared base implementation
- [ ] Input validation with actionable error messages for executor and generator options
- [ ] Enable `strict` in `tsconfig.base.json` and fix the fallout

## Features

- [x] `synth` executor
- [ ] `diff` executor
- [ ] Watch mode (`cdk watch`) support
- [ ] Generator for CDK constructs
- [ ] Hotswap-friendly defaults for local development
- [ ] CDK context management helpers

## Build and CI/CD

- [x] Automated release to npm via OIDC trusted publishing
- [x] Automatic GitHub release creation from Conventional Commits once CI is green on `main`
      (Nx Release)
- [x] Distributed CI task execution and self-healing CI via Nx Cloud
- [x] Formatting and lint checks in CI
- [x] Automated dependency updates (Renovate), grouped for Nx and the CDK
- [x] e2e suite running in CI
- [ ] Code coverage reporting
- [ ] Cross-platform testing (Windows, macOS)

## Dependencies

- [x] Track the CDK CLI and the construct library as separate version lines
- [x] Declare `@nx/devkit` / `@nx/jest` as peer dependencies with documented ranges
- [x] Document Node.js and Nx version requirements
- [ ] Periodic audit of transitive vulnerabilities beyond what Renovate automates

## User experience

- [x] Document the pass-through behaviour for arbitrary CDK flags
- [ ] Progress indicators for long-running operations
- [ ] Colorized, summarized output instead of raw CDK CLI passthrough
