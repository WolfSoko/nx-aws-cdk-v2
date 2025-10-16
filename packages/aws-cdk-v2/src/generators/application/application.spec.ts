import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import generator from './application';
import { ApplicationSchema } from './schema';

describe('aws-cdk generator', () => {
  let appTree: Tree;
  const options: ApplicationSchema = { name: 'test' };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });

  it('should register executors on generated project', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');

    expect(config.targets?.deploy?.executor).toBe('@wolsok/nx-aws-cdk-v2:deploy');
    expect(config.targets?.synth?.executor).toBe('@wolsok/nx-aws-cdk-v2:synth');
    expect(config.targets?.destroy?.executor).toBe('@wolsok/nx-aws-cdk-v2:destroy');
    expect(config.targets?.bootstrap?.executor).toBe('@wolsok/nx-aws-cdk-v2:bootstrap');
  });

  it('directory option', async () => {
    const directory = 'sub';
    const directoryOptions = Object.assign({}, options);
    directoryOptions.directory = directory;

    await generator(appTree, directoryOptions);
    const config = readProjectConfiguration(appTree, 'sub-test');
    expect(config).toBeDefined();
  });
});
