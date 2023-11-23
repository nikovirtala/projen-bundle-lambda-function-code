import { typescript, javascript } from "projen";
const project = new typescript.TypeScriptProject({
  copyrightOwner: "Niko Virtala",
  defaultReleaseBranch: "main",
  deps: ["case", "projen"],
  jest: false,
  license: "MIT",
  name: "@nikovirtala/projen-bundle-lambda-function-code",
  npmAccess: javascript.NpmAccess.PUBLIC,
  prettier: true,
  projenrcTs: true,
  releaseToNpm: true,
});
project.synth();
