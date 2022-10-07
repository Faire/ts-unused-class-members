import { Project } from "ts-morph";
import { analyze, IOffendingMembers } from "../analyze";
import { getConfig } from "../config";

const getConfigMock = getConfig as jest.Mock;
jest.mock("../config.ts");

describe("analyze", () => {
  interface IResult {
    class: string | undefined;
    member: string | undefined;
    reason: string | undefined;
  }
  const assertResults = (results: IOffendingMembers[], expected: IResult[]) => {
    const received: IResult[] = results.map((entry) => ({
      class: entry.class.getName(),
      member: entry.declaration.getName(),
      reason: entry.reason,
    }));
    expect(received).toEqual(expect.arrayContaining(expected));
    expect(expected).toEqual(expect.arrayContaining(received));
  };

  beforeEach(() => {
    getConfigMock.mockReturnValue({});
  });

  it("should flag offending members", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      "foo.ts",
      `
        class A {
          x = 1,

          fn() {
            return this.x;
          }
        }
        `
    );
    assertResults(analyze(project), [
      {
        class: "A",
        member: "x",
        reason: "should be private",
      },
      {
        class: "A",
        member: "fn",
        reason: "unused",
      },
    ]);
  });

  it("should check references in all files", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      "foo.ts",
      `
      export class A {
       x = 1;
       y = 1;
      }
    `
    );
    project.createSourceFile(
      "bar.ts",
      `
      import { A } from "./foo";
      const { y } = new A();
    `
    );
    assertResults(analyze(project), [
      {
        class: "A",
        member: "x",
        reason: "unused",
      },
    ]);
  });

  it("should not flag used members", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      "foo.ts",
      `
      class A {
        x = 1;
      }
      const a = new A();
      console.log(a.x);
    `
    );
    assertResults(analyze(project), []);
  });

  it("should skip classes that implements an interface", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      "foo.ts",
      `
      interface IA {
        x: number;
      }
      class A implements IA {
        x = 1;
      }
    `
    );
    assertResults(analyze(project), []);
  });

  it("should skip classes that implements an interface", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      "foo.ts",
      `
      interface IA {
        x: number;
      }
      class A implements IA {
        x = 1;
      }
    `
    );
    assertResults(analyze(project), []);
  });

  it("should skip inherited members", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      "foo.ts",
      `
      class GrandParent {
        x = 1;
      }
      class Parent extends GrandParent {
        y = 1;
      }
      console.log(new GrandParent().x, new Parent().y);

      // should ignore x and y
      class Child extends Parent {
        x = 2;
        y = 2;
      }
    `
    );
    assertResults(analyze(project), []);
  });

  it("should respect ignore comment", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      "foo.ts",
      `
      class A {
       x = 1;
       // unused-class-members-ignore-next
       y = 1;
      }
      // unused-class-members-ignore-next
      class B {
        x = 1;
        y = 1;
      }
    `
    );
    assertResults(analyze(project), [
      {
        class: "A",
        member: "x",
        reason: "unused",
      },
    ]);
  });

  it("should respect ignore comment", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      "foo.ts",
      `
      class A {
       x = 1;
       // unused-class-members-ignore-next
       y = 1;
      }
      // unused-class-members-ignore-next
      class B {
        x = 1;
        y = 1;
      }
    `
    );
    assertResults(analyze(project), [
      {
        class: "A",
        member: "x",
        reason: "unused",
      },
    ]);
  });

  it("should only check file/directory specified by config.path", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      "foo/foo1.ts",
      `
      class Foo1 {
       x = 1;
      }
    `
    );
    project.createSourceFile(
      "foo/foo2.ts",
      `
      class Foo2 {
       x = 1;
      }
    `
    );
    project.createSourceFile(
      "bar/bar.ts",
      `
      class Bar {
       x = 1;
      }
    `
    );

    getConfigMock.mockReturnValue({
      path: "foo",
    });
    assertResults(analyze(project), [
      {
        class: "Foo1",
        member: "x",
        reason: "unused",
      },
      {
        class: "Foo2",
        member: "x",
        reason: "unused",
      },
    ]);

    getConfigMock.mockReturnValue({
      path: "foo/foo1.ts",
    });
    assertResults(analyze(project), [
      {
        class: "Foo1",
        member: "x",
        reason: "unused",
      },
    ]);
  });

  it("should respect config.memberWhitelist, config.ignoreMemberNames, and config.ignoreInitializerNames", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      "foo.ts",
      `
      class A {
        x = 1;
        @y
        y = 1;
        z = getZ();
      }
    `
    );

    getConfigMock.mockReturnValue({
      ignoreMemberNames: ["x"],
      ignoreDecoratorNames: ["y"],
      ignoreInitializerNames: ["getZ"],
    });
    assertResults(analyze(project), []);
  });

  it("should not flag properties with the override keyword", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      "Setting.ts",
      `
      export class Setting {
        get value() {
          return "1";
        }

        async assignment() {
          return Promise.resolve();
        }
      }
    `
    );

    project.createSourceFile(
      "OverrideSetting.ts",
      `
      import { Setting } from "./Setting";
      export class OverrideSetting extends Setting {
        override get value() {
          return "1";
        }

        override async assignment() {
          return Promise.resolve();
        }
      }
    `
    );

    project.createSourceFile(
      "use.ts",
      `
      import { OverrideSetting } from "./OverrideSetting";
      const s = new OverrideSetting();
      console.log(s.value);
      console.log(s.assignment());
    `
    );

    assertResults(analyze(project), []);
  });
});
