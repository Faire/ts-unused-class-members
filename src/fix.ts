import * as t from "ts-morph";
import { IOffendingMembers } from "./analyze";

export const fix = (membersToFix: IOffendingMembers[]): Promise<unknown> => {
  const savePromises: Promise<void>[] = [];
  membersToFix.forEach(({ file, declaration, reason }) => {
    if (reason === "unused") {
      declaration.remove();
    }
    if (reason === "should be private") {
      declaration.set({ scope: t.Scope.Private });
    }

    savePromises.push(file.save());
  });

  return Promise.all(savePromises);
};
