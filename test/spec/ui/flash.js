describe("iD.ui.flash", function () {
    it('can be instantiated', function () {
        var flash = iD.ui.flash();
        expect(flash).to.be.ok;
    });
    it('leaves after 1000 ms', function (done) {
        var flash = iD.ui.flash();
        window.setTimeout(function() {
            expect(flash.node().parentNode).to.be.null;
            done();
        }, 1200);
    });
});
