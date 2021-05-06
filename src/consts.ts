export const IGNORE_COMMENT = "unused-members-ignore-next";

export const NUM_SHARDS = (process.env.NUM_UNUSED_MEMBERS_CHECKERS ??
  1) as number;
export const CURRENT_SHARD = (process.env.UNUSED_MEMBERS_CHECKER ??
  1) as number;
