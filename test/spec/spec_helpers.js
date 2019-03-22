/* globals chai:false */
/* eslint no-extend-native:off */
iD.debug = true;

// disable things that use the network
iD.data.imagery = [];
for (var k in iD.services) { delete iD.services[k]; }

// run with a minimal set of presets for speed
iD.data.presets = {
    presets: {
        area: { name: 'Area', tags: {}, geometry: ['area'] },
        line: { name: 'Line', tags: {}, geometry: ['line'] },
        point: { name: 'Point', tags: {}, geometry: ['point'] },
        vertex: { name: 'Vertex', tags: {}, geometry: ['vertex'] },
        relation: { name: 'Relation', tags: {}, geometry: ['relation'] },
        // for tests related to areaKeys:
        building: { name: 'Building', tags: { building: 'yes' }, geometry: ['point', 'area'] },
        man_made: { name: 'Man Made', tags: { man_made: '*' }, geometry: ['vertex', 'point', 'line', 'area'] }
    }
};


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

// Object.getOwnPropertySymbols polyfill (For PhantomJS / IE11) - #6001
if (!Object.getOwnPropertySymbols) {
  Object.defineProperty(Object.prototype, 'getOwnPropertySymbols', {
    value: function() { return []; }
  });
}
