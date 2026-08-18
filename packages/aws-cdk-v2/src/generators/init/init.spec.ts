import { readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { initGenerator } from './init';
import { InitGeneratorSchema } from './schema';
import { CDK_CLI_VERSION, CDK_CONSTRUCTS_VERSION, CDK_LIB_VERSION } from '../../utils/cdk-shared';

describe('init', () => {
  let tree: Tree;
  const options: InitGeneratorSchema = {};

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add the CDK construct library as a runtime dependency', async () => {
    await initGenerator(tree, options);
    const packageJson = readJson(tree, 'package.json');

    expect(packageJson.dependencies['aws-cdk-lib']).toBe(CDK_LIB_VERSION);
    expect(packageJson.dependencies['constructs']).toBe(CDK_CONSTRUCTS_VERSION);
  });

  it('should add the CDK CLI and the TypeScript loaders as dev dependencies', async () => {
    await initGenerator(tree, options);
    const packageJson = readJson(tree, 'package.json');

    expect(packageJson.devDependencies['aws-cdk']).toBe(CDK_CLI_VERSION);
    expect(packageJson.devDependencies['ts-node']).toBeDefined();
    expect(packageJson.devDependencies['tsconfig-paths']).toBeDefined();
    expect(packageJson.devDependencies['tsx']).toBeDefined();
  });

  it('should keep the CLI and the construct library on their own version lines', async () => {
    await initGenerator(tree, options);
    const packageJson = readJson(tree, 'package.json');

    expect(packageJson.devDependencies['aws-cdk']).not.toBe(packageJson.dependencies['aws-cdk-lib']);
  });
});
