import { EventEmitter } from 'events';
import * as childProcess from 'child_process';

import { logger } from '@nx/devkit';

import { DestroyExecutorSchema } from './schema';
import executor from './destroy';
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

const options: DestroyExecutorSchema = {};

const nodeCommandWithRelativePath = generateCommandString('destroy', 'apps/proj');

describe('aws-cdk-v2 Destroy Executor', () => {
  const context = mockExecutorContext('destroy');

  beforeEach(async () => {
    jest.spyOn(logger, 'debug');
  });

  afterEach(() => jest.clearAllMocks());

  it('run cdk destroy command', async () => {
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
        cwd: context.root,
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    );
    expect(logger.debug).toHaveBeenLastCalledWith(`Executing command: ${nodeCommandWithRelativePath}`);
  });

  it('run cdk destroy command stack', async () => {
    const execMock = (childProcess.exec as unknown) as jest.Mock;
    let mockProcess;
    execMock.mockImplementation(() => {
      mockProcess = new MockChildProcess();
      return mockProcess;
    });
    const option: DestroyExecutorSchema = Object.assign({}, options);
    const stackName = 'test';
    option['stacks'] = stackName;
    const promise = executor(option, context);
    mockProcess.emit('close', 0);
    await promise;
    expect(childProcess.exec).toHaveBeenCalledWith(
      `${nodeCommandWithRelativePath} ${stackName}`,
      expect.objectContaining({
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    );
    expect(logger.debug).toHaveBeenLastCalledWith(`Executing command: ${nodeCommandWithRelativePath} ${stackName}`);
  });
});
