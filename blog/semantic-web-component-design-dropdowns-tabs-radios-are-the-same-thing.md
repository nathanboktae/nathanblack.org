---
title: "Semantic Web Component Design: Radios, dropdowns, and tabs are the same thing"
tags: front-end, semantic-html, web-components, angular, knockout
date: 2016-12-10
---

Early on in the rewrite of [Appuri's](https://www.appuri.com/) portal that we started on after having a designer and development team from the MVP, and in our transition from Angular to Knockout, I was looking around at different widget / web component libraries and what I could leverage that would fit the designer's use cases and style, as well as a clean design.

One thing that always drove me nuts about our previous UI was a mismash of different components doing the same thing. We had [ui-select2](https://github.com/angular-ui/ui-select2), [ui-select](http://angular-ui.github.io/ui-select/) from the Angular UI team, [angular-multi-select](https://github.com/isteven/angular-multi-select) for some multiselect cases, and a custom directive for radio-like toggle boxes.

Each control offered some little feature that another didn't (except `ui-select2` which was just in code we didn't get around to refactoring yet). Why is this? All of them are trying to do the same thing on a higher semantic level: The user needs to pick an one (or more) options from this fixed set of options. How that looks is a styling concern.
<!--more-->

Between those design goals and a darth of knockout components, I created [knockout-choose](https://github.com/nathanboktae/knockout-choose). Some goals included:

- *Modern Web Component design* using custom tags so that markup stayed in markup.
- *Semantic markup and API* so that any "choose one or more from many" scenario could be addressed.
- *Well tested with hosted CI* as how can you ask someone to take a production dependency on your component without them?

At the bottom of the [knockout-choose demo page](https://nathanboktae.github.io/knockout-choose) is the example of one chooser changing the styling of the other by simply applying a different class. To be even more semantic, you could put these rules in a mixin in your CSS preprocessor. Now if the design changes, your code and tests stay the same! Hooray for separation of concerns!

I hope that others design components along semantic usage so they are easy and flexible to use, regardless of framework, if any. [Pikaday](http://dbushell.github.io/Pikaday/) is a great example of this and a great date picker - I highly recommend.