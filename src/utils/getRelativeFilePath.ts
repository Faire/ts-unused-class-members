import { SourceFile } from "ts-morph";

export const getRelativeFilePath = (file: SourceFile) =>
  file.getFilePath().replace(process.cwd(), "").replace(/^\//, "");
