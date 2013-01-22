describe("d3.keybinding", function() {
    var keybinding, spy, input;

    beforeEach(function () {
        keybinding = d3.keybinding('keybinding-test');
        spy = sinon.spy();
        input = d3.select('body')
            .append('input');
    });

    afterEach(function () {
        keybinding.off(d3.select(document));
        input.remove();
    });

    describe("#on", function () {
        it("returns self", function () {
            expect(keybinding.on('a', spy)).to.equal(keybinding);
        });

        it("adds a binding for the specified bare key", function () {
            d3.select(document).call(keybinding.on('A', spy));

            happen.keydown(document, {keyCode: 65, metaKey: true});
            expect(spy).not.to.have.been.called;

            happen.keydown(document, {keyCode: 65});
            expect(spy).to.have.been.called;
        });

        it("adds a binding for the specified key combination", function () {
            d3.select(document).call(keybinding.on('⌘+A', spy));

            happen.keydown(document, {keyCode: 65});
            expect(spy).not.to.have.been.called;

            happen.keydown(document, {keyCode: 65, metaKey: true});
            expect(spy).to.have.been.called;
        });

        it("does not dispatch when focus is in input elements by default", function () {
            d3.select(document).call(keybinding.on('A', spy));

            happen.keydown(input.node(), {keyCode: 65});
            expect(spy).not.to.have.been.called;
        });

        it("dispatches when focus is in input elements when the capture flag was passed", function () {
            d3.select(document).call(keybinding.on('A', spy, true));

            happen.keydown(input.node(), {keyCode: 65});
            expect(spy).to.have.been.called;
        });
    });
});
