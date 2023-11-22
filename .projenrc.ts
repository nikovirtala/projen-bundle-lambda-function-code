import { typescript } from "projen";
const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: "main",
  deps: ["projen"],
  name: "projen-bundle-lambda-function-code",
  prettier: true,
  projenrcTs: true,
});
project.synth();
