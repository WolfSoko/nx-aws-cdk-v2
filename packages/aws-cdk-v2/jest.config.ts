import { JestConfigWithTsJest } from 'ts-jest';

export default {
  displayName: 'aws-cdk-v2',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/aws-cdk-v2',
} as JestConfigWithTsJest;
