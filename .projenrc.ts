import { typescript } from "projen";
const project = new typescript.TypeScriptProject({
  copyrightOwner: "Niko Virtala",
  defaultReleaseBranch: "main",
  deps: ["projen"],
  jest: false,
  license: "MIT",
  name: "projen-bundle-lambda-function-code",
  prettier: true,
  projenrcTs: true,
});
project.synth();
