describe('d3.keybinding', function() {
    var keybinding, spy, input;

    beforeEach(function () {
        keybinding = iD.lib.d3keybinding('keybinding-test');
        spy = sinon.spy();
        input = d3.select('body')
            .append('input');
    });

    afterEach(function () {
        keybinding.off(d3.select(document));
        input.remove();
    });

    describe('#on', function () {
        it('returns self', function () {
            expect(keybinding.on('a', spy)).to.equal(keybinding);
        });

        it('adds a binding for the specified bare key', function () {
            d3.select(document).call(keybinding.on('A', spy));

            happen.keydown(document, {keyCode: 65, metaKey: true});
            expect(spy).not.to.have.been.called;

            happen.keydown(document, {keyCode: 65});
            expect(spy).to.have.been.calledOnce;
        });

        it('adds a binding for the specified key combination', function () {
            d3.select(document).call(keybinding.on('⌘+A', spy));

            happen.keydown(document, {keyCode: 65});
            expect(spy).not.to.have.been.called;

            happen.keydown(document, {keyCode: 65, metaKey: true});
            expect(spy).to.have.been.calledOnce;
        });

        it('matches the binding even when shift is present', function () {
            d3.select(document).call(keybinding.on('A', spy));

            happen.keydown(document, {keyCode: 65, shiftKey: true});
            expect(spy).to.have.been.calledOnce;
        });

        it('matches shifted bindings before unshifted bindings', function () {
            var spy2 = sinon.spy();
            d3.select(document).call(keybinding.on('A', spy2));
            d3.select(document).call(keybinding.on('⇧A', spy));

            happen.keydown(document, {keyCode: 65, shiftKey: true});
            expect(spy).to.have.been.calledOnce;
            expect(spy2).not.to.have.been.called;
        });

        it('ignores alt and control if both are present (e.g. as AltGr) #4096', function () {
            d3.select(document).call(keybinding.on('A', spy));

            happen.keydown(document, {keyCode: 65, altKey: true, ctrlKey: true});
            expect(spy).to.have.been.calledOnce;
        });

        it('adds multiple bindings given an array of keys', function () {
            d3.select(document).call(keybinding.on(['A','B'], spy));

            happen.keydown(document, {keyCode: 65});
            expect(spy).to.have.been.calledOnce;

            happen.keydown(document, {keyCode: 66});
            expect(spy).to.have.been.calledTwice;
        });

        it('does not dispatch when focus is in input elements by default', function () {
            d3.select(document).call(keybinding.on('A', spy));

            happen.keydown(input.node(), {keyCode: 65});
            expect(spy).not.to.have.been.called;
        });

        it('dispatches when focus is in input elements when the capture flag was passed', function () {
            d3.select(document).call(keybinding.on('A', spy, true));

            happen.keydown(input.node(), {keyCode: 65});
            expect(spy).to.have.been.calledOnce;
        });

        it('resets bindings when keybinding.off is called', function () {
            d3.select(document).call(keybinding.on('A', spy));
            happen.keydown(document, {keyCode: 65});
            expect(spy).to.have.been.calledOnce;

            spy = sinon.spy();
            d3.select(document).call(keybinding.off);
            d3.select(document).call(keybinding.on('A', spy));
            happen.keydown(document, {keyCode: 65});
            expect(spy).to.have.been.calledOnce;
        });

    });
});
