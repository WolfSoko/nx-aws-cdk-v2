import { JestConfigWithTsJest } from 'ts-jest';

export default {
  displayName: 'aws-cdk-v2',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/packages/aws-cdk-v2',
} as JestConfigWithTsJest;
