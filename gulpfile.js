const gulp = require('gulp');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');

gulp.task('default', async () => {
  await gulp.src('es5/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/'))
});