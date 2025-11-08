import * as path from "node:path";
import { Component, DependencyType, type Project, type Task } from "projen";
import { renderBundleName } from "./utils";

/**
 * Options for `Bundler`.
 */
export interface BundlerOptions {
    /**
     * The semantic version requirement for `esbuild`.
     *
     * @default - no specific version (implies latest)
     */
    readonly esbuildVersion?: string;

    /**
     * Output directory for all bundles.
     * @default "assets"
     */
    readonly assetsDir?: string;

    /**
     * Install the `bundle` command as a pre-compile phase.
     *
     * @default true
     */
    readonly addToPreCompile?: boolean;

    /**
     * Map of file extensions (without dot) and loaders to use for this file type.
     * Loaders are appended to the esbuild command by `--loader:.extension=loader`
     */
    readonly loaders?: { [key: string]: string };
}

/**
 * Adds support for bundling JavaScript applications and dependencies into a
 * single file. In the future, this will also supports bundling websites.
 */
export class Bundler extends Component {
    /**
     * Returns the `Bundler` instance associated with a project or `undefined` if
     * there is no Bundler.
     * @param project The project
     * @returns A bundler
     */
    public static of(project: Project): Bundler | undefined {
        const isBundler = (o: Component): o is Bundler => o instanceof Bundler;
        return project.components.find(isBundler);
    }

    /**
     * The semantic version requirement for `esbuild` (if defined).
     */
    public readonly esbuildVersion: string | undefined;

    /**
     * Root bundle directory.
     */
    public readonly bundledir: string;

    private _task: Task | undefined;
    private readonly addToPreCompile: boolean;
    private readonly loaders?: { [key: string]: string };

    /**
     * Creates a `Bundler`.
     */
    constructor(project: Project, options: BundlerOptions = {}) {
        super(project);

        this.esbuildVersion = options.esbuildVersion;
        this.bundledir = options.assetsDir ?? "assets";
        this.addToPreCompile = options.addToPreCompile ?? true;
        this.loaders = options.loaders;
    }

    /**
     * Gets or creates the singleton "bundle" task of the project.
     *
     * If the project doesn't have a "bundle" task, it will be created and spawned
     * during the pre-compile phase.
     */
    public get bundleTask(): Task {
        if (!this._task) {
            this.addBundlingSupport();
            this._task = this.project.tasks.addTask("bundle", {
                description: "Prepare assets",
            });

            // install the bundle task into the pre-compile phase.
            if (this.addToPreCompile) {
                this.project.preCompileTask.spawn(this._task);
            }
        }

        return this._task;
    }

    /**
     * Adds a task to the project which bundles a specific entrypoint and all of
     * its dependencies into a single javascript output file.
     *
     * @param entrypoint The relative path of the artifact within the project
     * @param options Bundling options
     */
    public addBundle(entrypoint: string, options: BundlingOptions): Bundle {
        const name = renderBundleName(entrypoint);

        const outdir = path.posix.join(this.bundledir, name);
        const outfile = path.posix.join(outdir, options.outfile ?? "index.mjs");
        const target = options.target ?? "esnext";
        const platform = options.platform ?? "node";
        const format = options.format ?? "esm";
        const sourcemap = options.sourcemap ?? true;
        const sourcesContent = options.sourcesContent ?? false;
        const minify = options.minify ?? true;
        const mainFields = options.mainFields ?? "module,main";
        const banner =
            options.banner ??
            ":js=import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url)";

        const args = [
            "esbuild",
            "--bundle",
            entrypoint,
            `--target="${target}"`,
            `--platform="${platform}"`,
            `--outfile="${outfile}"`,
        ];

        const tsconfig = options.tsconfigPath ?? false;
        if (tsconfig) {
            args.push(`--tsconfig="${tsconfig}"`);
        }

        for (const x of options.externals ?? []) {
            args.push(`--external:${x}`);
        }

        if (sourcemap) {
            args.push("--sourcemap");
        }

        if (sourcesContent) {
            args.push(`--sources-content=${sourcesContent}`);
        }

        if (minify) {
            args.push("--minify");
        }

        if (format) {
            args.push(`--format=${format}`);
        }

        if (mainFields) {
            args.push(`--main-fields=${mainFields}`);
        }

        if (banner) {
            args.push(`--banner${banner}`);
        }

        const loaders = (options.loaders ?? false) ? options.loaders : (this.loaders ?? false);
        if (loaders) {
            for (const [extension, loader] of Object.entries(loaders)) {
                args.push(`--loader:.${extension}=${loader}`);
            }
        }

        console.log({ args: args });

        const bundleTask = this.project.addTask(`bundle:${name}`, {
            description: `Create a JavaScript bundle from ${entrypoint}`,
            exec: args.join(" "),
        });

        this.bundleTask.spawn(bundleTask);

        return {
            bundleTask: bundleTask,
            outdir: outdir,
            outfile: outfile,
        };
    }

