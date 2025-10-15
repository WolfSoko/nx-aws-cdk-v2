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
    const jestTask = await configurationGenerator(host, {
      project: normalizedOptions.projectName,
      setupFile: 'none',
      skipSerializers: true,
      supportTsx: false,
      babelJest: false,
      testEnvironment: 'node',
      skipFormat: true,
    });
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
