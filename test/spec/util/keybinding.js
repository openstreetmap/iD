import { fn } from '@vitest/spy';

describe('iD.utilKeybinding', function() {
    var keybinding, spy, input;

    beforeEach(function () {
        keybinding = iD.utilKeybinding('keybinding-test');
        spy = fn();
        input = d3.select('body')
            .append('input');
    });

    afterEach(function () {
        d3.select(document).call(keybinding.unbind);
        input.remove();
    });

    describe('#on', function () {
        it('returns self', function () {
            expect(keybinding.on('a', spy)).toEqual(keybinding);
        });

        it('adds a binding for the specified bare key', function () {
            d3.select(document).call(keybinding.on('A', spy));

            happen.keydown(document, {keyCode: 65, metaKey: true});
            expect(spy).not.toHaveBeenCalled();

            happen.keydown(document, {keyCode: 65});
            expect(spy).toHaveBeenCalledOnce();
        });

        it('adds a binding for the specified key combination', function () {
            d3.select(document).call(keybinding.on('⌘+A', spy));

            happen.keydown(document, {keyCode: 65});
            expect(spy).not.toHaveBeenCalled();

            happen.keydown(document, {keyCode: 65, metaKey: true});
            expect(spy).toHaveBeenCalledOnce();
        });

        it('matches the binding even when shift is present', function () {
            d3.select(document).call(keybinding.on('A', spy));

            happen.keydown(document, {keyCode: 65, shiftKey: true});
            expect(spy).toHaveBeenCalledOnce();
        });

        it('matches shifted bindings before unshifted bindings', function () {
            const spy2 = fn();
            d3.select(document).call(keybinding.on('A', spy2));
            d3.select(document).call(keybinding.on('⇧A', spy));

            happen.keydown(document, {keyCode: 65, shiftKey: true});
            expect(spy).toHaveBeenCalledOnce();
            expect(spy2).not.toHaveBeenCalled();
        });

        it('ignores alt and control if both are present (e.g. as AltGr) #4096', function () {
            d3.select(document).call(keybinding.on('A', spy));

            happen.keydown(document, {keyCode: 65, altKey: true, ctrlKey: true});
            expect(spy).toHaveBeenCalledOnce();
        });

        it('adds multiple bindings given an array of keys', function () {
            d3.select(document).call(keybinding.on(['A','B'], spy));

            happen.keydown(document, {keyCode: 65});
            expect(spy).toHaveBeenCalledOnce();

            happen.keydown(document, {keyCode: 66});
            expect(spy).toHaveBeenCalledTimes(2);
        });

        it('does not dispatch when focus is in input elements by default', function () {
            d3.select(document).call(keybinding.on('A', spy));

            happen.keydown(input.node(), {keyCode: 65});
            expect(spy).not.toHaveBeenCalled();
        });

        it('dispatches when focus is in input elements when the capture flag was passed', function () {
            d3.select(document).call(keybinding.on('A', spy, true));

            happen.keydown(input.node(), {keyCode: 65});
            expect(spy).toHaveBeenCalledOnce();
        });

        it('resets bindings when keybinding.unbind is called', function () {
            d3.select(document).call(keybinding.on('A', spy));
            happen.keydown(document, {keyCode: 65});
            expect(spy).toHaveBeenCalledOnce();

            const spy2 = fn();
            d3.select(document).call(keybinding.unbind);
            d3.select(document).call(keybinding.on('A', spy2));
            happen.keydown(document, {keyCode: 65});
            expect(spy2).toHaveBeenCalledOnce();
        });

    });
});
