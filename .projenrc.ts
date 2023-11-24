import { typescript, javascript } from "projen";
const project = new typescript.TypeScriptProject({
  copyrightOwner: "Niko Virtala",
  defaultReleaseBranch: "main",
  deps: ["case", "projen", "@mrgrain/cdk-esbuild"],
  jest: false,
  license: "MIT",
  name: "@nikovirtala/projen-bundle-lambda-function-code",
  npmAccess: javascript.NpmAccess.PUBLIC,
  peerDeps: ["aws-cdk-lib@^2.51.0"],
  prettier: true,
  projenrcTs: true,
  releaseToNpm: true,
});
project.synth();
