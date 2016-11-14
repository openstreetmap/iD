/* globals chai:false */

iD.debug = true;
iD.data.imagery = [];

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
var d3 = iD.d3;

chai.use(function (chai, utils) {
    var flag = utils.flag;

    chai.Assertion.addMethod('classed', function (className) {
        this.assert(
            flag(this, 'object').classed(className)
            , 'expected #{this} to be classed #{exp}'
            , 'expected #{this} not to be classed #{exp}'
            , className
        );
    });
});
