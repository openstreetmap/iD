describe("iD.ui.flash", function () {
    var clock;

    beforeEach(function () {
        clock = sinon.useFakeTimers();
    });

    afterEach(function () {
        clock.restore();
    });

    it('leaves after 1000 ms', function () {
        var flash = iD.ui.flash();
        clock.tick(1010);
        expect(flash.node().parentNode).to.be.null;
    });
});
