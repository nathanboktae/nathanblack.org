---
title: "Why node.js is Awesome, Part 2: Package and Dependency Management"
tags: nodejs, npm, dependencies
date: 2014-05-28
---

At the core of node is npm, the node package manager (which apparently [npm doesn't stand for that](https://www.npmjs.org/doc/faq.html#If-npm-is-an-acronym-why-is-it-never-capitalized)). Having dependencies managed by a package system is huge. In Java and .NET, package managers have been added after the fact, if they are used at all. Often people end up checking in binaries that then makes the repository huge with information not pertinent to your product, which also results in binary merge conflicts. How do those get organized? A legacy codebase I work on has them scattered throughout 3 different locations, not to mention naming styles.

Npm standardizes this by having all the dependencies in a folder named node_modules [which cannot be renamed](https://www.npmjs.org/doc/faq.html#node_modules-is-the-name-of-my-deity-s-arch-rival-and-a-Forbidden-Word-in-my-religion-Can-I-configure-npm-to-use-a-different-folder) and a package.json that must be comformant too, which then node understands when you `require` something. No need to set classpaths or hint paths correctly. 

This also heavily pushes people to have all their dependies locally. Its still possible to have a global module installed and require it without declaring it in your package.json (Maybe there is a way to prevent this via static analysis?) You can end up pulling assemblies from the GAC in .NET too, but still so many packages aren't installable via NuGet (I'm looking at you Azure SDK, which of course the Azure SDK for Node.js installs via npm) which means every developer and the build server(s) better have the same versions installed or someone will be wasting time getting stuff to build.

Dependencies are also a tree structure, not a graph. If two modules depend on the same module, they each get their own copy, so they can have their own versions. This is great given [prototypical inheritance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain). If you want to be strict about the type of object you are working with, `instanceof` will only be true if your version of the module created the object, not another version , due to the constructor functions not being a reference to the same object. If you want to be lenient, you can always duck type it.

Statically typed languages have a graph of dependencies, and if A and B depend on different versions of C, pain will ensue. I gave seen .NET developers waste hours tracking down mismatching versions of dependencies, even with the help of assembly binding redirects. I don't think Java has any answer for this.
<!--more-->
