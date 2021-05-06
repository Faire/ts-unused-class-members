import { IOffendingMembers } from "./analyze";
import { groupBy } from "lodash";
const readline = require('readline');

export const printProgress = (progress: string) => {
  readline.clearLine(process.stdout);
  readline.cursorTo(process.stdout,0);
  process.stdout.write(progress);
};

export const printResults = (results: IOffendingMembers[]) => {
  const groupedByFile = groupBy(results, (entry) => entry.file.getFilePath());

  Object.entries(groupedByFile).forEach(([filePath, results]) => {
    console.log();
    console.log(filePath);

    const groupedByClass = groupBy(results, (entry) => entry.class.getName());

    Object.entries(groupedByClass).forEach(([className, results]) => {
      console.log(className);

      results.forEach(({declaration, reason}) => {
        console.log(`- ${declaration.getName()}: ${reason}`);
      });
    });
  });
  console.log();
};
