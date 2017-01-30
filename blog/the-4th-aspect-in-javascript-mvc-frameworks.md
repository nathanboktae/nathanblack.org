---
title: The 4th aspect in JavaScript MVC frameworks
tags: mvc, front-end, knockout, angular, ember,
date: 2014-04-27
---

Of the many JavaScript frameworks out there, they all have one core priciple - to structure your code in a [Model-View-Whatever](http://blog.stevensanderson.com/2012/08/01/rich-javascript-applications-the-seven-frameworks-throne-of-js-2012/) style:

- Model: Your data as an object
- Controller/ViewModel/Presenter/Whatever: the business logic of your app
- View: The HTML templates for your app

 But after using a few (Knockout, Angular, Ember, and Backbone) I've noticed there's a forth component. It's the widgety type of logic - logic that isn't about your business, but extents the browser functionality - that cool datepicker, color picker, an awesome visualization with D3, maybe a 3D flip switch intstead of a checkbox. That stuff that is a DMZ to the DOM - Knockout's `bindingHandler`s, Angular's directives, and Handlebar helpers. They aren't about how you map your view model / controller to the DOM, but about extending the functionality of the DOM.

 Why call this out? Well frameworks don't exactly agree on this terminology. With Knockout and Angular, the view is HTML, as they use DOM-based templating. In Ember, Backbone, and other string-based templating languages, they often refer to the view as a piece of JavaScript, and templating is separate. Really the template should be called the view in their world, and the view is this 4th aspect, the widget aspect. Knockout and Angular have their bindingHandlers / directives that extend their templating functionality, which are much more analogous to Ember/Backbone/Batman/etc views.

 Why is this important? Keeping selector strings out of your controllers and view models is vital for the separation of concerns and tesability. Keeping this 4th aspect as the DMZ to the DOM helps to separate these concerns. Say you do have a complicated problem to solve in your app, and you come up with a cool way to visuallize it. You could put it all in one module... but now what happens when you release it and users don't like that widget and they want something more traditional? It will be harder to pull it out. Or the opposite where that widget is really awesome and you want to use it elsewhere... now lots of work to pull the business logic out. Let those two evolve independently and they grow and improve much more rapidly.
<!--more-->
