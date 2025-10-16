import { ExecutorContext } from '@nx/devkit';

import { ParsedExecutorInterface } from '../../interfaces/parsed-executor.interface';
import { createCommand, parseArgs, runCommandProcess } from '../../utils/executor.util';
import { SynthExecutorSchema } from './schema';

export interface ParsedSynthExecutorOption extends ParsedExecutorInterface {
  stacks?: string[];
  sourceRoot: string;
  root: string;
}

export default async function runExecutor(options: SynthExecutorSchema, context: ExecutorContext) {
  const normalizedOptions = normalizeOptions(options, context);
  const result = await runSynth(normalizedOptions, context);

  return {
    success: result,
  };
}

function runSynth(options: ParsedSynthExecutorOption, context: ExecutorContext) {
  const command = createCommand('synth', options);
  return runCommandProcess(command, context.root);
}

function normalizeOptions(options: SynthExecutorSchema, context: ExecutorContext): ParsedSynthExecutorOption {
  const parsedArgs = parseArgs(options);
  let stacks;

  if (Object.prototype.hasOwnProperty.call(options, 'stacks')) {
    stacks = options.stacks;
  }

  const { sourceRoot, root } = context?.projectsConfigurations?.projects[context.projectName] ?? {};

  return {
    ...options,
    parseArgs: parsedArgs,
    stacks,
    sourceRoot,
    root,
  };
}
