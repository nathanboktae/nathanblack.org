const
  gulp = require('gulp'),
  File = require('vinyl'),
  sourcemaps = require('gulp-sourcemaps'),
  stylus = require('gulp-stylus'),
  jade = require('jade'),
  plumber = require('gulp-plumber'),
  rename = require('gulp-rename'),
  concat = require('gulp-concat'),
  markdown = require('gulp-markdown-to-json'),
  through = require('through2'),
  browserSync = require('browser-sync'),
  moment = require('moment'),
  path = require('path'),
  commitHash = (process.env.CIRCLE_SHA1 || '').substr(0, 7),
  siteStyles = commitHash ? `site.${commitHash}.css` : 'site.css',
  siteScript = commitHash ? `site.${commitHash}.js` : 'site.js',
  staticAssets = [
    'assets/*.woff',
    'assets/*.woff2',
    'assets/*.png',
    'assets/*.jpg',
    'assets/*.svg'
  ],
  serving = process.argv[2] === 'serve',
  jadeLocals = { moment, siteStyles, siteScript },

permalink = () => rename(function(file) {
  if (file.extname === '.html' && file.basename !== 'index') {
    file.dirname = path.join(file.dirname, file.basename)
    file.basename = 'index'
  }
  return file
})

gulp.task('stylus', function() {
  return gulp.src('styles/nathanblack.styl')
      .pipe(sourcemaps.init())
      .pipe(plumber({ inherit: serving }))
      .pipe(stylus({'include css': true}))
      .pipe(rename(siteStyles))
      .pipe(sourcemaps.write(commitHash && '.'))
      .pipe(gulp.dest('build'))
      .pipe(browserSync.reload({ stream: true }))
})

gulp.task('scripts', function() {
  return gulp.src([
      'node_modules/axios/dist/axios.min.js',
      'node_modules/knockout/build/output/knockout-latest.js',
      'node_modules/moment/min/moment.min.js',
      'scripts/nathanblack.js'
    ])
    .pipe(plumber({ inherit: serving }))
    .pipe(concat(siteScript))
    .pipe(gulp.dest('build'))
    .pipe(browserSync.reload({ stream: true }))
})


gulp.task('move', () => gulp.src(staticAssets).pipe(gulp.dest('build')))

function render(name, template, jadeOpts) {
  return new File({
    base: '',
    path: name + '.html',
    contents: new Buffer(jade.renderFile(`templates/${template}.jade`, Object.assign({ currPage: 'blog' }, jadeOpts, jadeLocals)))
  })
}

function fileToArticle(notSoVinylFile) {
  var file = new File(notSoVinylFile),
  article = Object.assign(JSON.parse(file.contents.toString()), {
    slug: file.stem || file.basename.replace(/.json$/, '')
  })

  article.summary = article.body.substr(0, article.body.indexOf('<!--more-->')).replace(/<img[^>]+>/g, '')

  if (!article.date) {
    if (article.draft) {
      article.date = moment().utc()
    } else {
      throw new Error(`${article.title || article.slug} does not have a date`)
    }
  } else {
    article.date = moment(article.date).utc()
    if (!article.date.isValid()) {
      throw new Error(`${article.title || article.slug} has a bad date format`)
    }
  }

  if (typeof article.tags === 'string') {
    article.tags = article.tags ? article.tags.split(',').map(t => t.trim()) : []
  } else if (!Array.isArray(article.tags)) {
    throw new Error(`${article.title || article.slug} does not have any tags`)
  }
  return article
}

gulp.task('blog-aggregates', function() {
  var articles = [],
      Feed = require('feed')

  return gulp.src('blog/*.md')
    .pipe(markdown())
    .pipe(plumber({ inherit: serving }))
    .pipe(through.obj(function(notSoVinylFile, enc, cb) {
      var article = fileToArticle(notSoVinylFile)
      if (!article.draft && article.date) {
        articles.push(article)
      }
      cb(null)
    }, function(cb) {
      articles.sort((a, b) => b.date - a.date)

      var byTag = {}
      articles.forEach(a => {
        a.tags.forEach(function(t) {
          var slug = t.toLowerCase().replace(/[^0-9a-z\-]/g, '-')
          if (!byTag[slug]) {
            byTag[slug] = [a]
            byTag[slug].tagName = t
          } else {
            byTag[slug].push(a)
          }
        })
      })

      Object.keys(byTag).forEach(tag => this.push(
        render(`build/tag/${tag}/index`, 'blog-tag-list', { tag, byTag, articles: byTag[tag] }))
      )

      //this.push(render('templates/tag-counts', 'tag-counts', { articles, byTag }))
      this.push(render('build/index', 'index', { articles, byTag }))

      function buildFeed (articles, filePath, useFullContent) {
        var feed = new Feed({
          title: `Nathan Black's Blog`,
          link: 'http://nathanblack.org',
          id: 'http://nathanblack.org',
          image: 'http://nathanblack.org/favicon.png',
          updated: articles[0].date.toDate()
        })

        articles.forEach(a => feed.addItem({
          title: a.title,
          description: useFullContent ? a.body : a.summary,
          link: 'http://nathanblack.org/post/' + a.slug,
          id: 'http://nathanblack.org/post/' + a.slug,
          date: a.date.toDate(),
          author: [{
            name: 'Nathan Black',
            link: 'http://nathanblack.org/'
          }]
        }))

        return new File({
          base: '',
          path: filePath,
          contents: new Buffer(feed.render('atom-1.0'))
        })
      }

      if (!serving) {
        this.push(buildFeed(articles, 'build/feed.xml'))
        this.push(buildFeed(articles.slice(0, 10), 'build/feed-full.xml', true))
      }

      cb(null)
    }))
    .pipe(gulp.dest('.'))
})

function compileBlog() {
  var articleLayout = require('fs').readFileSync('templates/article.jade')
  return gulp.src('blog/*.md')
    .pipe(markdown({
      highlight: function (code) {
        return require('highlight.js').highlightAuto(code).value;
      }
    }))
    .pipe(plumber({ inherit: serving }))
    .pipe(through.obj(function(notSoVinylFile, enc, callback) {
      try {
        var file = new File(notSoVinylFile),
            article = fileToArticle(notSoVinylFile)

        file.contents = new Buffer(jade.render(articleLayout, Object.assign({
          filename: __dirname + '/templates/article.jade',
          currPage: 'blog',
          article
        }, jadeLocals)))
        file.extname = '.html'
        callback(null, !file.draft && file)
      } catch (e) {
        callback(e)
      }
    }))
    .pipe(permalink())
    .pipe(gulp.dest('build/post'))
    .pipe(browserSync.reload({ stream: true }))
}
gulp.task('blog', ['blog-aggregates'], compileBlog)
gulp.task('blog-nodeps', compileBlog)

gulp.task('default', ['move', 'stylus', 'scripts', 'blog'])

gulp.task('serve', ['default'], function() {
  browserSync({
    open: false,
    server: {
      baseDir: ['build']
    }
  })

  gulp.watch(['styles/*.styl'], ['stylus'])
  gulp.watch(['blog/*.md', 'templates/*.jade'], ['blog-nodeps'])
  gulp.watch(['scripts/**/*.js'], ['scripts'])
})
