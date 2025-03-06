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

    it('flash is shown', function() {
        iD.uiFlash(context).duration(200)();
        var flashWrap = d3.selectAll('.flash-wrap');
        var footerWrap = d3.selectAll('.main-footer-wrap');
        expect(flashWrap.classed('footer-show')).to.be.ok;
        expect(footerWrap.classed('footer-hide')).to.be.ok;
    });

    it('flash goes away', async () => {
        iD.uiFlash(context).duration(200)();
        await setTimeout(225);
        d3.timerFlush();
        var flashWrap = d3.selectAll('.flash-wrap');
        var footerWrap = d3.selectAll('.main-footer-wrap');
        expect(flashWrap.classed('footer-hide')).to.be.ok;
        expect(footerWrap.classed('footer-show')).to.be.ok;
    });

});
