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
