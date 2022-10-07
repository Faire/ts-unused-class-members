import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { mv } from "shelljs";

const rootDir = path.join(__dirname, "..");

function publishToRegistry(packageJson: any) {
  console.log(
    `Publishing version: ${packageJson.version} to ${packageJson.publishConfig.registry}`
  );
  execSync("yarn publish", {
    cwd: rootDir,
  });
}

function publishIfBumped() {
  const latestVersion = execSync("yarn info @faire/ts-unused-class-members version")
    .toString()
    .trim();
  const packageLocation = path.resolve(rootDir, "package.json");
  const packageJSON = JSON.parse(fs.readFileSync(packageLocation).toString());

  if (latestVersion.length === 0) {
    console.log("Unable to get latest version");
    return;
  }

  if (packageJSON.version === latestVersion) {
    console.log(`Latest version is already ${packageJSON.version}`);
    return;
  }

  console.log(`Current version is ${packageJSON.version}`);
  console.log(`Latest version is ${latestVersion}`);
  console.log(`Updating docpack to ${packageJSON.version}...`);

  // Regular publish to verdaccio
  publishToRegistry(packageJSON);

  // Publish to GitHub
  // Move the .npmrc so that it isn't picked up during GitHub publish
  mv(".npmrc", ".npmrc-temp");
  const githubRegistryPackageJSON = {
    ...packageJSON,
    publishConfig: {
      ...packageJSON.publishConfig,
      registry: "https://npm.pkg.github.com/"
    }
  }
  publishToRegistry(githubRegistryPackageJSON);
}

publishIfBumped();
