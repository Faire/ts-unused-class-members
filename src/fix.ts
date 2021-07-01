import * as t from "ts-morph";
import { IOffendingMembers } from "./analyze";
import { SourceFile } from "ts-morph";

export const fix = (membersToFix: IOffendingMembers[]): Promise<unknown> => {
  const touchedFiles: Set<SourceFile> = new Set();

  membersToFix.forEach(({ file, declaration, reason }) => {
    if (reason === "unused") {
      declaration.remove();
    }
    if (reason === "should be private") {
      declaration.set({ scope: t.Scope.Private });
    }

    touchedFiles.add(file);
  });

  return Promise.all(Array.from(touchedFiles).map((file) => file.save()));
};
