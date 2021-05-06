import * as t from "ts-morph";
import { getConfig } from "./config";
import { analyze } from "./analyze";
import { fix } from "./fix";
import { CURRENT_SHARD, NUM_SHARDS } from "./consts";
import { printProgress, printResults } from "./print";

const main = async () => {
  if (NUM_SHARDS > 1) {
    console.log(`Shard ${CURRENT_SHARD}/${NUM_SHARDS}`);
  }
  printProgress('Initializing...');

  const config = getConfig();
  const project = new t.Project({
    tsConfigFilePath: config.project,
  });

  const offendingMembers = analyze(project);
  printResults(offendingMembers);

  if (config.fix) {
    printProgress(`Fixing ${offendingMembers.length} members...`);
    await fix(offendingMembers);
  }

  console.log("Done\n");
  process.exit(!config.fix && offendingMembers.length ? 1 : 0);
};

main();
