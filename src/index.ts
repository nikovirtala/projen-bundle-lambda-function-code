import { TypeScriptCode } from "@mrgrain/cdk-esbuild";
import { Component, Project, awscdk, cdk } from "projen";

/**
 * Suffix for AWS Lambda handlers.
 */
export const TYPESCRIPT_LAMBDA_EXT = ".lambda.ts";

/**
 * Common options for auto discovering project subcomponents.
 */
export interface FunctionCodeBundlerCommonOptions {
  /**
   * Path to the tsconfig file to use for integration tests.
   */
  readonly tsconfigPath: string;

  /**
   * AWS CDK dependency manager.
   */
  readonly cdkDeps: awscdk.AwsCdkDeps;
}

/**
 * Options for `LambdaFunctionCodeBundler`
 */
export interface LambdaFunctionCodeBundlerOptions
  extends FunctionCodeBundlerCommonOptions {
  /**
   * Project source tree (relative to project output directory).
   */
  readonly srcdir: string;

  /**
   * Options for AWS Lambda functions.
   */
  readonly lambdaOptions?: awscdk.LambdaFunctionCommonOptions;
}

/**
 * Creates lambdas from entry points discovered in the project's source tree.
 */
export class LambdaFunctionCodeBundler extends cdk.AutoDiscoverBase {
  constructor(project: Project, options: LambdaFunctionCodeBundlerOptions) {
    super(project, {
      projectdir: options.srcdir,
      extension: TYPESCRIPT_LAMBDA_EXT,
    });

    for (const entrypoint of this.entrypoints) {
      new TypeScriptCode(entrypoint);
      /*       new awscdk.LambdaFunction(this.project, {
        entrypoint,
        cdkDeps: options.cdkDeps,
        ...options.lambdaOptions,
      }); */
    }
  }
}

/**
 * Options for `FunctionCodeBundler`
 */
export interface FunctionCodeBundlerOptions
  extends LambdaFunctionCodeBundlerOptions {
  /**
   * Auto-discover lambda functions.
   *
   * @default true
   */
  readonly lambdaFunctionCodeBundler?: boolean;
}

/**
 * Discovers and creates integration tests and lambdas from code in the
 * project's source and test trees.
 */
export class FunctionCodeBundler extends Component {
  constructor(project: Project, options: FunctionCodeBundlerOptions) {
    super(project);

    if (options.lambdaFunctionCodeBundler ?? true) {
      new LambdaFunctionCodeBundler(this.project, {
        cdkDeps: options.cdkDeps,
        tsconfigPath: options.tsconfigPath,
        srcdir: options.srcdir,
        lambdaOptions: options.lambdaOptions,
      });
    }
  }
}
