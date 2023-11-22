import { typescript } from "projen";
import { NpmAccess } from "projen/lib/javascript";
const project = new typescript.TypeScriptProject({
  copyrightOwner: "Niko Virtala",
  defaultReleaseBranch: "main",
  deps: ["projen"],
  jest: false,
  license: "MIT",
  name: "@nikovirtala/projen-bundle-lambda-function-code",
  npmAccess: NpmAccess.PUBLIC,
  prettier: true,
  projenrcTs: true,
  releaseToNpm: true,
});
project.synth();
