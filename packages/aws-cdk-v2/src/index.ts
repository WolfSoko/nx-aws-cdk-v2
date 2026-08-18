/**
 * Public entry point of `@wolsok/nx-aws-cdk-v2`.
 *
 * Generators and executors are resolved by Nx through `generators.json` and
 * `executors.json`; the exports below are for consumers who want to compose the
 * generators from their own Nx plugin, or reuse the option types.
 */
export { applicationGenerator, applicationSchematic } from './generators/application/application';
export { initGenerator, initSchematic } from './generators/init/init';

export type { ApplicationSchema } from './generators/application/schema';
export type { InitGeneratorSchema } from './generators/init/schema';

export { default as bootstrapExecutor } from './executors/bootstrap/bootstrap';
export { default as deployExecutor } from './executors/deploy/deploy';
export { default as destroyExecutor } from './executors/destroy/destroy';
export { default as synthExecutor } from './executors/synth/synth';

export type { BootstrapExecutorSchema } from './executors/bootstrap/schema';
export type { DeployExecutorSchema } from './executors/deploy/schema';
export type { DestroyExecutorSchema } from './executors/destroy/schema';
export type { SynthExecutorSchema } from './executors/synth/schema';

export {
  CDK_CLI_VERSION,
  CDK_CONSTRUCTS_VERSION,
  CDK_LIB_VERSION,
  TS_NODE_VERSION,
  TSCONFIG_PATHS_VERSION,
  TSX_VERSION,
} from './utils/cdk-shared';
