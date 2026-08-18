import * as path from 'path';
import {
  addProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  readProjectConfiguration,
  runTasksInSerial,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { configurationGenerator } from '@nx/jest';

import { ApplicationSchema } from './schema';
import { initGenerator } from '../init/init';

interface NormalizedSchema extends ApplicationSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(host: Tree, options: ApplicationSchema): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory ? `${names(options.directory).fileName}/${name}` : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(host).appsDir}/${projectDirectory}`;
  const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    unitTestRunner: options.unitTestRunner ?? 'jest',
  };
}

function addFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.projectName),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };

  generateFiles(host, path.join(__dirname, 'files'), options.projectRoot, templateOptions);
}

function addJestFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.projectName),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(host, path.join(__dirname, 'jest-files'), options.projectRoot, templateOptions);
}

export async function applicationGenerator(host: Tree, options: ApplicationSchema) {
  const tasks: GeneratorCallback[] = [];
  const normalizedOptions = normalizeOptions(host, options);
  const initTask = await initGenerator(host, {
    ...options,
    skipFormat: true,
  });

  tasks.push(initTask);

  const project: ProjectConfiguration = {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      deploy: {
        executor: '@wolsok/nx-aws-cdk-v2:deploy',
        options: {},
      },
      synth: {
        executor: '@wolsok/nx-aws-cdk-v2:synth',
        options: {},
      },
      destroy: {
        executor: '@wolsok/nx-aws-cdk-v2:destroy',
        options: {},
      },
      bootstrap: {
        executor: '@wolsok/nx-aws-cdk-v2:bootstrap',
        options: {},
      },
    },
    tags: normalizedOptions.parsedTags,
  };
  addProjectConfiguration(host, normalizedOptions.projectName, project);
  const workspace = readProjectConfiguration(host, normalizedOptions.projectName);

  updateProjectConfiguration(host, normalizedOptions.projectName, workspace);
  addFiles(host, normalizedOptions);

  if (normalizedOptions.unitTestRunner === 'jest') {
    // `configurationGenerator` forwards its whole options object to `@nx/js`'s init
    // generator, where `skipFormat` only guards the formatFiles call - `ensurePackage`
    // for prettier still runs unless `formatter: 'none'` is set too. Since we already
    // skip formatting here, also skip ensuring prettier: requiring the real prettier
    // package from inside Jest's own module sandbox (i.e. when this generator runs in
    // a unit test) crashes with "dynamic import callback ... without --experimental-vm-modules".
    // `formatter` isn't part of JestProjectSchema's public type, so build the options
    // object separately to avoid TypeScript's excess-property check on the call site.
    const jestConfigOptions = {
      project: normalizedOptions.projectName,
      setupFile: 'none',
      skipSerializers: true,
      supportTsx: false,
      babelJest: false,
      testEnvironment: 'node',
      skipFormat: true,
      formatter: 'none',
    } as const;
    const jestTask = await configurationGenerator(host, jestConfigOptions);
    tasks.push(jestTask);
    addJestFiles(host, normalizedOptions);
  }

  if (!options.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(...tasks);
}

export default applicationGenerator;
export const applicationSchematic = convertNxGenerator(applicationGenerator);
