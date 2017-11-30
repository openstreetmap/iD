describe('iD.uiFlash', function () {

    beforeEach(function() {
        d3.select('body')
            .append('div')
            .attr('id', 'flash-wrap')
            .append('div')
            .attr('id', 'footer-wrap');
    });

    afterEach(function() {
        d3.select('#flash-wrap')
            .remove();
    });

    it('returns a selection', function () {
        var content = iD.uiFlash(200);
        expect(content.size()).to.eql(1);
        expect(content.classed('content')).to.be.ok;
    });

    it('flash is shown', function() {
        iD.uiFlash(200);
        var flashWrap = d3.selectAll('#flash-wrap');
        var footerWrap = d3.selectAll('#footer-wrap');
        expect(flashWrap.classed('footer-show')).to.be.ok;
        expect(footerWrap.classed('footer-hide')).to.be.ok;
    });

    it('flash goes away', function(done) {
        iD.uiFlash(200);
        window.setTimeout(function() {
            d3.timerFlush();
            var flashWrap = d3.selectAll('#flash-wrap');
            var footerWrap = d3.selectAll('#footer-wrap');
            expect(flashWrap.classed('footer-hide')).to.be.ok;
            expect(footerWrap.classed('footer-show')).to.be.ok;
            done();
        }, 225);
    });

});
