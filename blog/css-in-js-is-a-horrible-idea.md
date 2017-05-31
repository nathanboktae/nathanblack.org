---
title: CSS in JavaScript is a horrible idea
tags: css, react, front-end
date: 2017-03-10
draft: true
---

There is a lot of buzz around CSS in JS these days as Facebook champions it for React. There are some fundamental problems with this I would like to address.

Why were cascading style sheets created? Before them, all styles were inline. Remember when we had to write `<table bgcolor="#ffde09">...` and such? What happened when you wanted to change all your text colors? You had to find all the references manually and change them! A global file search and replace wasn't good enough as maybe this black was for a border instead of text... it was a nightmare.

Enter CSS. Now you could declare your text, fonts, margins and borders with a default global setting, and override them in specific circumstances as needed. *It's about design, not code*.

### Design and Users love consistency

Good UX and design love consistency. Users get confused if a primary CTA button looks different on this page or component. Globals are good in design. They are not in code.

### Styling and functionality are separate concerns

How a page or component looks and operates is wholly separate from how it functions. Your table grid shouldn't care about the font face, background, or cell spacing it has. It should care about how it wires up data and renders the contents, and providing a useful API. With clean, sematic HTML the user's existing design will simply *cascade* and inherit styles.

### CSS is a layout rules engine, not code

Many of the good software design principles don't apply to CSS because it's not code, but a layout engine. With a good DSL (see the next point) you can blend extra principles like composibility and refactoring in, but there is no high order functions, dependecy injection, visitor pattern, etc stuff to apply.

### Mature CSS Processors have been addressing limitations in CSS for years

We've had many successful years of using SASS, LESS, Stylus, and the new kid PostCSS. These great robust DSLs have many features and plugins to address whatever need the CSS-in-JS community thinks can't be solved. Let's [go through them](https://speakerdeck.com/vjeux/react-css-in-js)

1. *Global Namespace* I addressed why good for design and UX previously.
2. *Dependencies*. Webpack users have been able to `require()` CSS dependencies and [bundle them together](https://webpack.github.io/docs/stylesheets.html) for a long time.
3. *Dead Code Elimination* Webpack 2 [supports tree shaking]() to elmitate dead CSS dependencies at the component level. Andy Osami shows how you can [remove unused rules and add it to you build system](https://addyosmani.com/blog/removing-unused-css/). The Chrome dev tools feature an [Audit tab](http://meeech.amihod.com/very-useful-find-unused-css-rules-with-google/) that can reveal unused rules.
4. *Minification* [cssmin]() has been around for years. Combined with gzip, HTTP2, and CDN caching, this is no reason at all to flip the table on everything. Performance is an ongoing arms race that [react is already loosing](http://stefankrause.net/js-frameworks-benchmark4/webdriver-ts/table.html).
5. *Sharing Constants* I've always created a `definitions.styl` that contained all my variables and mixins, and included it at every script. Very trivial.
6. *Non-deterministic Resolution* Pure FUD. CSS Specificity is very deterministic. A great analogy to learn this was to [compare it to poker](https://www.smashingmagazine.com/2007/07/css-specificity-things-you-should-know/).
7. *Isolation*. You can organize your stylesheets however you like and use `import` in CSS and `require()` from JavaScript via Webpack / browserify. Also putitng styling concerns in JavaScript creates higher coupling and *reduces* isolation.

### You still need to learn CSS

> When I'm saying at scale, it means a codebase with hundreds of developers comming code everyday where most of them are not front-end developers

### Fighting against web standards is a loosing battle

