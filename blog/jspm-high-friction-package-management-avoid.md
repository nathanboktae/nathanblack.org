---
title: "jspm and systemjs: High friction package managment"
tags: jspm, systemjs, front-end, package managers, modules
date: 2015-07-11
---

We have a decent-sized Angular codebase here at [Appuri](http://www.appuri.com/) that I want to replace with real module system that will allow for a gradual move away from Angular. A friend recently pointed me to [jspm](http://jspm.io/) and [systemjs](https://github.com/systemjs/systemjs). The goal and direction is sound - load any module format (AMD, CommonJS, Harmony/ES6) and be registry-agnostic (npm or GitHub is out of the box with registry plugins, namely for bower). Unlike bower, since the loader and the package manager work together, it maintains the mapping of modules that normally you do manually in [the `map` and `paths` sections of your RequireJS main](http://requirejs.org/docs/api.html#config). It also has a builder, so you can work in a mode that loads files individually, or bundle them up together for production, with source maps and minifcation. It also supports ES6 compiling to ES5 (or "transpiling" [if you don't fully understand what compiling is](https://twitter.com/mraleph/status/471756991527124993)), so it is very future-standards focused. It's a superset of what I want from RequireJS, so I was excited and dove in.

Three days in, I'm ready to throw in the towel as [I can't get SystemJS builder to work](https://github.com/systemjs/builder/issues/223). There are bigger issues too.

1.  ## Bower should be a first class registry
    So jspm is registry agnostic, and it's registry providers built in are npm and GitHub. Why a GitHub provder instead of bower? It's so similar to bower, yet lacking too. They are both git based (well except these muts be in GitHub, damn your priviate or alternate git repo). It also ignores dependencies in the bower.json - which basically defeats the purpose of the package manager as you are now left to dealing with the dependecies yourself, manually editing your `config.js` - the thing that it's supposed to manage for you.

    I started out simply using `jspm install angular`. Worked fine. Then trying to install angular plugins, they weren't in the registry. so I did them mangually via `jspm install github:somedude/angular-plugin`. However they would often just have a bower.json, so the dependency on angular wasn't declared. It was worse as I did `angular-chart`, which depends on `c3`, which then depends on `d3`.

    Ugh. So I install [jspm-bower-endpoint](https://www.npmjs.com/package/jspm-bower-endpoint) and run `jspm install bower:angular-chart`. cool.... wait, it depends on `bower:angular`, but I already have `github:angular` installed from the jspm registry... Ugh. `jspm uninstall` ALL the jspm packages and just use the bower registry, otherwise unless the jspm registry is 100% complete, you'll just have a mess to manually maintain. The same is true if you mixed and matched `npm` with `bower`, unless the dependencies didn't cross. BTW, you still need to have a `package.json` to get `jspm` down anyways.... so you have 2 package maangers. Actually, 2 package managers and a package manager registry wrapper.

2.  ## Automatic module detection really does not work
<!--more--> 
    So once I had everything installed via bower, I thought I'd be set. However, system.js tries to detect what the module format is, but it often gets this wrong as people do incosistent module dances to adapt to various modules. E.g. a common thing is to detect AMD and register with AMD, or detect CommonJS and use that, then fallback to global. Well `define` and `define.amd` won't be there unless you specifically specify the format to be AMD, so even though alot of packages support AMD, they weren't loading as AMDs, unless I specifically set the `meta: { format: "amd" }`

3.  ## Modules only export one file, but in reality have many
    A very common scenario is to get a widget that has both JavaScript and CSS components, maybe with some templates, or additional theme CSS. Bower is at fault here too, as both `bower.json` and `package.json` have a `main` that is a single string, so you only get one item to export. Additional requirements need to be added by hand. This took an hour or too to port from the `gruntfile`.

4. ## Semantic Version ranges are not possible
    Packages are saved to disk in the format `jspm_packages/<registry>/<package>@<version>/`. While you can install them with your favorite semver flags like `^2.1.0`, `~3.4.2`, etc, they will be resolved and written to disk and `config.js` with the specific version. So if you do want to take patch updates without thinking about it, too bad. Conversely, Bower supports this well.

5.  ## Full package name must be specified in `meta`
    Given the above points, we'll be manually editing our `config.js` alot, so it'd be nice just to go 
    
    ```javascript
    {
      meta: {
        angular: {
          deps: ['jquery']
        }
      }
    }
    ```
    
    as `angular` is mapped in `paths` to be whatever specific registry and version it is you chose it, but nope. It has to be the fully qualified name
    
    ```javascript
    {
      meta: {
        'bower:angular@1.3.2': {
          deps: ['jquery']
        }
      }
    }
    ```
    
    and when you upgrade it, of course you get to manually update it. Don't forget or your app will break.

    6.  ## SystemJS builder is buggy and broken
    Simply trying `var builder = new Builder()` [blew up in gulp](https://github.com/systemjs/builder/issues/225#issuecomment-120553357), not to mention `baseURL` that worked in the browser [had to be transformed to work in both node and the browser](https://github.com/systemjs/builder/issues/224#issuecomment-120551438). But I still can't even [get paths to match properly](https://github.com/systemjs/builder/issues/223) which is a blocker for me. I didn't have to do this with RequireJS on a previous project.

## Conclusion

With so many package managers and registries out there now, as much as I like to goals and ambitions, is just causing more confusion and hurt given the many other package management and module systems ([RequireJS](http://requirejs.org/), [Browserify](http://browserify.org/), [Webpack](http://webpack.github.io/), [ComponentJS](http://componentjs.com/features.html), [StealJS](http://stealjs.com/docs/StealJS.why.html)). rather than working with Bower and RequireJS teams or building on their work, it [forks and diverges the community](https://xkcd.com/927/).
