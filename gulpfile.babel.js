const gulp = require('gulp') ;
const {merge} = require('event-stream') ;
const browserify = require('browserify') ;
const source = require('vinyl-source-stream') ;
const buffer = require('vinyl-buffer') ;
const preprocessify = require('preprocessify') ;
const gulpif = require('gulp-if') ;
const fs = require('fs') ;

const $ = require('gulp-load-plugins')();

var production = process.env.NODE_ENV === "production";
var target = process.env.TARGET || "chrome";
var environment = process.env.NODE_ENV || "development";

var generic = JSON.parse(fs.readFileSync(`./config/${environment}.json`));
var specific = JSON.parse(fs.readFileSync(`./config/${target}.json`));
var context = Object.assign({}, generic, specific);

var manifest = {
  dev: {
    "background": {
      "scripts": [
        "scripts/livereload.js",
        "scripts/background.js"
      ]
    }
  },

  firefox: {
    "applications": {
      "gecko": {
        "id": "my-app-id@mozilla.org"
      }
    }
  }
}

// -----------------
// COMMON
// -----------------
gulp.task('js', (done) => {
  buildJS(target)
  done()
})

gulp.task('styles', gulp.series(() => {
  return gulp.src('src/styles/**/*.scss')
    .pipe($.plumber())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe(gulp.dest(`build/${target}/styles`));
}));

gulp.task("manifest", gulp.series(() => {
  return gulp.src('./manifest.json')
    .pipe(gulpif(!production, $.mergeJson({
      fileName: "manifest.json",
      jsonSpace: " ".repeat(4),
      endObj: manifest.dev
    })))
    .pipe(gulpif(target === "firefox", $.mergeJson({
      fileName: "manifest.json",
      jsonSpace: " ".repeat(4),
      endObj: manifest.firefox
    })))
    .pipe(gulp.dest(`./build/${target}`))
}));

gulp.task('ext', gulp.series('manifest', 'js', (done) => {
  mergeAll(target)
  done()
}));

// Tasks
gulp.task('clean', gulp.series(() => {
  return pipe(`./build/${target}`, $.clean())
}))

gulp.task('build', gulp.series('clean', 'styles', 'ext'));

gulp.task('watch', gulp.series('build', () => {
  $.livereload.listen({port: 35729, start: true});

  gulp.watch(['./src/**/*']).on("change", () => {
    $.runSequence('build', $.livereload.reload);
  });
}));

gulp.task('default', gulp.series('build', (done) => {done()}));

// -----------------
// DIST
// -----------------
gulp.task('dist', gulp.series((cb) => {
  $.runSequence('build', 'zip', cb)
}));

gulp.task('zip', gulp.series(() => {
  return pipe(`./build/${target}/**/*`, $.zip(`${target}.zip`), './dist')
}))


// Helpers
function pipe(src, ...transforms) {
  return transforms.reduce((stream, transform) => {
    const isDest = typeof transform === 'string'
    return stream.pipe(isDest ? gulp.dest(transform) : transform)
  }, gulp.src(src, {'allowEmpty': true}))
}

function mergeAll(dest) {
  return merge(
    pipe('./src/icons/**/*', `./build/${dest}/icons`),
    pipe(['./src/_locales/**/*'], `./build/${dest}/_locales`),
    pipe([`./src/images/${target}/**/*`], `./build/${dest}/images`),
    pipe(['./src/images/shared/**/*'], `./build/${dest}/images`),
    pipe(['./src/**/*.html'], `./build/${dest}`)
  )
}

function buildJS(target) {
  const files = [
    'background.js',
    'contentscript.js',
    'options.js',
    'livereload.js',
    'popup.js'
  ]

  let tasks = files.map( file => {
    return browserify({
      entries: 'src/scripts/' + file,
      debug: true
    })
    .transform('babelify', { presets: ['@babel/preset-env'] })
    .transform(preprocessify, {
      includeExtensions: ['.js'],
      context: context
    })
    .bundle()
    .pipe(source(file))
    .pipe(buffer())
    .pipe(gulpif(!production, $.sourcemaps.init({ loadMaps: true }) ))
    .pipe(gulpif(!production, $.sourcemaps.write('./') ))
    .pipe(gulpif(production, $.uglify({ 
      "mangle": false,
      "output": {
        "ascii_only": true
      } 
    })))
    .pipe(gulp.dest(`build/${target}/scripts`));
  });

  return merge(tasks);
}