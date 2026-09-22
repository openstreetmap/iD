import { select as d3_select } from 'd3-selection';

describe('iD.behaviorLasso', function () {
    var context, lasso;

    beforeEach(function () {
        context = iD.coreContext().assetPath('../dist/').init();
        d3_select(document.createElement('div'))
            .attr('class', 'main-map')
            .call(context.map());
        lasso = iD.behaviorLasso(context);
    });

    afterEach(function () {
        lasso.off(context.surface());
    });

    it('can be initialized', function () {
        expect(context.surface().call(lasso)).toBeTruthy();
    });
});
