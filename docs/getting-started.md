# Getting Started with nx-aws-cdk-v2

This guide provides step-by-step instructions for getting started with the nx-aws-cdk-v2 plugin. It covers installation, creating a new AWS CDK application, and deploying it to AWS.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Creating a New AWS CDK Application](#creating-a-new-aws-cdk-application)
- [Understanding the Generated Application](#understanding-the-generated-application)
- [Developing Your CDK Application](#developing-your-cdk-application)
- [Deploying Your CDK Application](#deploying-your-cdk-application)
- [Destroying Your CDK Application](#destroying-your-cdk-application)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (v14 or later) and **npm** (v6 or later)
2. **Nx CLI** (v15 or later)
3. **AWS CLI** configured with appropriate credentials
4. **AWS CDK CLI** (v2 or later)

You should also have an AWS account and have configured the AWS CLI with your credentials.

```bash
# Install the AWS CDK CLI globally
npm install -g aws-cdk

# Verify the installation
cdk --version

# Configure AWS CLI
aws configure
```

## Installation

### Creating a New Nx Workspace

If you don't have an existing Nx workspace, you can create one using the following command:

```bash
# Create a new Nx workspace
npx create-nx-workspace@latest my-aws-workspace --preset=empty

# Navigate to the workspace
cd my-aws-workspace
```

### Adding the nx-aws-cdk-v2 Plugin

Add the nx-aws-cdk-v2 plugin to your Nx workspace:

```bash
# Using npm
npm install --save-dev @wolsok/nx-aws-cdk-v2

# Using yarn
yarn add --dev @wolsok/nx-aws-cdk-v2

# Using pnpm
pnpm add --save-dev @wolsok/nx-aws-cdk-v2
```

## Creating a New AWS CDK Application

Once you have installed the plugin, you can create a new AWS CDK application using the following command:

```bash
nx generate @wolsok/nx-aws-cdk-v2:application my-cdk-app
```

This will create a new AWS CDK application in the `apps/my-cdk-app` directory with the following structure:

```
apps/my-cdk-app/
├── cdk.json
├── jest.config.ts
├── project.json
├── src/
│   ├── main.ts
│   ├── stacks/
│   │   └── my-cdk-app-stack.ts
│   └── test/
│       └── my-cdk-app.spec.ts
└── tsconfig.json
```

## Understanding the Generated Application

Let's take a look at the key files in the generated application:

### cdk.json

The `cdk.json` file tells the CDK Toolkit how to execute your app. It includes the entry point and other configuration options.

```json
{
  "app": "ts-node --prefer-ts-exts src/main.ts",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": "true",
    "aws-cdk:enableDiffNoFail": "true",
    "@aws-cdk/core:stackRelativeExports": "true"
  }
}
```

### main.ts

The `main.ts` file is the entry point of your CDK application. It creates an instance of the CDK app and adds your stacks to it.

```typescript
import { App } from 'aws-cdk-lib';
import { MyCdkAppStack } from './stacks/my-cdk-app-stack';

const app = new App();
new MyCdkAppStack(app, 'MyCdkAppStack');
```

### my-cdk-app-stack.ts

The `my-cdk-app-stack.ts` file defines your CDK stack. This is where you'll define your AWS resources.

```typescript
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Define your AWS resources here
    // For example:
    // const bucket = new s3.Bucket(this, 'MyBucket');
  }
}
```

## Developing Your CDK Application

Now that you have created a new AWS CDK application, you can start developing it by adding AWS resources to your stack.

### Adding AWS Resources

Let's modify the `my-cdk-app-stack.ts` file to add an S3 bucket:

```typescript
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class MyCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create an S3 bucket
    const bucket = new s3.Bucket(this, 'MyBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }
}
```

### Installing AWS CDK Libraries

You may need to install additional AWS CDK libraries depending on the AWS services you want to use:

```bash
# Install the S3 library
npm install aws-cdk-lib/aws-s3
```

### Testing Your CDK Application

You can test your CDK application using the Jest test runner:

```bash
nx test my-cdk-app
```

## Deploying Your CDK Application

Before you can deploy your CDK application, you need to bootstrap your AWS environment. This is a one-time setup that creates the necessary resources for CDK to deploy your stacks.

### Bootstrapping Your AWS Environment

```bash
nx bootstrap my-cdk-app
```

If you want to bootstrap a specific AWS environment or use a specific AWS profile, you can use the following commands:

```bash
# Bootstrap a specific environment
nx bootstrap my-cdk-app aws://123456789012/us-east-1

# Bootstrap using a specific profile
nx bootstrap my-cdk-app --profile=my-profile
```

### Deploying Your Stack

Once you have bootstrapped your AWS environment, you can deploy your CDK application:

```bash
nx deploy my-cdk-app
```

If you want to deploy specific stacks, you can use the `--stacks` option:

```bash
nx deploy my-cdk-app --stacks="MyCdkAppStack"
```

## Destroying Your CDK Application

When you're done with your CDK application, you can destroy it to avoid incurring AWS charges:

```bash
nx destroy my-cdk-app
```

If you want to destroy specific stacks, you can use the `--stacks` option:

```bash
nx destroy my-cdk-app --stacks="MyCdkAppStack"
```

## Advanced Usage

### Working with Multiple Stacks

You can define multiple stacks in your CDK application by creating additional stack classes and instantiating them in your `main.ts` file:

```typescript
import { App } from 'aws-cdk-lib';
import { MyCdkAppStack } from './stacks/my-cdk-app-stack';
import { MySecondStack } from './stacks/my-second-stack';

const app = new App();
new MyCdkAppStack(app, 'MyCdkAppStack');
new MySecondStack(app, 'MySecondStack');
```

### Using Environment Variables

You can use environment variables to configure your CDK application:

```typescript
import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Use environment variables
    const stageName = process.env.STAGE_NAME || 'dev';
    
    // Use the stage name in your resources
    const bucket = new s3.Bucket(this, `MyBucket-${stageName}`);
  }
}
```

You can set environment variables when deploying your CDK application:

```bash
STAGE_NAME=prod nx deploy my-cdk-app
```

### Using AWS CDK Constructs

AWS CDK provides a rich set of constructs for defining AWS resources. You can use these constructs to define your infrastructure in a high-level, object-oriented way.

For example, to create an API Gateway with a Lambda function backend:

```typescript
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class MyCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a Lambda function
    const helloFunction = new lambda.Function(this, 'HelloFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler',
    });

    // Create an API Gateway
    const api = new apigateway.RestApi(this, 'HelloApi');
    
    // Add a resource and method
    const helloResource = api.root.addResource('hello');
    helloResource.addMethod('GET', new apigateway.LambdaIntegration(helloFunction));
  }
}
```

## Troubleshooting

### Common Issues

#### CDK Bootstrap Error

If you encounter an error when bootstrapping your AWS environment, make sure you have the correct AWS credentials configured:

```bash
aws configure
```

#### Deployment Error

If you encounter an error when deploying your CDK application, check the error message for details. Common issues include:

- Missing AWS credentials
- Insufficient permissions
- Resource already exists

#### Missing Dependencies

If you encounter an error about missing dependencies, make sure you have installed all the required AWS CDK libraries:

```bash
npm install aws-cdk-lib
```

### Getting Help

If you encounter any issues not covered in this guide, you can:

- Check the [AWS CDK documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- Open an issue on the [nx-aws-cdk-v2 GitHub repository](https://github.com/WolfSoko/nx-aws-cdk-v2/issues)
- Ask for help on the [Nx Community Discord](https://discord.gg/nx)
