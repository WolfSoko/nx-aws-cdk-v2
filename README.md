[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![@wolsok/nx-aws-cdk-v2](https://img.shields.io/badge/%40adrian--goe-nx--aws--cdk-green)](https://github.com/WolfSoko/nx-aws-cdk-v2/tree/main/packages/aws-cdk-v2)
[![Typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://www.typescriptlang.org/)
[![LICENSE](https://img.shields.io/npm/l/@wolsok/nx-aws-cdk-v2.svg)](https://www.npmjs.com/package/@wolsok/nx-aws-cdk-v2)
[![npm version](https://img.shields.io/npm/v/@wolsok/nx-aws-cdk-v2.svg)](https://www.npmjs.com/package/@wolsok/nx-aws-cdk-v2)
[![Downloads](https://img.shields.io/npm/dm/@wolsok/nx-aws-cdk-v2.svg)](https://www.npmjs.com/package/@wolsok/nx-aws-cdk-v2)

<hr>

# Nx AWS CDK v2 Plugin

A comprehensive Nx plugin for developing, deploying, and managing AWS CDK v2 applications within an Nx workspace. This plugin seamlessly integrates the AWS Cloud Development Kit (CDK) v2 with Nx's powerful monorepo capabilities, enabling efficient cloud infrastructure development.

## Table of Contents

- [Nx AWS CDK v2 Plugin](#nx-aws-cdk-v2-plugin)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Generate a New AWS CDK Application](#generate-a-new-aws-cdk-application)
    - [Available Executors](#available-executors)
    - [Examples](#examples)
  - [Plugin](#plugin)
  - [Benefits of Using This Plugin](#benefits-of-using-this-plugin)
  - [Maintainers](#maintainers)
  - [Contributing](#contributing)
  - [License](#license)
  - [Special Thanks](#special-thanks)

## Features

- **AWS CDK v2 Integration**: Full support for AWS CDK v2 within Nx workspaces
- **Application Generator**: Quickly scaffold new AWS CDK applications with proper structure
- **Multiple Executors**: Deploy, destroy, and bootstrap AWS CDK applications with ease
- **Nx Workspace Benefits**: Leverage Nx's caching, dependency graph, and affected commands
- **TypeScript Support**: Fully typed interfaces for better developer experience

## Installation

```bash
# Using npm
npm install --save-dev @wolsok/nx-aws-cdk-v2

# Using yarn
yarn add --dev @wolsok/nx-aws-cdk-v2

# Using pnpm
pnpm add --save-dev @wolsok/nx-aws-cdk-v2
```

## Usage

### Generate a New AWS CDK Application

```bash
nx generate @wolsok/nx-aws-cdk-v2:application myApp
```

You can customize the generation with various options:

```bash
nx generate @wolsok/nx-aws-cdk-v2:application [name] [options,...]

Options:
  --name                      The name of the application
  --tags                      Add tags to the project (used for linting)
  --directory                 A directory where the project is placed
  --skipFormat                Skip formatting files
  --unitTestRunner            Adds the specified unit test runner (default: jest)
  --setParserOptionsProject   Whether or not to configure the ESLint "parserOptions.project" option
  --dryRun                    Runs through and reports activity without writing to disk
  --skip-nx-cache             Skip the use of Nx cache
```

### Available Executors

The plugin provides several executors to manage your AWS CDK applications:

- **deploy**: Deploy your CDK application to AWS
- **destroy**: Remove your CDK application from AWS
- **bootstrap**: Bootstrap AWS environments for CDK deployment

### Examples

**Deploy an application:**
```bash
nx deploy myApp
```

**Destroy an application:**
```bash
nx destroy myApp
```

**Bootstrap an AWS environment:**
```bash
# Using a profile
nx bootstrap myApp --profile=myProfile

# Using an AWS environment
nx bootstrap myApp aws://123456789012/us-east-1
```

## Plugin

| Plugin                                                     | Description                                                                                   |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`@wolsok/nx-aws-cdk-v2`](./packages/aws-cdk-v2/README.md) | An Nx plugin for developing [aws-cdk](https://docs.aws.amazon.com/cdk/latest/guide/home.html) |

## Benefits of Using This Plugin

- **Monorepo Management**: Manage multiple CDK applications in a single repository
- **Dependency Management**: Automatically track and manage dependencies between applications
- **Efficient Builds**: Leverage Nx's powerful caching for faster builds
- **Consistent Structure**: Standardized project structure for all CDK applications
- **Developer Experience**: Improved developer experience with TypeScript support and Nx integration

## Maintainers

[@WolfSoko](https://github.com/WolfSoko)

## Contributing

See [the contributing file](CONTRIBUTING.md)!

PRs accepted.

If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

This project is MIT licensed 2022 Wolfram Sokollek

## Special Thanks

This Project is based on [@adrian-goe](https://github.com/adrian-goe)'s
[nx-plugins](https://github.com/adrian-goe/nx-aws-cdk-v2).
