export interface SynthExecutorSchema {
  /** Stacks to synthesize. Defaults to every stack in the app. */
  stacks?: string;
  /** AWS profile to use. */
  profile?: string;
  /** Additional CDK context values as `KEY=VALUE` pairs. */
  context?: string | string[];
}
