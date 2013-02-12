describe("iD.ui.flash", function () {
    var clock;

    var elem;

    beforeEach(function() {
        elem = d3.select('body').append('div');
    });

    afterEach(function() { elem.remove(); });

    beforeEach(function () {
        clock = sinon.useFakeTimers();
    });

    afterEach(function () {
        clock.restore();
    });

    it('leaves after 1000 ms', function () {
        var flash = iD.ui.flash(elem);
        clock.tick(1610);
        expect(flash.node().parentNode).to.be.null;
    });
});
