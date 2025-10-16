import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
  updateFile,
} from '@nx/plugin/testing';
import { ProjectConfiguration, logger } from '@nx/devkit';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

describe('aws-cdk-v2 e2e', () => {
  beforeAll(async () => {
    ensureNxProject('@wolsok/nx-aws-cdk-v2', path.join('dist/packages/aws-cdk-v2'));
  }, 120000);

  async function readProjectConfigurationFromNx(projectName: string): Promise<ProjectConfiguration> {
    const result = await runNxCommandAsync(`show project ${projectName} --json`);
    return JSON.parse(result.stdout) as ProjectConfiguration;
  }

  it('should create aws-cdk', async () => {
    const plugin = uniq('aws-cdk-v2');

    await runNxCommandAsync(`generate @wolsok/nx-aws-cdk-v2:application ${plugin}`);
  }, 120000);

  it('should generate when package.json uses type module', async () => {
    const plugin = uniq('aws-cdk-v2');
    const originalPackageType = readJson('package.json').type;

    updateFile('package.json', (content) => {
      const packageJson = JSON.parse(content);
      packageJson.type = 'module';
      return `${JSON.stringify(packageJson, null, 2)}\n`;
    });

    try {
      await runNxCommandAsync(`generate @wolsok/nx-aws-cdk-v2:application ${plugin}`);

      const project = await readProjectConfigurationFromNx(plugin);
      const sourceRoot = project.sourceRoot ?? `${project.root}/src`;

      expect(() => checkFilesExist(`${sourceRoot}/main.ts`)).not.toThrow();
    } finally {
      updateFile('package.json', (content) => {
        const packageJson = JSON.parse(content);

        if (originalPackageType) {
          packageJson.type = originalPackageType;
        } else {
          delete packageJson.type;
        }

        return `${JSON.stringify(packageJson, null, 2)}\n`;
      });
    }
  }, 120000);

  it('should run deploy target via nx using the cdk cli', async () => {
    const plugin = uniq('aws-cdk-v2');

    await runNxCommandAsync(`generate @wolsok/nx-aws-cdk-v2:application ${plugin}`);
    const project = await readProjectConfigurationFromNx(plugin);
    expect(project.root).toBeDefined();

    const workspaceRoot = process.env.NX_WORKSPACE_ROOT ?? process.cwd();
    const logDir = path.join(workspaceRoot, 'tmp', `cdk-stub-${plugin}`);
    const logFile = path.join(logDir, 'invocation.log');
    const cdkBinary = path.join(workspaceRoot, 'tmp', 'nx-e2e', 'proj', 'node_modules', '.bin', 'cdk');
    const cdkBackup = `${cdkBinary}.real`;

    mkdirSync(logDir, { recursive: true });
    if (!existsSync(cdkBackup)) {
      renameSync(cdkBinary, cdkBackup);
    }
    writeFileSync(
      cdkBinary,
      `#!/usr/bin/env bash\n` +
        `printf 'cdk' >> "${logFile}"\n` +
        'for arg in "$@"; do\n' +
        `  printf ' %s' "$arg" >> "${logFile}"\n` +
        'done\n' +
        `printf '\n' >> "${logFile}"\n` +
        'exit 0\n'
    );
    chmodSync(cdkBinary, 0o755);

    try {
      await runNxCommandAsync(`run ${plugin}:deploy`);
    } finally {
      if (existsSync(cdkBinary)) {
        unlinkSync(cdkBinary);
      }
      if (existsSync(cdkBackup)) {
        renameSync(cdkBackup, cdkBinary);
      }
    }

    const invocations = readFileSync(logFile, 'utf-8')
      .split('\n')
      .filter((line) => line.length > 0);
    const cdkInvocation = invocations.find((line) => /\bcdk\b/.test(line));

    expect(cdkInvocation).toBeDefined();
    expect(cdkInvocation).toContain('deploy');
    expect(cdkInvocation).toContain(`${project.root}/src/main.ts`);
  }, 120000);

  it('should synthesize the stack via nx using the cdk cli', async () => {
    const plugin = uniq('aws-cdk-v2');

    await runNxCommandAsync(`generate @wolsok/nx-aws-cdk-v2:application ${plugin}`);
    const project = await readProjectConfigurationFromNx(plugin);

    const synthResult = await runNxCommandAsync(`run ${plugin}:synth`);

    expect(synthResult.stdout).toContain(plugin);
    expect(() => checkFilesExist(`cdk.out/${plugin}.template.json`)).not.toThrow();
    expect(() => checkFilesExist(`cdk.out/manifest.json`)).not.toThrow();

    const manifest = JSON.parse(readFileSync(path.join(process.cwd(), 'cdk.out', 'manifest.json'), 'utf-8'));
    const artifact = manifest?.artifacts?.[plugin];

    expect(artifact?.type).toBe('aws:cloudformation:stack');
    expect(artifact?.properties?.templateFile).toBe(`${plugin}.template.json`);
    expect(artifact?.environment).toBeDefined();
    expect(artifact?.environment).toContain('aws://');

    expect(() => checkFilesExist(`${project.root}/cdk.out/${plugin}.template.json`)).toThrow();
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
