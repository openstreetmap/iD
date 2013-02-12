iD.debug = true;

mocha.setup({
    ui: 'bdd',
    globals: ['__onresize.tail-size', '__onmousemove.zoom', '__onmouseup.zoom', '__onclick.draw']
});

var expect = chai.expect;

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