    /**
     * Add bundling support to a project. This is called implicitly when
     * `bundleTask` is referenced first. It adds the dependency on `esbuild`,
     * gitignore/npmignore, etc.
     */
    private addBundlingSupport() {
        const ignoreEntry = `/${this.bundledir}/`;
        this.project.addGitIgnore(ignoreEntry);
        this.project.addPackageIgnore(`!${ignoreEntry}`); // include in tarball
        const dep = this.esbuildVersion ? `esbuild@${this.esbuildVersion}` : "esbuild";
        this.project.deps.addDependency(dep, DependencyType.BUILD);
    }
}

export interface Bundle {
    /**
     * The task that produces this bundle.
     */
    readonly bundleTask: Task;

    /**
     * Location of the output file (relative to project root).
     */
    readonly outfile: string;

    /**
     * Base directory containing the output file (relative to project root).
     */
    readonly outdir: string;
}

/**
 * Options for bundling.
 */
export interface BundlingOptions {
    /**
     * You can mark a file or a package as external to exclude it from your build.
     * Instead of being bundled, the import will be preserved (using require for
     * the iife and cjs formats and using import for the esm format) and will be
     * evaluated at run time instead.
     *
     * This has several uses. First of all, it can be used to trim unnecessary
     * code from your bundle for a code path that you know will never be executed.
     * For example, a package may contain code that only runs in node but you will
     * only be using that package in the browser. It can also be used to import
     * code in node at run time from a package that cannot be bundled. For
     * example, the fsevents package contains a native extension, which esbuild
     * doesn't support.
     *
     * @default []
     */
    readonly externals?: string[];

    /**
     * Include a source map in the bundle.
     *
     * @default true
     */
    readonly sourcemap?: boolean;

    /**
     * esbuild target.
     *
     * @default "esnext"
     */
    readonly target?: string;

    /**
     * esbuild platform.
     *
     * @default "node"
     */
    readonly platform?: string;

    /**
     * Bundler output path relative to the asset's output directory.
     * @default "index.mjs"
     */
    readonly outfile?: string;

    /**
     * The path of the tsconfig.json file to use for bundling
     * @default "tsconfig.json"
     */
    readonly tsconfigPath?: string;

    /**
     * Map of file extensions (without dot) and loaders to use for this file type.
     * Loaders are appended to the esbuild command by `--loader:.extension=loader`
     */
    readonly loaders?: { [key: string]: string };

    /**
     * Output format for the generated JavaScript files. There are currently three possible values that can be configured: `"iife"`, `"cjs"`, and `"esm"`.
     *
     * If not set (`undefined`), esbuild picks an output format for you based on `platform`:
     * - `"cjs"` if `platform` is `"node"`
     * - `"iife"` if `platform` is `"browser"`
     * - `"esm"` if `platform` is `"neutral"`
     *
     * Note: If making a bundle to run under node with ESM, set `format` to `"esm"` instead of setting `platform` to `"neutral"`.
     *
     * @default undefined
     *
     * @see https://esbuild.github.io/api/#format
     */
    readonly format?: string;

    /**
     *
     *
     * @default true
     */
    readonly minify?: boolean;

    /**
     *
     *
     * @default false
     */
    readonly sourcesContent?: boolean;

    /**
     *
     *
     * @default "module,main"
     */
    readonly mainFields?: string;

    /**
     *
     *
     * @default ":js='import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url)'"
     */
    readonly banner?: string;
}
