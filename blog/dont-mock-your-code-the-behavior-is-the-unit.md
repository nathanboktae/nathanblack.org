---
title: "Don't Mock Your Code - The Behavior is the Unit"
tags: front-end, testing, bdd
date: 2017-01-30
---

I first started really utilizing unit testing and test-driven development while on the [DataMarket](http://web.archive.org/web/20120205035354/https://datamarket.azure.com/) team at Microsoft was slowing migrating an ASP.NET WebForms app to MVC. In a team that had no tests maintained by developers (*shudder* how did we develop software this long?) it was a big cultural change led by my great colleages [Jon Sequiera](https://github.com/jonsequitur) and [Dmitry Frenkel](https://www.linkedin.com/in/dfrenkel), who I am very greatful to have the experience of working with.

At the time we'd write tests for our controllers. We'd mock out all the dependencies it would need in a test and provide them. We were also using the [repository pattern]() and testing the controller we'd mock that out. The repository pattern was really needed as we couldn't actually make a call to the database due to a lot of different reasons that basically stem from a monolithic ball of sphagetti code and abomination that was [Entity Framework 1.0](http://www.ben-morris.com/entity-framework-anti-patterns-how-not-to-use-an-orm-with-sql-server/).

That was nice to get developers used to writing tests for their code, but there was a lot of problems with that. Views were not tested at all, due to Razor being untestable at the time (some 32bit vs 64bit issue on the build server or something, see previous comment on monolithic ball of sphagetti). We had bugs in our view not being rendered. Razor was also very logic heavy, and a few abominations were created. Writing new tests required about 3x the mocking code than code that actually did the assertions. Model binding had no tests - you'd know about it 3 days later (maybe) when a tester ran their test suite, or worse, your manager was trying something on the development environment. Forgot a dependency injection registration that you mocked out? App won't boot at all despite your tests passing. Moreover, when I want to refactor code to move more logic into the controller from the repository that had to much (that had no tests on it), I have to refactor a whole quite of tests. How can we rely on these tests when it still has these huge gaps and maintence problems?

A new approach and that can be referred to behavior-driven development or black box testing is testing the functionality or contracts of the service or app. Essentially all the code that is in that git repo, test that it's contracts with things outside of it (users, other services it depends on or the API service it has), test those behaviors without mocking any code inside that repository, only other services / interfaces that it depends on (An AWS service, browser ajax calls, etc.) If possible avoid those too - for example, don't mock your database or Redis - run the server locally, bootstrap it, run the real migrations or whatever, and run your tests.

[supertest](https://github.com/visionmedia/supertest) and [ASP.NET WebApi](http://www.davidwhitney.co.uk/Blog/2015/01/07/testing-an-asp-net-webapi-app-in-memory/) are great in doing this sort of testing for an API server. Start your app, build a request, and assert the response. Make a few calls in a test or nest tests for testing a complicated scenario.

```javascript
const app = require('../app'),
      supertest = require('co-supertest')(app.listen() /* koa app */)

describe('Logging in', function() {
  it('should return 401 given invalid credentials', function() {
    return supertest(app)
      .post('/users')
      .send({
        email: 'bob@gmail.com',
        password: '1234'
      })
      .set('Accept', 'application/json')
      .expect(401)
      .expect({
        message: 'Invalid Credentials'
      })
      .end()
  })
})
```

How simple is that? Of course before this, test data is seeded into the database, and depedant services that are not mocked are started and seeded, like a local redis instance, or a test SQS topic.

What about client code? Opening and closing a browser for every test is not practical. For the rewrite of the portal at Appuri, I had our test bootstrap the entire application and mount it in a `div` that is not mounted in the DOM by default. Not mounting it in the DOM makes it faster, and also will fail any code that does a global selector (`document.body.querySelector[All]`), which is very nice. After the test is done, the div is thrown away. Every test instance gets a new appilcation instance and new DOM root for isolation. It's more heavy weight than unit tests of course, but much less than a Selenium or even a [mocha-casperjs](https://github.com/nathanboktae/mocha-casperjs) test.

After using this approach for a year, and getting two other developers up to speed on it, I'm very happy with the results. Functional regressions are extremely rare, and usually due to a missing test or test bug, which is fixed along with the bug fix!

