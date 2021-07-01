# ts-unused-class-members

A CLI tool for finding unused class variables and methods in a TypeScript project.

![Screen Shot 2021-07-01 at 2 13 47 PM](https://user-images.githubusercontent.com/10435612/124171469-a1c57300-da76-11eb-9281-97aae3858bbb.png)

<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#usage">Usage</a></li>
      </ul>
    </li>
    <li>
      <a href="#configuration">Configuration</a>
      <ul>
        <li><a href="#configuration-file">Configuration File</a></li>
        <li><a href="#cli-options">CLI Options</a></li>
      </ul>
    </li>
    <li><a href="#ignoring-a-specifc-declaration">Ignoring a Specifc Declaration</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>

## Getting Started

### Prerequisites

`@faire/ts-unused-class-members` is hosted on :octocat:[GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#installing-a-package). To configure npm to download @faire packaes from Git Packages registry you'll need to

1. Create a personal access token with the `read:packages` scope
2. Add the personall access token to ~/.npmrc
```
echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN" >> ~/.npmrc
```
3. Configure npm to download @faire packages from Git Packages registry
```
npm config set @faire:registry https://npm.pkg.github.com
```


### Usage
In the same directory as your `tsconfig.json`, run
```
npx @faire/ts-unused-class-members
```

## Configuration

`ts-unused-class-members` supports both file and CLI configuration.

### Configuration File

`ts-unused-class-members` consumes configuration using [cosmiconfig](https://github.com/davidtheclark/cosmiconfig#cosmiconfig), which supports various config formats.

- a `ts-unused-class-members` property in package.json
- a `ts-unused-class-members.config.js` or `ts-unused-class-members.config.cjs` CommonJS module exporting an object
- a `.ts-unused-class-membersrc` file in JSON or YAML format

Example configuration for a React + Mobx project:

> ts-unused-class-members.config.js
>
> ```js
> module.exports = {
>   ignoreFileRegex: "(?:(\\.d)|(\\.stories)|(\\.test))\\.tsx?$",
>   ignoreMemberNames: [
>     "render",
>     "state",
>     "componentDidMount",
>     "componentWillUnmount",
>     "componentDidCatch",
>     "componentDidUpdate",
>     "shouldComponentUpdate",
>     "UNSAFE_componentWillReceiveProps",
>     "UNSAFE_componentWillUpdate",
>     "UNSAFE_componentWillMount",
>   ],
>   /**
>    * Ignore members decorated by Mobx's @disposeOnUnmount
>    */
>   ignoreDecoratorNames: ["disposeOnUnmount"],
>   /**
>    * Ignore members initialized with Mobx's reaction()
>    * e.g. public myReaction = reaction(...);
>    */
>   ignoreInitializerNames: ["reaction"],
> };
> ```

### CLI Options

Run `ts-unused-class-members` with `--help` to see all avaiable CLI options.

```
Options:
  --project          Path to the project's tsconfig.json                [string]
  --path             Path to a single directory/file to scan            [string]
  --ignoreFileRegex  Regex pattern for excluding files                  [string]
```

These options are optional and you can also set them using a config file.

## Ignoring a Specifc Declaration
You can also tell `ts-unused-class-members` to ignore a specifc class or class member by prefixing its declaration with `// unused-class-members-ignore-next`. 

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

- [ts-morph](https://github.com/dsherret/ts-morph)
- [ts-prune](https://github.com/nadeesha/ts-prune)
