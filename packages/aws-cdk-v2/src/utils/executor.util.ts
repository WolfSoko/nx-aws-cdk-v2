import { exec } from 'child_process';

import { DeployExecutorSchema } from '../executors/deploy/schema';
import { ParsedExecutorInterface } from '../interfaces/parsed-executor.interface';
import { logger, detectPackageManager } from '@nx/devkit';
import { BootstrapExecutorSchema } from '../executors/bootstrap/schema';
import { getPackageJson } from '@nx/eslint-plugin/src/utils/package-json-utils';
import * as path from 'node:path';

export const executorPropKeys = ['stacks'];
export const LARGE_BUFFER = 1024 * 1000000;

const NX_WORKSPACE_ROOT = process.env.NX_WORKSPACE_ROOT ?? '';
if (!NX_WORKSPACE_ROOT) {
  throw new Error('CDK not Found');
}

export function generateCommandString(command: string, appPath: string) {
  const packageManager = detectPackageManager();
  const packageManagerExecutor = packageManager === 'npm' ? 'npx' : packageManager;

  const projectPath = path.join(NX_WORKSPACE_ROOT, appPath);
  const moduleType = getModuleType(projectPath);
  const tsNodePart = moduleType === 'module' ? '--loader ts-node/esm' : 'ts-node';

  const mainTsPath = path.join(projectPath, 'src', 'main.ts');
  const generatePath = `${packageManagerExecutor} ${tsNodePart} --require tsconfig-paths/register --project ${path.join(projectPath, 'tsconfig.app.json')} ${mainTsPath}`;
  // Entferne doppelte ts-node-Initialisierung
  return `${path.join(NX_WORKSPACE_ROOT, 'node_modules', 'aws-cdk', 'bin', 'cdk')} -a "${generatePath}" ${command}`;
}

export function parseArgs(options: DeployExecutorSchema | BootstrapExecutorSchema): Record<string, string | string[]> {
  const keys = Object.keys(options);
  return keys
    .filter((prop) => executorPropKeys.indexOf(prop) < 0)
    .reduce((acc, key) => {
      acc[key] = options[key];
      return acc;
    }, {});
}

export function createCommand(command: string, options: ParsedExecutorInterface): string {
  console.log('OptionsParsedExecutorInterface', JSON.stringify(options));

  const nodeCommandWithRelativePath = generateCommandString(command, options.root);
  console.log('nodeCommandWithRelativePath', nodeCommandWithRelativePath);
  const commands = [nodeCommandWithRelativePath];

  if (typeof options.stacks === 'string') {
    commands.push(options.stacks);
  }

  for (const arg in options.parseArgs) {
    const parsedArg = options.parseArgs[arg];
    if (Array.isArray(parsedArg)) {
      parsedArg.forEach((value) => {
        commands.push(`--${arg} ${value}`);
      });
    } else {
      commands.push(`--${arg} ${parsedArg}`);
    }
  }

  return commands.join(' ');
}

export function runCommandProcess(command: string, cwd: string): Promise<boolean> {
  return new Promise((resolve) => {
    logger.debug(`Executing command: ${command}`);

    const childProcess = exec(command, {
      maxBuffer: LARGE_BUFFER,
      env: process.env,
      cwd: cwd,
    });

    // Ensure the child process is killed when the parent exits
    const processExitListener = () => childProcess.kill();
    process.on('exit', processExitListener);
    process.on('SIGTERM', processExitListener);

    process.stdin.on('data', (data) => {
      childProcess.stdin.write(data);
      childProcess.stdin.end();
    });

    childProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    childProcess.stderr.on('data', (err) => {
      process.stderr.write(err);
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        resolve(false);
      }

      process.removeListener('exit', processExitListener);

      if (process.stdin.isTTY) {
        process.stdin.end();
      }
      process.stdin.removeListener('data', processExitListener);
    });
  });
}

function getModuleType(projectPath: string) {
  const packageJsonPath = path.join(NX_WORKSPACE_ROOT, projectPath, 'package.json');
  const appPackageJson = getPackageJson(packageJsonPath);
  if (appPackageJson?.type) {
    console.log('App Package Json', appPackageJson.type);
    return appPackageJson.type;
  }
  const globalPackageJson = getPackageJson(path.join(NX_WORKSPACE_ROOT, 'package.json'));
  console.log('Global Package Json', globalPackageJson.type);
  return globalPackageJson.type;
}
