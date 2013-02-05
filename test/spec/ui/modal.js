describe("iD.ui.modal", function () {
    var elem;

    beforeEach(function() {
        elem = d3.select('body').append('div');
    });

    afterEach(function() {
        elem.remove();
    });

    it('can be instantiated', function() {
        var modal = iD.ui.modal(elem)
            .select('.content')
            .text('foo');
        expect(modal).to.be.ok;
        happen.keydown(document, {keyCode: 27}); // dismiss
    });
});
