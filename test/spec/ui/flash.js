import { setTimeout } from 'node:timers/promises';
import { select as d3_select, selectAll as d3_selectAll } from 'd3-selection';
import { timerFlush as d3_timerFlush } from 'd3-timer';

describe('iD.uiFlash', function () {
    var context;

    beforeEach(function() {
        var container = d3_select('body');
        context = iD.coreContext().assetPath('../dist/').init().container(container);
        container
            .append('div')
            .attr('class', 'flash-wrap')
            .append('div')
            .attr('class', 'main-footer-wrap');
    });

    afterEach(function() {
        d3_select('.flash-wrap')
            .remove();
    });

    it('flash is shown and goes away', async () => {
        iD.uiFlash(context).duration(0)();
        var flashWrap = d3_selectAll('.flash-wrap');
        var footerWrap = d3_selectAll('.main-footer-wrap');
        expect(flashWrap.classed('footer-show')).toBeTruthy();
        expect(footerWrap.classed('footer-hide')).toBeTruthy();
        d3_timerFlush();
        await setTimeout(200);
        expect(flashWrap.classed('footer-hide')).toBeTruthy();
        expect(footerWrap.classed('footer-show')).toBeTruthy();
    });

});
