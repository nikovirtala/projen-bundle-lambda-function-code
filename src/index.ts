import { Project, cdk } from "projen";
import {
  LambdaFunctionCodeBundle,
  LambdaFunctionCodeBundleCommonOptions,
} from "./lambda-function-code";

/**
 * Options for `LambdaFunctionCodeBundler`
 */
export interface LambdaFunctionCodeBundlerOptions {
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
   * Options for AWS Lambda Function bundling.
   */
  readonly lambdaOptions?: LambdaFunctionCodeBundleCommonOptions;
}

/**
 * Creates Lambda Function code bundles from entrypoints discovered in the project's source tree.
 */
export class LambdaFunctionCodeBundler extends cdk.AutoDiscoverBase {
  constructor(project: Project, options: LambdaFunctionCodeBundlerOptions) {
    super(project, {
      projectdir: options.srcdir,
      extension: options.extension,
    });

    for (const entrypoint of this.entrypoints) {
      new LambdaFunctionCodeBundle(this.project, {
        entrypoint: entrypoint,
        extension: options.extension,
        ...options.lambdaOptions,
      });
    }
  }
}
