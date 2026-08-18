export interface InitGeneratorSchema {
  /** Unit test runner to initialise for the workspace. */
  unitTestRunner?: 'jest' | 'none';
  /** Skip formatting the touched files with Prettier. */
  skipFormat?: boolean;
}
