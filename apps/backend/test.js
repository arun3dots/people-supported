try {
  require('./dist/main.js');
} catch (e) {
  require('fs').writeFileSync('REAL_ERROR.log', e.toString() + '\n' + e.stack);
  console.error(e);
}
