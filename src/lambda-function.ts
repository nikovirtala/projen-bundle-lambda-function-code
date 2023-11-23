import * as path from "path";
import { pascal } from "case";
import { Component, Project, SourceCode, javascript, typescript } from "projen";
import { convertToPosixPath } from "./internal";

/**
 * Common options for `LambdaFunction`. Applies to all functions in
 * auto-discovery.
 */
export interface LambdaFunctionCommonOptions {
  /**
   * The node.js version to target.
   *
   * @default Runtime.NODEJS_18_X
   */
  readonly runtime?: LambdaRuntime;

  /**
   * Bundling options for this AWS Lambda function.
   *
   * If not specified the default bundling options specified for the project
   * `Bundler` instance will be used.
   *
   * @default - defaults
   */
  readonly bundlingOptions?: javascript.BundlingOptions;

  /**
   * Whether to automatically reuse TCP connections when working with the AWS
   * SDK for JavaScript.
   *
   * This sets the `AWS_NODEJS_CONNECTION_REUSE_ENABLED` environment variable
   * to `1`.
   *
   * Not applicable when `edgeLambda` is set to `true` because environment
   * variables are not supported in Lambda@Edge.
   *
   * @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-reusing-connections.html
   *
   * @default true
   */
  readonly awsSdkConnectionReuse?: boolean;
}

/**
 * Options for `Function`.
 */
export interface LambdaFunctionOptions extends LambdaFunctionCommonOptions {
  /**
   * A path from the project root directory to a TypeScript file which contains
   * the AWS Lambda handler entrypoint (exports a `handler` function).
   *
   * This is relative to the root directory of the project.
   *
   * @example "src/subdir/foo.lambda.ts"
   */
  readonly entrypoint: string;

  /**
   * Suffix for AWS Lambda handlers.
   *
   * @example ".lambda.ts"
   */
  readonly extension: string;

  /**
   * The name of the generated TypeScript source file. This file should also be
   * under the source tree.
   *
   * @default - The name of the entrypoint file, with the `-function.ts` suffix
   * instead of `.lambda.ts`.
   */
  readonly constructFile?: string;

  /**
   * The name of the generated `lambda.Function` subclass.
   *
   * @default - A pascal cased version of the name of the entrypoint file, with
   * the extension `Function` (e.g. `ResizeImageFunction`).
   */
  readonly constructName?: string;
}

/**
 * Generates a pre-bundled AWS Lambda function construct from handler code.
 *
 * To use this, create an AWS Lambda handler file under your source tree with
 * the `.lambda.ts` extension and add a `LambdaFunction` component to your
 * typescript project pointing to this entrypoint.
 *
 * This will add a task to your "compile" step which will use `esbuild` to
 * bundle the handler code into the build directory. It will also generate a
 * file `src/foo-function.ts` with a custom AWS construct called `FooFunction`
 * which extends `@aws-cdk/aws-lambda.Function` which is bound to the bundled
 * handle through an asset.
 *
 * @example
 *
 * new LambdaFunction(myProject, {
 *   srcdir: myProject.srcdir,
 *   entrypoint: 'src/foo.lambda.ts',
 * });
 */
export class LambdaFunction extends Component {
  /**
   * Defines a pre-bundled AWS Lambda function construct from handler code.
   *
   * @param project The project to use
   * @param options Options
   */
  constructor(project: Project, options: LambdaFunctionOptions) {
    super(project);

    const bundler = javascript.Bundler.of(project);
    if (!bundler) {
      throw new Error(
        "No bundler found. Please add a Bundler component to your project.",
      );
    }

    const runtime = options.runtime ?? LambdaRuntime.NODEJS_18_X;

    // allow Lambda handler code to import dev-deps since they are only needed
    // during bundling
    const eslint = javascript.Eslint.of(project);
    eslint?.allowDevDeps(options.entrypoint);

    const entrypoint = options.entrypoint;

    const extension = options.extension ?? ".lambda.ts";

    if (!entrypoint.endsWith(extension)) {
      throw new Error(`${entrypoint} must have a ${extension} extension`);
    }

    const basePath = path.posix.join(
      path.dirname(entrypoint),
      path.basename(entrypoint, extension),
    );
    const constructFile = options.constructFile ?? `${basePath}-code.ts`;

    if (path.extname(constructFile) !== ".ts") {
      throw new Error(
        `Construct file name "${constructFile}" must have a .ts extension`,
      );
    }

    // type names
    const constructName =
      options.constructName ?? pascal(path.basename(basePath)) + "FunctionCode";

    const bundle = bundler.addBundle(entrypoint, {
      target: runtime.esbuildTarget,
      platform: runtime.esbuildPlatform,
      externals: runtime.defaultExternals,
      ...options.bundlingOptions,
      tsconfigPath: (project as typescript.TypeScriptProject)?.tsconfigDev
        ?.fileName,
    });

    // calculate the relative path between the directory containing the
    // generated construct source file to the directory containing the bundle
    // index.js by resolving them as absolute paths first.
    // e.g:
    //  - outfileAbs => `/project-outdir/assets/foo/bar/baz/foo-function/index.js`
    //  - constructAbs => `/project-outdir/src/foo/bar/baz/foo-function.ts`
    const outfileAbs = path.join(project.outdir, bundle.outfile);
    const constructAbs = path.join(project.outdir, constructFile);
    const relativeOutfile = path.relative(
      path.dirname(constructAbs),
      path.dirname(outfileAbs),
    );

    const src = new SourceCode(project, constructFile);
    if (src.marker) {
      src.line(`// ${src.marker}`);
    }
    src.line("import * as path from 'path';");
    src.line("import { aws_lambda } from 'aws-cdk-lib';");
    src.line();
    src.open(`export const ${constructName} = aws_lambda.Code.fromAsset(`);
    src.line(`path.join(__dirname, '${convertToPosixPath(relativeOutfile)}'),`);
    src.close(");");

    this.project.logger.verbose(
      `${basePath}: construct "${constructName}" generated under "${constructFile}"`,
    );
    this.project.logger.verbose(
      `${basePath}: bundle task "${bundle.bundleTask.name}"`,
    );
    if (bundle.watchTask) {
      this.project.logger.verbose(
        `${basePath}: bundle watch task "${bundle.watchTask.name}"`,
      );
    }
  }
}

/**
 * Options for the AWS Lambda function runtime
 */
export interface LambdaRuntimeOptions {
  /**
   * Packages that are considered externals by default when bundling
   *
   * @default ['@aws-sdk/*']
   */
  readonly defaultExternals?: string[];
}

/**
 * The runtime for the AWS Lambda function.
 */
export class LambdaRuntime {
  /**
   * Node.js 18.x
   */
  public static readonly NODEJS_18_X = new LambdaRuntime(
    "nodejs18.x",
    "node18",
  );

  /**
   * Node.js 20.x
   */
  public static readonly NODEJS_20_X = new LambdaRuntime(
    "nodejs20.x",
    "node20",
  );

  public readonly esbuildPlatform = "node";

  public readonly defaultExternals: string[];

  public constructor(
    /**
     * The Node.js runtime to use
     */
    public readonly functionRuntime: string,

    /**
     * The esbuild setting to use.
     */
    public readonly esbuildTarget: string,

    /**
     * Options for this runtime.
     */
    options?: LambdaRuntimeOptions,
  ) {
    this.defaultExternals = options?.defaultExternals ?? [];
  }
}
