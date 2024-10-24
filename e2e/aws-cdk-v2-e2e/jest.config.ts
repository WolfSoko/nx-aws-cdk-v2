import type { JestConfigWithTsJest } from 'ts-jest';

export default {
  displayName: { name: 'aws-cdk-v2-e2e', color: 'green' },
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/e2e/aws-cdk-v2-e2e',
} as JestConfigWithTsJest;
