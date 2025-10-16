import { EventEmitter } from 'events';
import * as childProcess from 'child_process';
import { logger } from '@nx/devkit';

import executor from './synth';
import { SynthExecutorSchema } from './schema';
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

const options: SynthExecutorSchema = {};

const nodeCommandWithRelativePath = generateCommandString('synth', 'apps/proj');

describe('aws-cdk-v2 synth Executor', () => {
  const context = mockExecutorContext('synth');

  beforeEach(async () => {
    jest.spyOn(logger, 'debug');
  });

  afterEach(() => jest.clearAllMocks());

  it('run cdk synth command', async () => {
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

  it('run cdk synth command stack', async () => {
    const execMock = (childProcess.exec as unknown) as jest.Mock;
    let mockProcess;
    execMock.mockImplementation(() => {
      mockProcess = new MockChildProcess();
      return mockProcess;
    });
    const option: SynthExecutorSchema = Object.assign({}, options);
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

  it('run cdk synth command context options', async () => {
    const execMock = (childProcess.exec as unknown) as jest.Mock;
    let mockProcess;
    execMock.mockImplementation(() => {
      mockProcess = new MockChildProcess();
      return mockProcess;
    });
    const option: SynthExecutorSchema = Object.assign({}, options);
    const contextOptionString = 'key=value';
    option['context'] = contextOptionString;
    const promise = executor(option, context);
    mockProcess.emit('close', 0);
    await promise;
    expect(childProcess.exec).toHaveBeenCalledWith(
      `${nodeCommandWithRelativePath} --context ${contextOptionString}`,
      expect.objectContaining({
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    );

    expect(logger.debug).toHaveBeenLastCalledWith(
      `Executing command: ${nodeCommandWithRelativePath} --context ${contextOptionString}`
    );
  });

  it('run cdk synth command with multiple context options', async () => {
    const execMock = (childProcess.exec as unknown) as jest.Mock;
    let mockProcess;
    execMock.mockImplementation(() => {
      mockProcess = new MockChildProcess();
      return mockProcess;
    });
    const option: SynthExecutorSchema = Object.assign({}, options);
    const contextOptions = ['firstKey=firstValue', 'secondKey=secondValue'];
    option['context'] = contextOptions;
    const promise = executor(option, context);
    mockProcess.emit('close', 0);
    await promise;
    const contextCmd = contextOptions.map((option) => `--context ${option}`).join(' ');
    expect(childProcess.exec).toHaveBeenCalledWith(
      `${nodeCommandWithRelativePath} ${contextCmd}`,
      expect.objectContaining({
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    );

    expect(logger.debug).toHaveBeenLastCalledWith(`Executing command: ${nodeCommandWithRelativePath} ${contextCmd}`);
  });

  it('run cdk synth command with boolean context option', async () => {
    const execMock = (childProcess.exec as unknown) as jest.Mock;
    let mockProcess;
    execMock.mockImplementation(() => {
      mockProcess = new MockChildProcess();
      return mockProcess;
    });
    const option: SynthExecutorSchema = Object.assign({}, options);
    option['exclusively'] = true;
    const promise = executor(option, context);
    mockProcess.emit('close', 0);
    await promise;
    expect(childProcess.exec).toHaveBeenCalledWith(
      `${nodeCommandWithRelativePath} --exclusively true`,
      expect.objectContaining({
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    );

    expect(logger.debug).toHaveBeenLastCalledWith(`Executing command: ${nodeCommandWithRelativePath} --exclusively true`);
  });
});
