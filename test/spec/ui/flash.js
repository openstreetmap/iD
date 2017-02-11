describe('iD.uiFlash', function () {
    var elem;

    beforeEach(function() {
        elem = d3.select('body')
            .append('div')
            .attr('id', 'flash');
    });

    afterEach(function () {
        elem.remove();
    });

    it('creates a flash', function () {
        iD.uiFlash();
        expect(elem.selectAll('#flash .content').size()).to.eql(1);
    });

    it.skip('flash goes away', function (done) {
        // test doesn't work on PhantomJS
        iD.uiFlash();
        window.setTimeout(function() {
            expect(elem.selectAll('#flash .content').size()).to.eql(0);
            done();
        }, 1900);
    });

});
