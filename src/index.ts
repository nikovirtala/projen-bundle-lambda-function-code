import { Component, Project, cdk } from "projen";
import { TYPESCRIPT_LAMBDA_EXT } from "./internal";
import { LambdaFunction, LambdaFunctionCommonOptions } from "./lambda-function";

/**
 * Common options for auto discovering project subcomponents.
 */
export interface AutoDiscoverCommonOptions {
  /**
   * Path to the tsconfig file to use for integration tests.
   */
  readonly tsconfigPath: string;
}

/**
 * Options for `LambdaAutoDiscover`
 */
export interface LambdaAutoDiscoverOptions extends AutoDiscoverCommonOptions {
  /**
   * Project source tree (relative to project output directory).
   */
  readonly srcdir: string;

  /**
   * Options for AWS Lambda functions.
   */
  readonly lambdaOptions?: LambdaFunctionCommonOptions;
}

/**
 * Creates lambdas from entry points discovered in the project's source tree.
 */
export class LambdaAutoDiscover extends cdk.AutoDiscoverBase {
  constructor(project: Project, options: LambdaAutoDiscoverOptions) {
    super(project, {
      projectdir: options.srcdir,
      extension: TYPESCRIPT_LAMBDA_EXT,
    });

    for (const entrypoint of this.entrypoints) {
      new LambdaFunction(this.project, {
        entrypoint,
        ...options.lambdaOptions,
      });
    }
  }
}

/**
 * Options for `AutoDiscover`
 */
export interface AutoDiscoverOptions extends LambdaAutoDiscoverOptions {
  /**
   * Auto-discover lambda functions.
   *
   * @default true
   */
  readonly lambdaAutoDiscover?: boolean;
}

/**
 * Discovers and creates integration tests and lambdas from code in the
 * project's source and test trees.
 */
export class AutoDiscover extends Component {
  constructor(project: Project, options: AutoDiscoverOptions) {
    super(project);

    if (options.lambdaAutoDiscover ?? true) {
      new LambdaAutoDiscover(this.project, {
        tsconfigPath: options.tsconfigPath,
        srcdir: options.srcdir,
        lambdaOptions: options.lambdaOptions,
      });
    }
  }
}
