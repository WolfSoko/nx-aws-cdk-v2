import { ExecutorContext } from '@nx/devkit';

export function mockExecutorContext(executorName: string, workspaceVersion = 2): ExecutorContext {
  return {
    projectName: 'proj',
    root: '/root',
    cwd: '/root',
    nxJsonConfiguration: {},
    projectsConfigurations: {
      version: workspaceVersion,
      projects: {
        proj: {
          root: 'apps/proj',
          targets: {
            test: {
              executor: `@wolsok/nx-aws-cdk-v2:${executorName}`,
            },
          },
        },
      },
    },
    projectGraph: { nodes: {}, dependencies: {} },
    target: {
      executor: `@wolsok/nx-aws-cdk-v2:${executorName}`,
    },
    isVerbose: true,
  };
}
