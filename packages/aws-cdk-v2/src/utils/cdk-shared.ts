/**
 * Dependency versions the `init` generator adds to a consumer workspace.
 *
 * `aws-cdk` (the CDK Toolkit CLI) and `aws-cdk-lib` (the construct library) are
 * released on separate version lines — the CLI moved to `2.1xxx.x` when it was
 * decoupled from the library, while the library stays on `2.x`. They therefore
 * have to be pinned independently; using one constant for both pulls in a CLI
 * that is years behind.
 */
export const CDK_CLI_VERSION = '^2.1137.0';
export const CDK_LIB_VERSION = '^2.265.0';
export const CDK_CONSTRUCTS_VERSION = '^10.8.1';

/**
 * TypeScript loaders used to run a CDK app's `main.ts` without a build step.
 * `tsx` is used for ESM workspaces (`"type": "module"`), `ts-node` +
 * `tsconfig-paths` for CommonJS ones — see `generateCommandString`.
 */
export const TSX_VERSION = '^4.20.0';
export const TS_NODE_VERSION = '^10.9.2';
export const TSCONFIG_PATHS_VERSION = '^4.2.0';

/**
 * @deprecated Use {@link CDK_LIB_VERSION} for `aws-cdk-lib` and
 * {@link CDK_CLI_VERSION} for the `aws-cdk` CLI instead.
 */
export const CDK_VERSION = CDK_LIB_VERSION;
