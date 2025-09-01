import { setTimeout } from 'node:timers/promises';

describe('iD.uiFlash', function () {
    var context;

    beforeEach(function() {
        var container = d3.select('body');
        context = iD.coreContext().assetPath('../dist/').init().container(container);
        container
            .append('div')
            .attr('class', 'flash-wrap')
            .append('div')
            .attr('class', 'main-footer-wrap');
    });

    afterEach(function() {
        d3.select('.flash-wrap')
            .remove();
    });

    it('flash is shown and goes away', async () => {
        iD.uiFlash(context).duration(0)();
        var flashWrap = d3.selectAll('.flash-wrap');
        var footerWrap = d3.selectAll('.main-footer-wrap');
        expect(flashWrap.classed('footer-show')).to.be.ok;
        expect(footerWrap.classed('footer-hide')).to.be.ok;
        d3.timerFlush();
        await setTimeout(200);
        expect(flashWrap.classed('footer-hide')).to.be.ok;
        expect(footerWrap.classed('footer-show')).to.be.ok;
    });

});
