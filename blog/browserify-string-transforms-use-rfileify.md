---
title: "Browserify string transforms: Use rfileify"
tags: browserify, front-end, npm, dependencies
date: 2014-06-01
---

I started to use [browserify](http://browserify.org/) for the first time day. It is quite slick - Just `npm install` something then `require` it up, with a lot less wiring up needed than using AMD. However adding a forced build step is not fun and I think would really be a killer on a big project.

So I began to look for a transform so I could include templates as I needed to bundle everything into one script. How hard can it be to basically do `"module.exports = " + JSON.stringify(fileContents)` ? Well after a couple hours of searching and trying 3 modules, the 4th one worked.

- [stringify](https://github.com/JohnPostlethwait/stringify) (no tests at all for this project)
- [browserify-string](https://github.com/eugeneware/browserify-string) (tests but no CI)
- [string-to-jsify](https://github.com/pluma/string-to-jsify) (test and CI but not for the console use case, the 95% one)
- [rfileify](https://github.com/ForbesLindesay/rfileify) (tests, CI, and mentioned from [browserify-transform-tools](https://github.com/benbria/browserify-transform-tools))

Rfileify does other transforms too, but just not the SEO rank, so hopefully I can help that.
<!--more--> 
