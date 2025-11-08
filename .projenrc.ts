import { JsonPatch, javascript, typescript } from "projen";

const project = new typescript.TypeScriptProject({
    biome: true,
    biomeOptions: {
        biomeConfig: {
            formatter: {
                indentStyle: javascript.biome_config.IndentStyle.SPACE,
                indentWidth: 4,
                lineWidth: 120,
                useEditorconfig: false,
            },
        },
        formatter: true,
        linter: true,
    },
    copyrightOwner: "Niko Virtala",
    defaultReleaseBranch: "main",
    deps: ["case", "projen"],
    eslint: false,
    jest: false,
    license: "MIT",
    name: "@nikovirtala/projen-bundle-lambda-function-code",
    npmAccess: javascript.NpmAccess.PUBLIC,
    npmTrustedPublishing: true,
    packageManager: javascript.NodePackageManager.PNPM,
    pnpmVersion: "10",
    prettier: false,
    projenrcTs: true,
    releaseToNpm: true,
});

project.vscode?.extensions.addRecommendations("biomejs.biome");

project.vscode?.settings.addSettings({
    "editor.codeActionsOnSave": {
        "source.organizeImports.biome": "always",
    },
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true,
    "editor.tabSize": 4,
});

// use node.js 24.x to get new enough npm to satisfy: trusted publishing requires npm CLI version 11.5.1 or later.
project.github
    ?.tryFindWorkflow("release")
    ?.file?.patch(JsonPatch.replace("/jobs/release_npm/steps/0/with/node-version", "24.x"));

project.synth();
