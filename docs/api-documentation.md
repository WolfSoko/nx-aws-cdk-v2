# API Documentation for nx-aws-cdk-v2

This document provides detailed API documentation for all executors and generators in the nx-aws-cdk-v2 plugin.

## Table of Contents

- [Executors](#executors)
  - [Deploy Executor](#deploy-executor)
  - [Destroy Executor](#destroy-executor)
  - [Bootstrap Executor](#bootstrap-executor)
- [Generators](#generators)
  - [Application Generator](#application-generator)
  - [Init Generator](#init-generator)

## Executors

Executors are responsible for performing specific tasks on AWS CDK applications, such as deploying, destroying, or bootstrapping.

### Deploy Executor

The Deploy executor is used to deploy AWS CDK applications to AWS.

**Usage:**
```bash
nx deploy <project-name> [options]
```

**Options:**

| Option | Type | Description |
| ------ | ---- | ----------- |
| `stacks` | string | Specifies which stacks to deploy. If not provided, all stacks in the application will be deployed. |

**Example:**
```bash
# Deploy all stacks in the application
nx deploy my-cdk-app

# Deploy specific stacks
nx deploy my-cdk-app --stacks="MyStack1,MyStack2"
```

**Implementation Details:**

The Deploy executor creates a CDK deploy command with the specified options and runs it in the project's directory. It normalizes the options, creates the command, and executes it using the AWS CDK CLI.

### Destroy Executor

The Destroy executor is used to remove AWS CDK applications from AWS.

**Usage:**
```bash
nx destroy <project-name> [options]
```

**Options:**

| Option | Type | Description |
| ------ | ---- | ----------- |
| `stacks` | string | Specifies which stacks to destroy. If not provided, all stacks in the application will be destroyed. |

**Example:**
```bash
# Destroy all stacks in the application
nx destroy my-cdk-app

# Destroy specific stacks
nx destroy my-cdk-app --stacks="MyStack1,MyStack2"
```

**Implementation Details:**

The Destroy executor creates a CDK destroy command with the specified options and runs it in the project's directory. It normalizes the options, creates the command, and executes it using the AWS CDK CLI.

### Bootstrap Executor

The Bootstrap executor is used to bootstrap AWS environments for CDK deployment.

**Usage:**
```bash
nx bootstrap <project-name> [environment] [options]
```

**Options:**

| Option | Type | Description |
| ------ | ---- | ----------- |
| `profile` | string | The AWS profile to use for bootstrapping. |

**Example:**
```bash
# Bootstrap using the default profile
nx bootstrap my-cdk-app

# Bootstrap using a specific profile
nx bootstrap my-cdk-app --profile=my-profile

# Bootstrap a specific environment
nx bootstrap my-cdk-app aws://123456789012/us-east-1
```

**Implementation Details:**

The Bootstrap executor creates a CDK bootstrap command with the specified options and runs it in the project's directory. It normalizes the options, creates the command, and executes it using the AWS CDK CLI.

## Generators

Generators are used to create and initialize projects and components.

### Application Generator

The Application generator is used to create a new AWS CDK application within an Nx workspace.

**Usage:**
```bash
nx generate @wolsok/nx-aws-cdk-v2:application <name> [options]
```

**Options:**

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `name` | string | | The name of the application (required) |
| `tags` | string | | Add tags to the project (used for linting) |
| `directory` | string | | A directory where the project is placed |
| `skipFormat` | boolean | false | Skip formatting files |
| `unitTestRunner` | string | "jest" | Adds the specified unit test runner (jest or none) |
| `setParserOptionsProject` | boolean | false | Whether or not to configure the ESLint "parserOptions.project" option |

**Example:**
```bash
# Generate a new CDK application
nx generate @wolsok/nx-aws-cdk-v2:application my-cdk-app

# Generate a new CDK application in a specific directory with tags
nx generate @wolsok/nx-aws-cdk-v2:application my-cdk-app --directory=apps/aws --tags=aws,cdk

# Generate a new CDK application without Jest
nx generate @wolsok/nx-aws-cdk-v2:application my-cdk-app --unitTestRunner=none
```

**Implementation Details:**

The Application generator creates a new AWS CDK application with the specified options. It:
1. Normalizes the options
2. Runs the Init generator to set up the necessary dependencies
3. Creates the project configuration with deploy, destroy, and bootstrap targets
4. Adds the application files from templates
5. Optionally sets up Jest for testing
6. Formats the files (unless skipFormat is true)

### Init Generator

The Init generator is used to initialize an Nx workspace with AWS CDK dependencies. It is typically used by the Application generator and not directly by users.

**Usage:**
```bash
nx generate @wolsok/nx-aws-cdk-v2:init [options]
```

**Options:**

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `unitTestRunner` | string | "jest" | Adds the specified unit test runner (jest or none) |
| `skipFormat` | boolean | false | Skip formatting files |

**Example:**
```bash
# Initialize the workspace with AWS CDK dependencies
nx generate @wolsok/nx-aws-cdk-v2:init

# Initialize without Jest
nx generate @wolsok/nx-aws-cdk-v2:init --unitTestRunner=none
```

**Implementation Details:**

The Init generator initializes an Nx workspace with AWS CDK dependencies. It:
1. Normalizes the options
2. Optionally sets up Jest for testing
3. Adds the necessary AWS CDK dependencies to package.json
4. Formats the files (unless skipFormat is true)
