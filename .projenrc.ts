import { typescript } from "projen";
const project = new typescript.TypeScriptProject({
  copyrightOwner: "Niko Virtala",
  defaultReleaseBranch: "main",
  deps: ["projen"],
  license: "MIT",
  name: "projen-bundle-lambda-function-code",
  prettier: true,
  projenrcTs: true,
});
project.synth();
