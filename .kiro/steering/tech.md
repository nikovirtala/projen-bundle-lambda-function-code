# Technology Stack

## ⚠️ Projen-Managed Project

This project is **entirely managed by projen**. Key implications:

- **DO NOT** manually edit generated files (package.json, tsconfig.json, etc.)
- **ALL** configuration changes must be made in `.projenrc.ts`
- After modifying `.projenrc.ts`, run `npx projen` to regenerate files
- Dependencies, scripts, and tooling are defined in `.projenrc.ts`, not package.json

## Build System

- **Projen**: Project configuration and task management
- **TypeScript**: Primary language (TypeScript 5.9+)
- **pnpm**: Package manager (v10)
- **Biome**: Code formatting and linting (replaces ESLint/Prettier)

## Key Dependencies

- `projen`: Core framework for project configuration
- `case`: String case conversion utilities
- `esbuild`: JavaScript bundler (added as build dependency)
- `constructs`: AWS CDK constructs library

## Code Quality

- **Biome** for formatting and linting
  - 4-space indentation
  - 120 character line width
  - Double quotes for JavaScript/TypeScript
- No ESLint, Prettier, or Jest (configured out)

## Common Commands

```bash
# Install dependencies
pnpm install

# Build the project (compiles TypeScript)
pnpm build

# Run Biome formatter and linter
pnpm biome

# Update Projen configuration
npx projen

# Bundle Lambda functions (runs during pre-compile)
npx projen bundle

# Release new version
pnpm release
```

## Development Workflow

1. Modify `.projenrc.ts` for project configuration changes
2. Run `npx projen` to regenerate project files
3. Use `pnpm build` to compile and bundle
4. Biome runs automatically on save (VSCode integration)
