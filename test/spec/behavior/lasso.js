describe("iD.behavior.Lasso", function () {
    var lasso, context;

    beforeEach(function () {
        context = iD();

        // Neuter connection
        context.connection().loadTiles = function () {};

        lasso = iD.behavior.Lasso(context);

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
