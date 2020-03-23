describe('iD.behaviorLasso', function () {
    var context, lasso;

    beforeEach(function () {
        context = iD.coreContext().init();
        d3.select(document.createElement('div'))
            .attr('class', 'main-map')
            .call(context.map());
        lasso = iD.behaviorLasso(context);
    });

    afterEach(function () {
        lasso.off(context.surface());
    });

    it('can be initialized', function () {
        expect(context.surface().call(lasso)).to.be.ok;
    });
});
