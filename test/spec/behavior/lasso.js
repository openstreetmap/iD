describe('iD.behaviorLasso', function () {
    var lasso, context;

    beforeEach(function () {
        context = iD.Context();
        context.container(d3.select(document.createElement('div')));

        // Neuter connection
        context.connection().loadTiles = function () {};

        lasso = iD.behaviorLasso(context);

        d3.select(document.createElement('div'))
            .call(context.map());
    });

    afterEach(function () {
        lasso.off(context.surface());
    });

    it('can be initialized', function () {
        expect(context.surface().call(lasso)).to.be.ok;
    });
});
