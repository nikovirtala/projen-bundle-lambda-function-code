import { typescript } from "projen";
import { NpmAccess } from "projen/lib/javascript";
const project = new typescript.TypeScriptProject({
  copyrightOwner: "Niko Virtala",
  defaultReleaseBranch: "main",
  deps: ["projen"],
  license: "MIT",
  name: "projen-bundle-lambda-function-code",
  npmAccess: NpmAccess.PUBLIC,
  prettier: true,
  projenrcTs: true,
});
project.synth();
