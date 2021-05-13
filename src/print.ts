import { IOffendingMembers } from "./analyze";
import { groupBy } from "lodash";
import { getRelativeFilePath } from "./utils/getRelativeFilePath";
const readline = require("readline");

export const printProgress = (progress: string) => {
  if (process.stdout.isTTY) {
    readline.clearLine(process.stdout);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(progress);
  }
};

export const printResults = (results: IOffendingMembers[]) => {
  const logRed = (str: string) => console.log("\x1b[31m%s\x1b[0m", str);

  const groupedByFile = groupBy(results, (entry) =>
    getRelativeFilePath(entry.file)
  );

  Object.entries(groupedByFile).forEach(([filePath, results]) => {
    console.log();
    logRed(filePath);

    const groupedByClass = groupBy(results, (entry) => entry.class.getName());

    Object.entries(groupedByClass).forEach(([className, results]) => {
      logRed(className);

      results.forEach(({ declaration, reason }) => {
        logRed(`- ${declaration.getName()}: ${reason}`);
      });
    });

    if (results.length) {
      console.log();
    }
  });
};
