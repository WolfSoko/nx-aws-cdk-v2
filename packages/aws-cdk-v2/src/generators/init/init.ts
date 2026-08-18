import { addDependenciesToPackageJson, convertNxGenerator, formatFiles, GeneratorCallback, Tree } from '@nx/devkit';
import { jestInitGenerator } from '@nx/jest';

import { InitGeneratorSchema } from './schema';
import {
  CDK_CLI_VERSION,
  CDK_CONSTRUCTS_VERSION,
  CDK_LIB_VERSION,
  TS_NODE_VERSION,
  TSCONFIG_PATHS_VERSION,
  TSX_VERSION,
} from '../../utils/cdk-shared';

function normalizeOptions(schema: InitGeneratorSchema) {
  return {
    ...schema,
    unitTestRunner: schema.unitTestRunner ?? 'jest',
  };
}

export async function initGenerator(host: Tree, options: InitGeneratorSchema) {
  let jestInstall: GeneratorCallback;
  const schema = normalizeOptions(options);

  if (schema.unitTestRunner === 'jest') {
    jestInstall = await jestInitGenerator(host, {});
  }

  const installTask = addDependenciesToPackageJson(
    host,
    {
      'aws-cdk-lib': CDK_LIB_VERSION,
      constructs: CDK_CONSTRUCTS_VERSION,
    },
    {
      // The CDK Toolkit and the TypeScript loaders are only ever invoked by the
      // executors, so they belong in devDependencies rather than shipping with
      // whatever the workspace publishes.
      'aws-cdk': CDK_CLI_VERSION,
      'ts-node': TS_NODE_VERSION,
      'tsconfig-paths': TSCONFIG_PATHS_VERSION,
      tsx: TSX_VERSION,
    }
  );

  if (!schema.skipFormat) {
    await formatFiles(host);
  }

  return async () => {
    if (jestInstall) {
      await jestInstall();
    }
    await installTask();
  };
}

export default initGenerator;
export const initSchematic = convertNxGenerator(initGenerator);
