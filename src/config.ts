import { cosmiconfigSync } from "cosmiconfig";
import yargs from "yargs";

interface ICliConfig {
  project: string;
  fix?: boolean | undefined;
  path?: string;
  ignoreFileRegex?: string;
  ignoreCouldBePrivate?: boolean | undefined;
}

interface IConfig extends ICliConfig {
  ignoreMemberNames?: string[];
  ignoreDecoratorNames?: string[];
  ignoreInitializerNames?: string[];
}

const defaultConfig: IConfig = {
  project: "tsconfig.json",
};

const cliConfig = yargs(process.argv.slice(2))
  .options({
    project: {
      type: "string",
      describe: "Path to the project's tsconfig.json",
    },
    fix: { type: "boolean", describe: "Auto fix offending members" },
    path: {
      type: "string",
      describe: "Path to a single directory/file to scan",
    },
    ignoreFileRegex: {
      type: "string",
      describe: "Regex pattern for excluding files",
    },
    ignoreCouldBePrivate: {
      type: "boolean",
      describe: "Don't report members that are public but could be private",
    }
  })
  .hide("fix")
  .help().argv;

const fileConfig =
  cosmiconfigSync("ts-unused-class-members").search()?.config ?? {};

const config: IConfig = {
  ...defaultConfig,
  ...(fileConfig as ICliConfig),
  ...(cliConfig as Partial<ICliConfig>),
};

export const getConfig = () => config;
