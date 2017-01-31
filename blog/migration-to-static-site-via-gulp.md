---
title: "Migration to a static site: Experience with Metalsmith vs Gulp"
tags: nodejs, circle-ci, gulp
date: 2017-01-29
---

I [started this site](/post/the-beginning) using [poet](http://jsantell.github.io/poet/) on top of [node.js](http://nodejs.org/) and [express](http://expressjs.com/), mainly wanting to expand my node skills and use my free Azure credits I got as a Microsoft employee. Azure Websites, the Heroku-like PaaS had just launched (now called [App Services](https://azure.microsoft.com/en-us/services/app-service/)). It was a nice experience.

Later on while working at [Appuri](https://www.crunchbase.com/organization/appuri#/entity), we decided to move our public website off of Hubspot as it was a nightmare for our talented designer, [Jeff Reynolds](https://www.linkedin.com/in/jeffreynoldz), who knew HTML and CSS, to work in. It would need marketing functionality, but we took the approach that whatever we needed could be provided via a 3rd party JavaScript tag on the client. So we didn't need a server at all. We could simply serve it from an [S3 bucket](http://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html) cheaply and it will always be up. [Circle CI](https://circleci.com) would build the site and sync the bucket.

So how to build it? I initially looked at [Metalsmith](http://www.metalsmith.io/) that was focused on building these sites, that had all the speciallized packages needed like [metalsmith-permalinks](https://github.com/segmentio/metalsmith-permalinks), [metalsmith-feed-atom](https://www.npmjs.com/package/metalsmith-feed-atom), etc. and YAML front matter as a first class citizen. But I had issues:

- Metalsmith processes all files together, unlike gulp which streams files. A lot of work on static sites requires an aggregate functionality (reorder posts by publish date, count blog entries by tag, build a sitemap, etc.) But you can always go to aggregates from a stream - you can't stream after you've sucked in the whole world. This mainly breaks the [browser-sync]() flow where CSS changes could be injected without a page refresh. Instead the whole world runs again. This is a huge dealbeaker and what caused me to switch to gulp.

- Gulp has all those plugins for a static site, and more. [gulp-markdown-to-json](https://www.npmjs.com/package/gulp-markdown-to-json) for transforming markdown with yaml front-matter, [gulp-pretty-url](https://www.npmjs.com/package/gulp-pretty-url) for permalinks (or see below for my 6-liner using [gulp-rename](https://www.npmjs.com/package/gulp-rename)), and all the other standard CSS and asset processing packages you would expect. Metalsmith is lacking in this respect (thus [gulpsmith](https://www.npmjs.com/package/gulpsmith) exists)

```javascript
const permalink = () => rename(function(file) {
  if (file.extname === '.html' && file.basename !== 'index') {
    file.dirname = path.join(file.dirname, file.basename)
    file.basename = 'index'
  }
  return file
})
```

- No concepts of tasks. Just want to re-optomize those SVGs? Build the whole world again!

So I realized that Metalsmith was just a poor gulp implementation, and redid it with gulp packages and some simple custom tasks around other core packages (e.g. used [feed](https://www.npmjs.com/package/feed) directly instead of `gulp-rss`). This method has been working really well at Appuri, so I did it here too, using [GitHub pages](https://pages.github.com/).


