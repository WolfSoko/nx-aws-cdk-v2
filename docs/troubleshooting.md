# Troubleshooting Guide for nx-aws-cdk-v2

This guide provides solutions to common issues you might encounter when using the nx-aws-cdk-v2 plugin. It covers installation issues, deployment problems, and other common challenges.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Generator Issues](#generator-issues)
- [Deployment Issues](#deployment-issues)
- [Bootstrap Issues](#bootstrap-issues)
- [Destroy Issues](#destroy-issues)
- [AWS CDK Issues](#aws-cdk-issues)
- [Nx Integration Issues](#nx-integration-issues)
- [Common Error Messages](#common-error-messages)
- [Getting Help](#getting-help)

## Installation Issues

### Plugin Not Found

**Issue**: When trying to use the plugin, you get an error saying the plugin cannot be found.

**Solution**: Make sure you have installed the plugin correctly:

```bash
npm install --save-dev @wolsok/nx-aws-cdk-v2
```

Also, check your `package.json` to ensure the plugin is listed in the `devDependencies` section.

### Version Compatibility Issues

**Issue**: You encounter errors related to version compatibility between Nx and the plugin.

**Solution**: Make sure you are using compatible versions of Nx and the plugin. The nx-aws-cdk-v2 plugin is designed to work with Nx v15 and later. You can check your Nx version with:

```bash
nx --version
```

If you need to update Nx, you can do so with:

```bash
npm install --save-dev nx@latest
```

### Dependency Conflicts

**Issue**: You encounter dependency conflicts when installing the plugin.

**Solution**: Try installing with the `--force` flag:

```bash
npm install --save-dev @wolsok/nx-aws-cdk-v2 --force
```

Alternatively, you can try resolving the conflicts manually by updating your dependencies.

## Generator Issues

### Application Generator Fails

**Issue**: The application generator fails with an error.

**Solution**: Check the error message for details. Common issues include:

1. **Invalid project name**: Make sure your project name follows Nx naming conventions (lowercase, no spaces).
2. **Directory already exists**: Choose a different project name or directory.
3. **Missing dependencies**: Make sure you have all the required dependencies installed.

Try running the generator with the `--verbose` flag to get more information:

```bash
nx generate @wolsok/nx-aws-cdk-v2:application my-cdk-app --verbose
```

### Generated Application Structure Issues

**Issue**: The generated application structure is not as expected.

**Solution**: Make sure you are using the latest version of the plugin. If the issue persists, try generating the application with different options:

```bash
nx generate @wolsok/nx-aws-cdk-v2:application my-cdk-app --directory=apps/aws
```

## Deployment Issues

### Deployment Fails

**Issue**: The `nx deploy` command fails with an error.

**Solution**: Check the error message for details. Common issues include:

1. **AWS credentials not configured**: Make sure you have configured your AWS credentials correctly:

```bash
aws configure
```

2. **Missing AWS CDK bootstrap**: Make sure you have bootstrapped your AWS environment:

```bash
nx bootstrap my-cdk-app
```

3. **Stack already exists**: If you're trying to deploy a stack that already exists, you might need to update it instead:

```bash
nx deploy my-cdk-app
```

4. **Permission issues**: Make sure your AWS user has the necessary permissions to deploy the resources defined in your CDK application.

### Deployment Hangs

**Issue**: The `nx deploy` command hangs and doesn't complete.

**Solution**: This could be due to network issues or AWS service issues. Try the following:

1. Check your internet connection.
2. Check the AWS Service Health Dashboard for any ongoing issues.
3. Try deploying with the `--verbose` flag to get more information:

```bash
nx deploy my-cdk-app --verbose
```

4. Try deploying a specific stack:

```bash
nx deploy my-cdk-app --stacks="MyStack"
```

### Deployment Succeeds but Resources Are Not Created

**Issue**: The `nx deploy` command succeeds, but the expected AWS resources are not created.

**Solution**: Check the following:

1. Make sure your CDK application is correctly defining the resources you expect.
2. Check the AWS CloudFormation console to see if the stack was created.
3. Check the AWS CloudFormation events for any errors.
4. Make sure you're looking in the correct AWS region.

## Bootstrap Issues

### Bootstrap Fails

**Issue**: The `nx bootstrap` command fails with an error.

**Solution**: Check the error message for details. Common issues include:

1. **AWS credentials not configured**: Make sure you have configured your AWS credentials correctly:

```bash
aws configure
```

2. **Permission issues**: Make sure your AWS user has the necessary permissions to create the bootstrap resources.
3. **Region not specified**: If you're trying to bootstrap a specific region, make sure you specify it correctly:

```bash
nx bootstrap my-cdk-app aws://123456789012/us-east-1
```

### Bootstrap Succeeds but Deployment Still Fails

**Issue**: You've successfully bootstrapped your AWS environment, but deployment still fails with bootstrap-related errors.

**Solution**: Make sure you've bootstrapped the correct AWS environment. If you're deploying to multiple regions or accounts, you need to bootstrap each one:

```bash
# Bootstrap account 123456789012 in us-east-1
nx bootstrap my-cdk-app aws://123456789012/us-east-1

# Bootstrap account 123456789012 in us-west-2
nx bootstrap my-cdk-app aws://123456789012/us-west-2
```

## Destroy Issues

### Destroy Fails

**Issue**: The `nx destroy` command fails with an error.

**Solution**: Check the error message for details. Common issues include:

1. **AWS credentials not configured**: Make sure you have configured your AWS credentials correctly:

```bash
aws configure
```

2. **Permission issues**: Make sure your AWS user has the necessary permissions to delete the resources.
3. **Resources with deletion protection**: Some resources might have deletion protection enabled. You'll need to disable it before destroying the stack.
4. **Dependencies between stacks**: If you have dependencies between stacks, you need to destroy them in the correct order.

### Resources Not Fully Removed

**Issue**: After running `nx destroy`, some resources are still present in your AWS account.

**Solution**: Some resources might have been created outside of CloudFormation or might have `RemovalPolicy.RETAIN` set. You'll need to manually delete these resources using the AWS Management Console or AWS CLI.

## AWS CDK Issues

### CDK Version Compatibility

**Issue**: You encounter errors related to CDK version compatibility.

**Solution**: Make sure you are using compatible versions of AWS CDK and the plugin. The nx-aws-cdk-v2 plugin is designed to work with AWS CDK v2. You can check your AWS CDK version with:

```bash
cdk --version
```

If you need to update AWS CDK, you can do so with:

```bash
npm install -g aws-cdk@latest
```

### CDK Construct Library Issues

**Issue**: You encounter errors when using CDK construct libraries.

**Solution**: Make sure you have installed the correct construct libraries for your CDK version:

```bash
# For CDK v2
npm install aws-cdk-lib
```

Also, make sure you're importing the constructs correctly:

```typescript
// For CDK v2
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
```

## Nx Integration Issues

### Nx Commands Not Working

**Issue**: Nx commands like `nx deploy` or `nx bootstrap` are not working.

**Solution**: Make sure your project is correctly configured in the Nx workspace. Check the `project.json` file in your project directory to ensure it has the correct executors configured:

```json
{
  "targets": {
    "deploy": {
      "executor": "@wolsok/nx-aws-cdk-v2:deploy",
      "options": {}
    },
    "destroy": {
      "executor": "@wolsok/nx-aws-cdk-v2:destroy",
      "options": {}
    },
    "bootstrap": {
      "executor": "@wolsok/nx-aws-cdk-v2:bootstrap",
      "options": {}
    }
  }
}
```

### Nx Cache Issues

**Issue**: Nx caching is causing issues with CDK deployments.

**Solution**: You can bypass the Nx cache by using the `--skip-nx-cache` flag:

```bash
nx deploy my-cdk-app --skip-nx-cache
```

## Common Error Messages

### "Cannot find module 'aws-cdk-lib'"

**Issue**: You get an error saying "Cannot find module 'aws-cdk-lib'" when trying to deploy your CDK application.

**Solution**: Install the AWS CDK library:

```bash
npm install aws-cdk-lib
```

### "Unable to resolve AWS account to use"

**Issue**: You get an error saying "Unable to resolve AWS account to use" when trying to deploy your CDK application.

**Solution**: Configure your AWS credentials:

```bash
aws configure
```

Or specify the profile to use:

```bash
nx deploy my-cdk-app --profile=my-profile
```

### "This stack uses assets, so the toolkit stack must be deployed to the environment"

**Issue**: You get an error saying "This stack uses assets, so the toolkit stack must be deployed to the environment" when trying to deploy your CDK application.

**Solution**: Bootstrap your AWS environment:

```bash
nx bootstrap my-cdk-app
```

### "Resource already exists"

**Issue**: You get an error saying "Resource already exists" when trying to deploy your CDK application.

**Solution**: The resource you're trying to create already exists. You can either:

1. Use a different name for your resource.
2. Delete the existing resource.
3. Update your CDK application to import the existing resource instead of creating a new one.

## Getting Help

If you encounter an issue not covered in this guide, you can:

1. Check the [AWS CDK documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html) for general CDK issues.
2. Open an issue on the [nx-aws-cdk-v2 GitHub repository](https://github.com/WolfSoko/nx-aws-cdk-v2/issues).
3. Ask for help on the [Nx Community Discord](https://discord.gg/nx).
4. Search for similar issues on Stack Overflow using the tags `aws-cdk` and `nx`.

When reporting an issue, please include:

1. The version of nx-aws-cdk-v2 you're using.
2. The version of Nx you're using.
3. The version of AWS CDK you're using.
4. The error message you're seeing.
5. Steps to reproduce the issue.
