describe('iD.behaviorLasso', function () {
    var context, lasso;

    beforeEach(function () {
        context = iD.Context();
        d3.select(document.createElement('div'))
            .attr('id', 'map')
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
