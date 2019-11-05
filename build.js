const buildData = require('./build_data');
const buildSrc = require('./build_src');
const buildCSS = require('./build_css');

let _currBuild = null;

// if called directly, do the thing.
buildAll();


function buildAll() {
  if (_currBuild) return _currBuild;

  return _currBuild =
    Promise.all([buildCSS(), buildBundle()])
    .then(() => {
      _currBuild = null;
    })
    .catch((err) => {
      console.error(err);
      _currBuild = null;
      process.exit(1);
    });
};


function buildBundle() {
  return buildData();
  //   .then(() => buildSrc());
}

module.exports = buildAll;
