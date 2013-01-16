describe("iD.ui.modal", function () {
    it('can be instantiated', function () {
        var modal = iD.ui.modal()
            .select('.content')
            .text('foo');
        expect(modal).to.be.ok;
    });
});
