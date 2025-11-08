import * as path from "node:path";
import { pascal } from "case";
import { Component, javascript, type Project, SourceCode, type typescript } from "projen";
import { Bundler, type BundlingOptions } from "./bundler";
import { convertToPosixPath } from "./utils";

/**
 * Options for `LambdaFunctionCodeBundle`.
 */
export interface LambdaFunctionCodeBundleOptions {
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

    /**
     * Bundling options for this AWS Lambda Function.
     *
     * If not specified the default bundling options specified for the project
     * `Bundler` instance will be used.
     *
     * @default - defaults
     */
    readonly bundlingOptions?: BundlingOptions;
}

/**
 * Generates a pre-bundled AWS Lambda Function code bundle construct from handler code.
 *
 * To use this, create an AWS Lambda handler file under your source tree with
 * the `.lambda.ts` extension and add a `LambdaFunctionCodeBundle` component to your
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
 * new LambdaFunctionCodeBundle(myProject, {
 *   srcdir: myProject.srcdir,
 *   entrypoint: 'src/foo.lambda.ts',
 * });
 */
export class LambdaFunctionCodeBundle extends Component {
    /**
     * Defines a pre-bundled AWS Lambda Function construct from handler code.
     *
     * @param project The project to use
     * @param options Options
     */
    constructor(project: Project, options: LambdaFunctionCodeBundleOptions) {
        super(project);

        const bundler = Bundler.of(project);
        if (!bundler) {
            throw new Error("No bundler found. Please add a Bundler component to your project.");
        }

        // allow Lambda handler code to import dev-deps since they are only needed
        // during bundling
        const eslint = javascript.Eslint.of(project);
        eslint?.allowDevDeps(options.entrypoint);

        const entrypoint = options.entrypoint;

        const extension = options.extension ?? ".lambda.ts";

        if (!entrypoint.endsWith(extension)) {
            throw new Error(`${entrypoint} must have a ${extension} extension`);
        }

        const basePath = path.posix.join(path.dirname(entrypoint), path.basename(entrypoint, extension));
        const constructFile = options.constructFile ?? `${basePath}-code.ts`;

        if (path.extname(constructFile) !== ".ts") {
            throw new Error(`Construct file name "${constructFile}" must have a .ts extension`);
        }

        // type names
        const constructName = options.constructName ?? `${pascal(path.basename(basePath))}FunctionCode`;

        const bundle = bundler.addBundle(entrypoint, {
            ...options.bundlingOptions,
            tsconfigPath: (project as typescript.TypeScriptProject)?.tsconfigDev?.fileName,
        });

        // calculate the relative path between the directory containing the
        // generated construct source file to the directory containing the bundle
        // index.js by resolving them as absolute paths first.
        // e.g:
        //  - outfileAbs => `/project-outdir/assets/foo/bar/baz/foo-function/index.js`
        //  - constructAbs => `/project-outdir/src/foo/bar/baz/foo-function.ts`
        const outfileAbs = path.join(project.outdir, bundle.outfile);
        const constructAbs = path.join(project.outdir, constructFile);
        const relativeOutfile = path.relative(path.dirname(constructAbs), path.dirname(outfileAbs));

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

        this.project.logger.verbose(`${basePath}: construct "${constructName}" generated under "${constructFile}"`);
        this.project.logger.verbose(`${basePath}: bundle task "${bundle.bundleTask.name}"`);
    }
}
