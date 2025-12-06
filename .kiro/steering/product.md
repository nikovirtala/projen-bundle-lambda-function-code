# Product Overview

A Projen component that automates AWS Lambda function code bundling using esbuild. The library provides auto-discovery of Lambda handlers, generates CDK constructs with pre-bundled code, and integrates seamlessly into Projen-based TypeScript projects.

## Key Features

- Auto-discovers Lambda handler files by extension (e.g., `.lambda.ts`)
- Bundles Lambda code using esbuild for fast, efficient builds
- Generates CDK constructs (`aws_lambda.Code.fromAsset`) for each Lambda function
- Integrates into Projen's build lifecycle (pre-compile phase)
- Supports customizable bundling options per function

## Target Users

Developers building AWS CDK applications with Projen who want automated Lambda bundling without manual configuration.
