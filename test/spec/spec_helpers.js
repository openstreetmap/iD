/* globals chai:false */
/* eslint no-extend-native:off */

iD.debug = true;

// disable things that use the network
iD.data.imagery = [];
for (var k in iD.services) { delete iD.services[k]; }

mocha.setup({
    ui: 'bdd',
    globals: [
        '__onresize.tail-size',
        '__onmousemove.zoom',
        '__onmouseup.zoom',
        '__onkeydown.select',
        '__onkeyup.select',
        '__onclick.draw',
        '__onclick.draw-block'
    ]
});

expect = chai.expect;

window.d3 = iD.d3;   // TODO: remove


// Array.find polyfill (For PhantomJS / IE11)
// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      var o = Object(this);
      var len = o.length >>> 0;
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var thisArg = arguments[1];
      var k = 0;
      while (k < len) {
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        k++;
      }
      return undefined;
    }
  });
}
