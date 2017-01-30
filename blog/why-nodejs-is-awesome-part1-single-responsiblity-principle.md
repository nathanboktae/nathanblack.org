---
title: "Why node.js is Awesome, Part 1: The Single Responsibility Principle"
tags: nodejs, single-responsiblity,
date: 2014-04-04
---

My favorite thing about node.js and the npm community is something that can't easily be put on a spec sheet. It's adherance to the [single responsiblity principle](http://en.wikipedia.org/wiki/Single_responsibility_principle).

Take a look at some of the [most depnended on npm modules](https://www.npmjs.org/) - they're often very small, like [mkdirp](https://www.npmjs.org/package/mkdirp), which is simply `mkdir -p` in node. [glob](https://www.npmjs.org/package/glob) matches files like a shell does. [node-uuid](https://www.npmjs.org/package/node-uuid) just generates UUIDs.

Is there a bug in the module? The module is small enough and tested well that you can dive in and help out, and send the bug fix as a pull request on GitHub. Don't like the design of the module your using, or development died out? Swap it out with a different module, and wire it up to your [loosely coupled](http://en.wikipedia.org/wiki/Loose_coupling) system.

This is definately a change in culture, as though I didn't use Rails much, but that community likes it's big frameworks that do a lot of magic. Which is nice until you disagree with an aspect of that magic, or need to tweak it or swap it out with something else for this one scenario.

A great [coworker](https://twitter.com/jonsequitur) of mine once told me "The key to complexity is composition", which I have experienced to be true.
<!--more-->
