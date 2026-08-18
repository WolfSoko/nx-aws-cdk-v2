export interface BootstrapExecutorSchema {
  /** AWS profile to bootstrap with. */
  profile?: string;
  /** Additional CDK context values as `KEY=VALUE` pairs. */
  context?: string | string[];
}
