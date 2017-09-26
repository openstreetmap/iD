/* globals chai:false */

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
