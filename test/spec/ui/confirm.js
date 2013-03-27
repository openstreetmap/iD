describe("iD.ui.confirm", function () {
    
    var elem;
    beforeEach(function() { elem = d3.select('body').append('div'); });
    afterEach(function() { elem.remove(); });

    it('can be instantiated', function () {
        var confirm = iD.ui.confirm(elem);
        expect(confirm).to.be.ok;
        happen.keydown(document, {keyCode: 27}); // dismiss
    });

    it('can be dismissed', function (done) {
        var confirm = iD.ui.confirm(elem);
        happen.click(confirm.select('button').node());
        window.setTimeout(function() {
            expect(confirm.node().parentNode).to.be.null;
            happen.keydown(document, {keyCode: 27}); // dismiss
            done();
        }, 300);
    });
});
