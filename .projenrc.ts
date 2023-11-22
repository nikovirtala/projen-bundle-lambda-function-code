import { typescript } from "projen";
import { NpmAccess } from "projen/lib/javascript";
const project = new typescript.TypeScriptProject({
  copyrightOwner: "Niko Virtala",
  defaultReleaseBranch: "main",
  deps: ["projen", "@mrgrain/cdk-esbuild"],
  jest: false,
  license: "MIT",
  name: "@nikovirtala/projen-bundle-lambda-function-code",
  npmAccess: NpmAccess.PUBLIC,
  peerDeps: ["aws-cdk-lib@^2.51.0"],
  prettier: true,
  projenrcTs: true,
  releaseToNpm: true,
});
project.synth();
