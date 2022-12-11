import * as t from "ts-morph";
import { hashCode } from "./utils/hashCode";
import { getConfig } from "./config";
import { CURRENT_SHARD, IGNORE_COMMENT, NUM_SHARDS } from "./consts";
import { printProgress } from "./print";
import { getRelativeFilePath } from "./utils/getRelativeFilePath";

type MemberDeclaration = t.MethodDeclaration | t.ClassInstancePropertyTypes;
export interface IOffendingMembers {
  file: t.SourceFile;
  class: t.ClassDeclaration;
  declaration: MemberDeclaration;
  reason: "unused" | "should be private";
}

/**
 * Get the name of the property initializer, if it has one.
 * For example: fetchReaction = reaction(...) -> reaction
 */
const getInitializerName = (
  declaration: MemberDeclaration
): string | undefined => {
  if (t.Node.isPropertyDeclaration(declaration)) {
    const initializer = declaration.getInitializer()?.getFirstChild();
    if (t.Node.isIdentifier(initializer)) {
      return (initializer.compilerNode as any)?.escapedText;
    }
  }
  return undefined;
};

/**
 * Whether the declaration line is prefixed with
 * //unused-members-ignore-next.
 */
const hasIgnoreComment = (
  declaration: t.ClassDeclaration | MemberDeclaration
): boolean => {
  return !!declaration
    .getLeadingCommentRanges()
    .slice(-1)[0]
    ?.getText()
    .includes(IGNORE_COMMENT);
};

/**
 * Used for splitting up the work across multiple CI jobs.
 * We don't process the file unless this returns true.
 */
const isFileInShard = (file: t.SourceFile): boolean => {
  return (
    Math.abs(hashCode(file.getFilePath()) % NUM_SHARDS) === CURRENT_SHARD - 1
  );
};

/**
 * Whether we should skip a file
 */
const shouldIgnoreFile = (file: t.SourceFile): boolean => {
  const config = getConfig();

  if (!isFileInShard(file)) {
    return true;
  }
  if (config.ignoreFileRegex) {
    return RegExp(config.ignoreFileRegex).test(file.getFilePath());
  }
  return false;
};

/**
 * Whether we should skip a class
 */
const shouldIgnoreClass = (declaration: t.ClassDeclaration): boolean => {
  return (
    hasIgnoreComment(declaration) ||
    declaration.isAbstract() ||
    // Need to figure out how scan/fix a class that implements an interface.
    // Skipping for now.
    !!declaration.getImplements().length
  );
};

/**
 * Whether we should skip a class member
 */
const shouldIgnoreMember = (declaration: MemberDeclaration): boolean => {
  const config = getConfig();

  if (hasIgnoreComment(declaration)) {
    return true;
  }

  if (
    declaration.hasModifier(t.SyntaxKind.AbstractKeyword) ||
    declaration.hasModifier(t.SyntaxKind.ProtectedKeyword)
  ) {
    return true;
  }

  const initializerName = getInitializerName(declaration);
  if (
    initializerName &&
    config.ignoreInitializerNames?.includes(initializerName)
  ) {
    return true;
  }

  if (config.ignoreMemberNames?.includes(declaration.getName())) {
    return true;
  }

  return declaration
    .getDecorators()
    .some((decorator) =>
      config.ignoreDecoratorNames?.includes(decorator.getFullName())
    );
};

/**
 * Returns true if referencingNode lives outside of classDeclaration.
 * This helps us determine whether the class member can be marked as private.
 */
const isOutsideClass = (
  referencingNode: t.Node,
  classDeclaration: t.ClassDeclaration
) => {
  if (
    referencingNode.getSourceFile().getFilePath() !==
    classDeclaration.getSourceFile().getFilePath()
  ) {
    // not in the same file
    return true;
  }

  // find the first parent that's a class declaration
  const referencingFromClass = referencingNode.getParentWhile((_, node) => {
    return !t.Node.isClassDeclaration(node) && !!node;
  });

  // same file but different class?
  return (
    (referencingFromClass?.compilerNode as any)?.name?.escapedText !==
    classDeclaration.getName()
  );
};

/**
 * Return the names of all the members from all the extended classes.
 */
const getInheritedMemberNames = (
  classDeclaration: t.ClassDeclaration
): Set<string> => {
  const results = new Set<string>();
  let baseClass = classDeclaration.getBaseClass();
  while (baseClass && !baseClass.getSourceFile().isFromExternalLibrary()) {
    [
      ...baseClass.getInstanceMethods(),
      ...baseClass.getInstanceProperties(),
    ].forEach((declaration) => results.add(declaration.getName()));
    baseClass = baseClass.getBaseClass();
  }
  return results;
};

export const analyze = (project: t.Project): IOffendingMembers[] => {
  const config = getConfig();

  let pattern = config.path ?? ".";
  if (!/(?:\.tsx?)/.test(pattern)) {
    // is directory path
    pattern += pattern.endsWith("/") ? "" : "/";
    pattern += `**/*{.tsx,.ts}`;
  }

  const files = project
    .getSourceFiles(pattern)
    .filter((file) => !shouldIgnoreFile(file));

  console.log(`Checking ${files.length} files...`);

  const offendingMembers: IOffendingMembers[] = [];

  let fileCounter = 0;
  for (const file of files) {
    printProgress(
      `${++fileCounter}/${files.length} ${getRelativeFilePath(file)}`
    );

    const classes = file.getClasses();

    for (const classDeclaration of classes) {
      if (shouldIgnoreClass(classDeclaration)) {
        continue;
      }

      // Filter out inherited members. We shouldn't modify them because they must
      // match the base class.
      const inheritedMemberNames = getInheritedMemberNames(classDeclaration);
      const ownMembers = [
        ...classDeclaration.getInstanceMethods(),
        ...classDeclaration.getInstanceProperties(),
      ].filter((member) => !inheritedMemberNames.has(member.getName()));

      for (const member of ownMembers) {
        if (shouldIgnoreMember(member)) {
          continue;
        }

        const referencingNodes = member.findReferencesAsNodes();
        if (!referencingNodes.length) {
          offendingMembers.push({
            file: file,
            class: classDeclaration,
            declaration: member,
            reason: "unused",
          });
          continue;
        }

        // At this point, we knew the member is referenced somewhere, so if
        // it's already private then there's nothing to do here.
        if (
          member.getScope() === t.Scope.Private ||
          config.ignoreCouldBePrivate
        ) {
          continue;
        }

        const hasExternalReferences = referencingNodes.some((node) =>
          isOutsideClass(node, classDeclaration)
        );
        if (!hasExternalReferences) {
          offendingMembers.push({
            file: file,
            class: classDeclaration,
            declaration: member,
            reason: "should be private",
          });
        }
      }
    }
  }
  printProgress(`Offending members found: ${offendingMembers.length}\n`);
  return offendingMembers;
};
