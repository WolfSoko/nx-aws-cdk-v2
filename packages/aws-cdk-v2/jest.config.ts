import { JestConfigWithTsJest } from 'ts-jest';

export default {
  displayName: { name: 'aws-cdk-v2', color: 'blue' },
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/packages/aws-cdk-v2',
} as JestConfigWithTsJest;
