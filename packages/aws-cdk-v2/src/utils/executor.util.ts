import { exec } from 'child_process';

import { DeployExecutorSchema } from '../executors/deploy/schema';
import { ParsedExecutorInterface } from '../interfaces/parsed-executor.interface';
import { logger, detectPackageManager, readJsonFile, workspaceRoot } from '@nx/devkit';
import { BootstrapExecutorSchema } from '../executors/bootstrap/schema';
import { SynthExecutorSchema } from '../executors/synth/schema';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

function getPackageJson(packageJsonPath: string): { type?: string } {
  return existsSync(packageJsonPath) ? readJsonFile(packageJsonPath) : {};
}

export const executorPropKeys = ['stacks'];
export const LARGE_BUFFER = 1024 * 1000000;

/**
 * Root of the Nx workspace the executor runs in. Nx sets `NX_WORKSPACE_ROOT`
 * for every task it spawns; the devkit's `workspaceRoot` is the fallback for
 * the cases where it doesn't (e.g. when an executor is invoked programmatically).
 * Resolved lazily so importing this module never throws.
 */
function getWorkspaceRoot(): string {
  return process.env.NX_WORKSPACE_ROOT || workspaceRoot;
}

export function generateCommandString(command: string, appPath: string) {
  const packageManager = detectPackageManager();
  const packageManagerExecutor = packageManager === 'npm' ? 'npx' : packageManager;

  const projectPath = path.join(getWorkspaceRoot(), appPath);
  const moduleType = getModuleType(projectPath);
  const compileTsPart =
    moduleType === 'module'
      ? 'tsx'
      : `ts-node --require tsconfig-paths/register --project ${path.join(projectPath, 'tsconfig.app.json')}`;
  // Determine the path to the app's entrypoint
  const mainTsPath = path.join(projectPath, 'src', 'main.ts');
  const generatePath = `${packageManagerExecutor} ${compileTsPart} ${mainTsPath}`;
  return `${packageManagerExecutor} cdk -a "${generatePath}" ${command}`;
}

export function parseArgs(
  options: DeployExecutorSchema | BootstrapExecutorSchema | SynthExecutorSchema
): Record<string, string | string[]> {
  const keys = Object.keys(options);
  return keys
    .filter((prop) => executorPropKeys.indexOf(prop) < 0)
    .reduce(
      (acc, key) => {
        acc[key] = options[key];
        return acc;
      },
      {} as Record<string, string | string[]>
    );
}

export function createCommand(command: string, options: ParsedExecutorInterface): string {
  logger.debug(`Normalized executor options: ${JSON.stringify(options)}`);

  const nodeCommandWithRelativePath = generateCommandString(command, options.root);
  const commands = [nodeCommandWithRelativePath];

  if (typeof options.stacks === 'string') {
    commands.push(options.stacks);
  }

  // If there are additional parsed arguments, append them appropriately
  if (options.parseArgs) {
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
  // `projectPath` is already absolute; joining it onto the workspace root again
  // produced a path that never existed, so an app-level `"type"` was ignored.
  const packageJsonPath = path.join(projectPath, 'package.json');
  const appPackageJson = getPackageJson(packageJsonPath);
  if (appPackageJson?.type) {
    logger.debug(`Module type from ${packageJsonPath}: ${appPackageJson.type}`);
    return appPackageJson.type;
  }
  const globalPackageJson = getPackageJson(path.join(getWorkspaceRoot(), 'package.json'));
  logger.debug(`Module type from workspace package.json: ${globalPackageJson.type ?? 'commonjs'}`);
  return globalPackageJson.type;
}
