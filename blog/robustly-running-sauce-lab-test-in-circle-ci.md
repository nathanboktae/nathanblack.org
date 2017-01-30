---
title: A fast and robust way to run Sauce Labs tests in Circle CI
tags: continuous-integration, testing, front-end, sauce-labs, circle-ci
date: 2015-09-17
---

We've been using [Circle CI](https://circleci.com) at [Appuri](http://www.appuri.com) for many months now and have been very happy with it. It's very simple and has a great breadth of features, namely the ability to SSH into a build to diagnose it when things get really tricky, as well as docker build services, slack integration, and lots of built-in services. After I hit a wall with [PhantomJS](http://phantomjs.org), and needing to run our tests on multiple browsers anyways, it was time to integrate [Sauce Labs]() to do our browser testing, which I've had great experience with on [many](https://github.com/nathanboktae/cherrytree-for-knockout) [open source](https://github.com/nathanboktae/frypan-knockout-grid) [projects](https://github.com/nathanboktae/knockout-choose). In those projects I used [grunt-saucelabs](https://github.com/axemclion/grunt-saucelabs) as I am not a big fan of Karma as I like to control the HTML page the tests run on as well as the simplicity of [mocha-phantomjs](https://github.com/nathanboktae/mocha-phantomjs) and just refreshing a flat file or using [browser sync](http://www.browsersync.io/).

However we're using [gulp](http://gulpjs.com/) and I didn't want to pull in [grunt](http://gruntjs.com/) and have two build systems. Unfortunately there's no `gulp-saucelabs`, which I contemplated doing (I may sometime), but I found I could simply use [mocha-cloud](https://github.com/nathanboktae/mocha-cloud). However, it didn't bring up the tunnel.

<!--more-->

Circle has some [brief documentation](https://circleci.com/docs/browser-testing-with-sauce-labs) on how to connect the tunnel - they don't include [Sauce Connect](http://saucelabs.com/connect) so you have to `wget` it yourself every time. No problem. However looking at the test section:

```
test:
  override:
    - cd sc-*-linux && ./bin/sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY:
        background: true
    - python -m hello.hello_app:
        background: true
    - sleep 60
    - nosetests
```

Whoa did you see that? A one minute sleep! Yikes! The sauce labs tunnel does take some time to setup, usually 20-30 seconds in my experience. Random sleeps are the worst for stable builds.... There must be a better way, and there is.

First off, even though they recommend getting the binary in the post dependencies section, they don't start the tunnel right away, even though it's running in the background. Start that sucker ASAP!

```yaml
dependencies:
  pre:
    - wget https://saucelabs.com/downloads/sc-latest-linux.tar.gz
    - tar -xzf sc-latest-linux.tar.gz
    - cd sc-*-linux && ./bin/sc:
        background: true
```

Now the tunnel is connecting while you fetch your code from github and pull down your npm, python, go, whatever dependant packages. 

When creating the tunnel, they say to wait for "you may start your tests" before starting tests. We could tail the output and check for that string, but I noticed something right before it

```
17 Sep 21:59:44 - Starting up; pid 7002
17 Sep 21:59:44 - Command line arguments: sc
17 Sep 21:59:44 - Using no proxy for connecting to Sauce Labs REST API.
17 Sep 21:59:44 - Resolving saucelabs.com to 162.222.73.28 took 37 ms.
17 Sep 21:59:44 - Started scproxy on port 59124.
17 Sep 21:59:44 - Please wait for 'you may start your tests' to start your tests.
17 Sep 21:59:44 - Starting secure remote tunnel VM...
17 Sep 21:59:52 - Secure remote tunnel VM provisioned.
17 Sep 21:59:52 - Tunnel ID: xxxxxxx
17 Sep 21:59:53 - Secure remote tunnel VM is now: booting
17 Sep 21:59:58 - Secure remote tunnel VM is now: running
17 Sep 21:59:58 - Remote tunnel host is: makiXXXXX.miso.saucelabs.com
17 Sep 21:59:58 - Using no proxy for connecting to tunnel VM.
17 Sep 21:59:58 - Resolving makiXXXXX.miso.saucelabs.com to 162.222.77.201 took 53 ms.
17 Sep 21:59:58 - Starting Selenium listener...
17 Sep 21:59:58 - Establishing secure TLS connection to tunnel...
17 Sep 21:59:58 - Selenium listener started on port 4445.
17 Sep 21:59:59 - Sauce Connect is up, you may start your tests.
```

It listens to port `4445` right before you can start the tests. Turns out we can poll for that port being listened on, then we start our tests!

```yaml
dependencies:
  pre:
    - wget https://saucelabs.com/downloads/sc-latest-linux.tar.gz
    - tar -xzf sc-latest-linux.tar.gz
    - cd sc-*-linux && ./bin/sc:
        background: true

test:
  pre:
    - "while ! lsof -i:4445 -t; do sleep 3; done"
```

A reliable build that doesn't have a dead one minute wait.