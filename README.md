# @nikovirtala/projen-bundle-lambda-function-code

A Projen component for automatically bundling AWS Lambda function code using esbuild.

## Features

- **Auto-discovery**: Automatically finds Lambda handler files with configurable extensions
- **ESBuild bundling**: Uses esbuild for fast, efficient bundling
- **CDK integration**: Generates CDK constructs with pre-bundled Lambda code
- **TypeScript support**: Full TypeScript support with configurable tsconfig
- **Flexible configuration**: Customizable bundling options per function

## Installation

```bash
npm install @nikovirtala/projen-bundle-lambda-function-code
```

## Usage

### Basic Setup

Add the bundler to your Projen TypeScript project:

```typescript
import { LambdaFunctionCodeBundler, Bundler } from '@nikovirtala/projen-bundle-lambda-function-code';

const project = new typescript.TypeScriptProject({
  // ... your project config
});

// Add the bundler component
new Bundler(project);

// Auto-discover and bundle Lambda functions
new LambdaFunctionCodeBundler(project, {
  extension: '.lambda.ts',
  srcdir: 'src',
});
```

### Lambda Handler Files

Create Lambda handler files with the configured extension:

```typescript
// src/hello-world.lambda.ts
export const handler = async (event: any) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello World!' }),
  };
};
```

### Generated CDK Constructs

The bundler automatically generates CDK constructs for each Lambda function:

```typescript
// Generated: src/hello-world-code.ts
import * as path from 'path';
import { aws_lambda } from 'aws-cdk-lib';

export const HelloWorldFunctionCode = aws_lambda.Code.fromAsset(
  path.join(__dirname, '../assets/hello-world'),
);
```

Use in your CDK stack:

```typescript
import { HelloWorldFunctionCode } from './hello-world-code';

new aws_lambda.Function(this, 'HelloWorldFunction', {
  runtime: aws_lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: HelloWorldFunctionCode,
});
```

## API Reference

### Bundler

Main component for esbuild bundling support.

```typescript
new Bundler(project, {
  esbuildVersion?: string;     // esbuild version requirement
  assetsDir?: string;          // output directory (default: "assets")
  addToPreCompile?: boolean;   // add to pre-compile phase (default: true)
  loaders?: Record<string, string>; // file extension loaders
});
```

### LambdaFunctionCodeBundler

Auto-discovers and bundles Lambda functions.

```typescript
new LambdaFunctionCodeBundler(project, {
  extension: string;           // file extension to discover (e.g., ".lambda.ts")
  srcdir: string;             // source directory to scan
  bundleOptions?: {           // default bundling options
    externals?: string[];
    sourcemap?: boolean;
    target?: string;
    platform?: string;
    // ... more options
  };
});
```

### LambdaFunctionCodeBundle

Bundle individual Lambda functions.

```typescript
new LambdaFunctionCodeBundle(project, {
  entrypoint: string;         // path to Lambda handler file
  extension: string;          // file extension
  constructFile?: string;     // generated construct file name
  constructName?: string;     // generated construct class name
  bundlingOptions?: BundlingOptions;
});
```

## Bundling Options

Customize esbuild behavior:

```typescript
interface BundlingOptions {
  externals?: string[];       // external dependencies to exclude
  sourcemap?: boolean;        // include source maps (default: true)
  target?: string;           // esbuild target (default: "esnext")
  platform?: string;        // target platform (default: "node")
  outfile?: string;          // output filename (default: "index.mjs")
  format?: string;           // output format (esm, cjs, iife)
  minify?: boolean;          // minify output (default: true)
  tsconfigPath?: string;     // TypeScript config path
  loaders?: Record<string, string>; // file loaders
}
```

## Examples

### Custom Bundling Options

```typescript
new LambdaFunctionCodeBundler(project, {
  extension: '.lambda.ts',
  srcdir: 'src/functions',
  bundleOptions: {
    externals: ['aws-sdk'],
    minify: false,
    sourcemap: true,
    target: 'node18',
  },
});
```

### Individual Function Bundle

```typescript
new LambdaFunctionCodeBundle(project, {
  entrypoint: 'src/special-function.lambda.ts',
  extension: '.lambda.ts',
  constructName: 'SpecialFunction',
  bundlingOptions: {
    externals: ['@aws-sdk/client-s3'],
    format: 'cjs',
  },
});
```

## Development

This project uses Projen for configuration management.

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test

# Update project configuration
npx projen
```

## License

MIT