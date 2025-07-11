import { EventEmitter } from 'events';
import * as childProcess from 'child_process';

import { logger } from '@nx/devkit';

import { BootstrapExecutorSchema } from './schema';
import executor from './bootstrap';
import { generateCommandString, LARGE_BUFFER } from '../../utils/executor.util';
import { mockExecutorContext } from '../../utils/testing';

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
}

jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  exec: jest.fn(() => new MockChildProcess()),
}));

const options: BootstrapExecutorSchema = {};

const nodeCommandWithRelativePath = generateCommandString('bootstrap', 'apps/proj');

describe('aws-cdk-v2 Bootstrap Executor', () => {
  const context = mockExecutorContext('bootstrap');

  beforeEach(async () => {
    jest.spyOn(logger, 'debug');
  });

  afterEach(() => jest.clearAllMocks());

  it('run cdk bootstrap command', async () => {
    const execMock = (childProcess.exec as unknown) as jest.Mock;
    let mockProcess;
    execMock.mockImplementation(() => {
      mockProcess = new MockChildProcess();
      return mockProcess;
    });
    const promise = executor(options, context);
    mockProcess.emit('close', 0);
    await promise;
    expect(childProcess.exec).toHaveBeenCalledWith(
      nodeCommandWithRelativePath,
      expect.objectContaining({
        cwd: expect.stringContaining(context.root),
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    );
    expect(logger.debug).toHaveBeenLastCalledWith(`Executing command: ${nodeCommandWithRelativePath}`);
  });

  it('run cdk bootstrap command profile', async () => {
    const execMock = (childProcess.exec as unknown) as jest.Mock;
    let mockProcess;
    execMock.mockImplementation(() => {
      mockProcess = new MockChildProcess();
      return mockProcess;
    });
    const option: BootstrapExecutorSchema = Object.assign({}, options);
    const profile = 'prod';
    option['profile'] = profile;
    const promise = executor(option, context);
    mockProcess.emit('close', 0);
    await promise;
    expect(childProcess.exec).toHaveBeenCalledWith(
      `${nodeCommandWithRelativePath} --profile ${profile}`,
      expect.objectContaining({
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    );
    expect(logger.debug).toHaveBeenLastCalledWith(
      `Executing command: ${nodeCommandWithRelativePath} --profile ${profile}`
    );
  });
});
