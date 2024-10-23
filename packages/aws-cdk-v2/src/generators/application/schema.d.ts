export interface ApplicationSchema {
  name: string;
  tags?: string;
  directory?: string;
  skipFormat?: boolean;
  unitTestRunner?: 'jest' | 'none';
  setParserOptionsProject?: boolean;
}
