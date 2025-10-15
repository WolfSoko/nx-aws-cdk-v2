import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
  updateFile,
} from '@nx/plugin/testing';
import { logger } from '@nx/devkit';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

describe('aws-cdk-v2 e2e', () => {
  beforeAll(async () => {
    ensureNxProject('@wolsok/nx-aws-cdk-v2', path.join('dist/packages/aws-cdk-v2'));
  }, 120000);

  it('should create aws-cdk', async () => {
    const plugin = uniq('aws-cdk-v2');

    await runNxCommandAsync(`generate @wolsok/nx-aws-cdk-v2:application ${plugin}`);
  }, 120000);

  it('should generate when package.json uses type module', async () => {
    const plugin = uniq('aws-cdk-v2');

    updateFile('package.json', (content) => {
      const packageJson = JSON.parse(content);
      packageJson.type = 'module';
      return `${JSON.stringify(packageJson, null, 2)}\n`;
    });

    await runNxCommandAsync(`generate @wolsok/nx-aws-cdk-v2:application ${plugin}`);

    const { workspaceLayout } = readJson('nx.json');
    const appsDir = workspaceLayout?.appsDir ?? 'apps';

    expect(() => checkFilesExist(`${appsDir}/${plugin}/src/main.ts`)).not.toThrow();
  }, 120000);

  it('should run deploy target via nx using the cdk cli', async () => {
    const plugin = uniq('aws-cdk-v2');

    await runNxCommandAsync(`generate @wolsok/nx-aws-cdk-v2:application ${plugin}`);

    const workspaceRoot = process.env.NX_WORKSPACE_ROOT ?? process.cwd();
    const stubDir = path.join(workspaceRoot, 'tmp', `npx-stub-${plugin}`);
    const logFile = path.join(stubDir, 'invocation.log');
    const stubPath = path.join(stubDir, 'npx');

    mkdirSync(stubDir, { recursive: true });
    writeFileSync(
      stubPath,
      `#!/usr/bin/env bash\n` +
        `echo "$@" > "${logFile}"\n` +
        'exit 0\n'
    );
    chmodSync(stubPath, 0o755);

    const originalPath = process.env.PATH ?? '';
    process.env.PATH = `${stubDir}:${originalPath}`;

    try {
      await runNxCommandAsync(`run ${plugin}:deploy`);
    } finally {
      process.env.PATH = originalPath;
    }

    const invocation = readFileSync(logFile, 'utf-8');
    const { workspaceLayout } = readJson('nx.json');
    const appsDir = workspaceLayout?.appsDir ?? 'apps';

    expect(invocation).toContain('cdk');
    expect(invocation).toContain('deploy');
    expect(invocation).toContain(`${appsDir}/${plugin}/src/main.ts`);
  }, 120000);

  describe('--directory', () => {
    it('should create src in the specified directory', async () => {
      const plugin = uniq('aws-cdk-v2');

      await runNxCommandAsync(`generate @wolsok/nx-aws-cdk-v2:application ${plugin} --directory subdir`);
      expect(() => checkFilesExist(`subdir/${plugin}/src/main.ts`)).not.toThrow();
    }, 120000);
  });

  describe('--tags', () => {
    it('should add tags to the project', async () => {
      const plugin = uniq('aws-cdk-v2');

      await runNxCommandAsync(`generate @wolsok/nx-aws-cdk-v2:application ${plugin} --tags e2etag,e2ePackage`);
      const nxJson = readJson(`${plugin}/project.json`);
      expect(nxJson.tags).toEqual(['e2etag', 'e2ePackage']);
    }, 120000);
  });

  //TODO find a good way to test bootstrap command. Maybe with localstack
  xdescribe('bootstrap', () => {
    beforeEach(() => {
      jest.spyOn(logger, 'debug');
    });
    it('should try to bootstrap', async () => {
      const plugin = uniq('aws-cdk-v2');

      await runNxCommandAsync(`generate @wolsok/nx-aws-cdk-v2:application ${plugin} --tags e2etag,e2ePackage`);
      await runNxCommandAsync(`bootstrap ${plugin} --profile=test123`);
      expect(logger.debug).toHaveBeenLastCalledWith(
        `Executing command: node ${process.env.NX_WORKSPACE_ROOT}/node_modules/aws-cdk/bin/cdk.js bootstrap ${plugin} --profile=test123`
      );
    }, 120000);

    it('should try to bootstrap with aws environments', async () => {
      const plugin = uniq('aws-cdk-v2');

      await runNxCommandAsync(`generate @wolsok/nx-aws-cdk-v2:application ${plugin} --tags e2etag,e2ePackage`);
      await runNxCommandAsync(`bootstrap ${plugin} aws://123456789012/us-east-1`);
      expect(logger.debug).toHaveBeenLastCalledWith(
        `Executing command: node ${process.env.NX_WORKSPACE_ROOT}/node_modules/aws-cdk/bin/cdk.js bootstrap aws://123456789012/us-east-1`
      );
    }, 120000);
  });
});
