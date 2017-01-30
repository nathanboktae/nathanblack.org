---
title: Angular's module system fails at tracking dependencies properly
tags: angular, front-end, modules
date: 2015-05-15
---

[Angular](https://angularjs.org/), being a framework with a lot of solutions to a problem, forces users to use modules - a very good thing. However, rather than letting users choose their module and package system ([RequireJS](http://requirejs.org/) or [Browserify](http://browserify.org/) or [Webpack](http://webpack.github.io/) for loaders and AMD vs CommonJS vs Harmony for module formats), it brings in it's own module format, without a loader.

Defining a module looks like this

```javascript
var module = angular.module('fruit-stand', ['raspberries', 'strawberries', 'apples'])
// define what the module is or has by calling methods on it
```

it also includes a dependency injection component, because, uh, that's what they use in Java so JavaScript needs one too, because modules can't be scoped or replaced in a dynamic, interpretted language right? Nevermind. Well here's how it works:

<!--more-->

```javascript
angular.module('raspberries').constant([1, 2, 3])
angular.module('strawberries').factory(function() {
  return // anything
})

angular.module('fruit-stand', ['raspberries', 'strawberries', 'apples']).controller(function(raspberries, strawberries, apples, $http, $scope) {
  // extend $scope for what your controller needs
})
```

In `.controller`, it will function scan it and see `raspberries` will match the `raspberries` module and inject what it exports. It turns out angular doesn't correlate or validate that your injections match your declared dependecies! so in a codebase I inherited, I discovered soemthing like this

```javascript
// app.js
angular.module('app', ['some-common-directive', 'some-service', 'some-plugin']).config(['some-common-directive', 'some-service', function() {

}])

// some-common-directive.js
angular.module('some-common-directive').directive(function(some-plugin) { })
```

There was some unused dependency in `app.js` (`some-plugin`) so I removed it. Turns out it broke the app because `some-common-directive` used it, but because you just throw all the scripts in the page, eventually someone else required it, so it could use it too without declaring it! Now I have no assurance that what my module declares as a depdencency is accurate at all - the main goal of a module system.

Compare this with the simple, straight-forward AMD, CJS, or Harmony formats:

```javascript
// AMD
define(['raspberries', 'strawberries', 'apples'], function(raspberries, strawberries, apples) {

})

// CJS
var raspberries = require('raspberries')

// ES6 / Harmony
import raspberries
```

What you ask for is given to you in a local variable or parameter. Didn't ask for it? it's not there. TypeError and you blow up. Not surprizing as the answer is usually to [just use a function](http://blog.cleancoder.com/uncle-bob/2014/11/24/FPvsOO.html).