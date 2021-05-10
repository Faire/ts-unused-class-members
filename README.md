# ts-unused-class-members

A CLI tool for finding unused class variables and methods in a typescript project.

<img width="812" alt="Screen Shot 2021-05-09 at 10 28 58 PM" src="https://user-images.githubusercontent.com/10435612/117598513-cf3c1300-b0fc-11eb-80d5-1ec4cba1e178.png">

## Getting Started

### Prerequisites
`@faire/ts-unused-class-members` is hosted on [GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#installing-a-package). You can use the command below to configure npm to download `@faire` packages from GitHub Packages.

```
npm config set @faire:registry https://npm.pkg.github.com
```

Alternatively, you could also create or edit an `~/.npmrc` or `PROJECT_ROOT/.npmrc` file to include this line:

```
@faire:registry=https://npm.pkg.github.com
```

### Installation & Usage
#### Globally
```
npm i @faire/ts-unused-class-members -g
ts-unused-class-members
```

#### Locally - npm
```
npm i @faire/ts-unused-class-members
./node_modules/.bin/ts-unused-class-members
```

#### Locally - yarn
```
yarn add @faire/ts-unused-class-members
yarn ts-unused-class-members
```

Or install + execute it with npx:

```
npx @faire/ts-unused-class-members
```

## Configuration
`ts-unused-class-members` supports both CLI and file configuration.

### Configuration File
`ts-unused-class-members` consumes configuration using [cosmiconfig](https://github.com/davidtheclark/cosmiconfig#cosmiconfig), which supports various config formats including:
- a `ts-unused-class-members` property in package.json
- a `ts-unused-class-members.config.js` or `ts-unused-class-members.config.cjs` CommonJS module exporting an object
- a `.ts-unused-class-membersrc` file in JSON or YAML format


Example configuration for a React + Mobx project:
> ts-unused-class-members.config.js
> ```js
> module.exports = {
>  ignoreFileRegex: "(?:(\\.d)|(\\.stories)|(\\.test))\\.tsx?$",
>  ignoreMemberNames: [
>    "render",
>    "state",
>    "componentDidMount",
>    "componentWillUnmount",
>    "componentDidCatch",
>    "componentDidUpdate",
>    "shouldComponentUpdate",
>    "UNSAFE_componentWillReceiveProps",
>    "UNSAFE_componentWillUpdate",
>    "UNSAFE_componentWillMount",
>  ],
>  /**
>   * Ignore members decorated by @disposeOnUnmount
>   */
>  ignoreDecoratorNames: ["disposeOnUnmount"],
>  /**
>   * Ignore members initialized with `reaction`
>   * e.g. public myReaction = reaction(...)
>   */
>  ignoreInitializerNames: ["reaction"]
>};
> ```  

### CLI Options
Some options can be set via CLI arguments. Run `ts-unused-class-members` with `--help` to see all avaiable CLI options.
```
Options:
  --project          Path to the project's tsconfig.json                [string]
  --fix              Auto fix offending members                        [boolean]
  --path             Path to a single directory/file to scan            [string]
  --ignoreFileRegex  Regex pattern for excluding files                  [string]
```
These options are all optional and can be set in a configuration file.

## Ignoring
`ts-unused-class-members` can be configured to ignore certain class members using `ignoreMemberNames`, `ignoreDecoratorNames`, and `ignoreInitializerNames` (see example above). You can also tell it to ignore certain files using `ignoreFileRegex`.

To ignore a specific class member or class, comment the declaration line with `// unused-class-members-ignore-next`.
```js
// unused-class-members-ignore-next
class Unused {
  ...
}

class A {
  // unused-class-members-ignore-next
  unused = undefined;
  ...
}
```


## Acknowledgements
- [ts-morph](https://github.com/dsherret/ts-morph): amazing library for navigating/manipulating Typescript AST
- [ts-prune](https://github.com/nadeesha/ts-prune): powerful CLI tool for finding unused exports in a Typescript project
