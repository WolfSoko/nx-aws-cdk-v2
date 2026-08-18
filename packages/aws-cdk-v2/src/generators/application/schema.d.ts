export interface ApplicationSchema {
  /** The name of the application. */
  name: string;
  /** Comma separated list of tags to add to the project. */
  tags?: string;
  /** Directory the project is placed in, relative to the workspace's apps directory. */
  directory?: string;
  /** Skip formatting the generated files with Prettier. */
  skipFormat?: boolean;
  /** Unit test runner to configure for the generated application. */
  unitTestRunner?: 'jest' | 'none';
  /** Whether to configure the ESLint `parserOptions.project` option. */
  setParserOptionsProject?: boolean;
}
