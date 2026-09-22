import { fn } from '@vitest/spy';
import { select as d3_select } from 'd3-selection';

describe('iD.utilKeybinding', function() {
    var keybinding, spy, input;

    beforeEach(function () {
        keybinding = iD.utilKeybinding('keybinding-test');
        spy = fn();
        input = d3_select('body')
            .append('input');
    });

    afterEach(function () {
        d3_select(document).call(keybinding.unbind);
        input.remove();
    });

    describe('#on', function () {
        it('returns self', function () {
            expect(keybinding.on('a', spy)).toEqual(keybinding);
        });

        it('adds a binding for the specified bare key', function () {
            d3_select(document).call(keybinding.on('A', spy));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true }));
            expect(spy).not.toHaveBeenCalled();

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            expect(spy).toHaveBeenCalledOnce();
        });

        it('adds a binding for the specified key combination', function () {
            d3_select(document).call(keybinding.on('⌘+A', spy));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            expect(spy).not.toHaveBeenCalled();

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true }));
            expect(spy).toHaveBeenCalledOnce();
        });

        it('matches the binding even when shift is present', function () {
            d3_select(document).call(keybinding.on('A', spy));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', shiftKey: true }));
            expect(spy).toHaveBeenCalledOnce();
        });

        it('matches shifted bindings before unshifted bindings', function () {
            const spy2 = fn();
            d3_select(document).call(keybinding.on('A', spy2));
            d3_select(document).call(keybinding.on('⇧A', spy));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', shiftKey: true }));
            expect(spy).toHaveBeenCalledOnce();
            expect(spy2).not.toHaveBeenCalled();
        });

        it('ignores alt and control if both are present (e.g. as AltGr) #4096', function () {
            d3_select(document).call(keybinding.on('A', spy));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', altKey: true, ctrlKey: true }));
            expect(spy).toHaveBeenCalledOnce();
        });

        it('adds multiple bindings given an array of keys', function () {
            d3_select(document).call(keybinding.on(['A','B'], spy));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            expect(spy).toHaveBeenCalledOnce();

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
            expect(spy).toHaveBeenCalledTimes(2);
        });

        it('does not dispatch when focus is in input elements by default', function () {
            d3_select(document).call(keybinding.on('A', spy));

            input.node().dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            expect(spy).not.toHaveBeenCalled();
        });

        it('dispatches when focus is in input elements when the capture flag was passed', function () {
            d3_select(document).call(keybinding.on('A', spy, true));

            input.node().dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            expect(spy).toHaveBeenCalledOnce();
        });

        it('resets bindings when keybinding.unbind is called', function () {
            d3_select(document).call(keybinding.on('A', spy));
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            expect(spy).toHaveBeenCalledOnce();

            const spy2 = fn();
            d3_select(document).call(keybinding.unbind);
            d3_select(document).call(keybinding.on('A', spy2));
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            expect(spy2).toHaveBeenCalledOnce();
        });

    });
});
