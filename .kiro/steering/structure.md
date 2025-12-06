# Project Structure

## Directory Layout

```
.
├── src/                    # Source code
│   ├── index.ts           # Main exports: LambdaFunctionCodeBundler
│   ├── bundler.ts         # Core Bundler component and esbuild integration
│   ├── lambda-function-code.ts  # LambdaFunctionCodeBundle component
│   └── utils.ts           # Utility functions
├── .projenrc.ts           # Projen project configuration
├── biome.jsonc            # Biome formatter/linter config
└── package.json           # NPM package manifest
```

## Source Code Organization

### `src/index.ts`
- Exports `LambdaFunctionCodeBundler` class
- Auto-discovery component that finds Lambda handlers by extension
- Extends `cdk.AutoDiscoverBase` from Projen

### `src/bundler.ts`
- Core `Bundler` component for esbuild integration
- Manages bundle tasks and esbuild configuration
- Provides `addBundle()` method for creating individual bundles
- Singleton pattern via `Bundler.of(project)`

### `src/lambda-function-code.ts`
- `LambdaFunctionCodeBundle` component for individual Lambda functions
- Generates TypeScript construct files with `aws_lambda.Code.fromAsset()`
- Handles path resolution between source and bundled assets

### `src/utils.ts`
- Helper functions for path manipulation and naming conventions

## Generated Files

During build, the following are generated:

- `assets/*/` - Bundled Lambda function code (gitignored, included in npm package)
- `src/*-code.ts` - Generated CDK construct files for each Lambda handler

## Naming Conventions

- Lambda handlers: `*.lambda.ts` (configurable extension)
- Generated constructs: `*-code.ts` (e.g., `hello-world.lambda.ts` → `hello-world-code.ts`)
- Construct names: PascalCase with `FunctionCode` suffix (e.g., `HelloWorldFunctionCode`)
- Bundle task names: `bundle:<name>` (e.g., `bundle:hello-world`)

## Configuration Files

- `.projenrc.ts` - Single source of truth for project configuration
- `biome.jsonc` - Generated from Projen config, do not edit directly
- `tsconfig.json` - Generated from Projen config
