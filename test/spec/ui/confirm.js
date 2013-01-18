describe("iD.ui.confirm", function () {
    it('can be instantiated', function () {
        var confirm = iD.ui.confirm();
        expect(confirm).to.be.ok;
    });
    it('can be dismissed', function () {
        var confirm = iD.ui.confirm();
        happen.click(confirm.select('button').node());
        expect(confirm.node().parentNode).to.be.null;
    });
});
