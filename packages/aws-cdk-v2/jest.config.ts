import type { JestConfigWithTsJest } from 'ts-jest';

module.exports = {
  displayName: { name: 'aws-cdk-v2', color: 'blue' },
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/packages/aws-cdk-v2',
} as JestConfigWithTsJest;
