import { Component, Project, cdk } from "projen";
import { LambdaFunction, LambdaFunctionCommonOptions } from "./lambda-function";

/**
 * Options for `LambdaAutoDiscover`
 */
export interface LambdaAutoDiscoverOptions {
  /**
   * Locate files with the given extension.
   *
   * @example ".lambda.ts"
   */
  readonly extension: string;

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
      extension: options.extension,
    });

    const extension = options.extension;

    for (const entrypoint of this.entrypoints) {
      new LambdaFunction(this.project, {
        entrypoint,
        extension,
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
        srcdir: options.srcdir,
        extension: options.extension,
        lambdaOptions: options.lambdaOptions,
      });
    }
  }
}
