var fs = require('fs');
var args = require('minimist')(process.argv.slice(2));
var global = [];
function readFiles(dirname, outdir) {
      var filenames = fs.readdirSync(dirname);
      filenames.forEach(function(filename) {
        var fileData = fs.readFileSync(dirname + filename).toString().split('\n');
        processFile(fileData, outdir + filename);
    });
}
var POSSIBLE_MODULES = [ 'actions', 'geo', 'modes', 'util', 'core', 'behavior' ];
function findData(data) {
  var modules = { 'actions': [], 'geo': [], 'modes': [], 'util': [], 'core': [], 'behavior': [] };
  var cores = [ 'Entity', 'Way', 'Relation', 'Node', 'Graph', 'Tree', 'Difference', 'History' ];
  var ret = data.map(function(lineArg) {
    var line = lineArg;
    POSSIBLE_MODULES.forEach(function(mod) {
      cores.forEach(function(c) {
        while (line.indexOf('iD.' + c) > -1 ) {
          var start = line.indexOf('iD.' + c);
          var prefix = 3;
          line = line.slice(0, start) + line.slice(start + prefix);
          if (modules.core.indexOf(c) === -1) {
            modules.core.push(c);
            console.log(c);
          }
        }
      });

      while (line.indexOf('iD.' + mod + '.') > -1 ) {
        var start = line.indexOf('iD.' + mod + '.');
        var prefix = 3 + mod.length + 1;
        var end = line.indexOf('(', start);
        var foo = line.slice(start + prefix, end);
        if (modules[mod].indexOf(foo) === -1) {
          modules[mod].push(foo);
        }
        line = line.slice(0, start) + line.slice(start + prefix);
      }
    });
    return line;
  });
  POSSIBLE_MODULES.forEach(function(mod) {
    if (modules[mod].length > 0) {
      var importStuff = modules[mod].join(', ');
      ret.unshift(`import { ${importStuff} } from '../${mod}/index';`);
      /*eslint-disable */
      /*eslint-enable */
    }
  });

  return ret;
}

function processFile(fd, name) {
  global.push({
    name: name,
    data: fd
  });
}

readFiles(args.dir, args.out);


global.forEach(function (f) {
  var processedData = findData(f.data);
  fs.writeFile(f.name, processedData.join('\n'), function (e) {if (e) console.log(e);});
});
