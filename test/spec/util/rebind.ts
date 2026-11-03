import { dispatch as d3_dispatch } from 'd3-dispatch';
import { utilBindDispatch } from '../../../modules/util/rebind';

describe('utilRebind', () => {
    it('copies methods from source to target', () => {
        const target = { original: 123 };
        const source = new class {
            value = 456;
            method() {
                return this.value;
            }
        };

        const copied = iD.utilRebind(target, source, 'method');

        expect(copied).toStrictEqual({
            original: 123,
            method: expect.any(Function)
        });
        expect(copied.method()).toBe(456);
    });
});

describe('utilBindDispatch', () => {
    it('returns the correct `this` after calling the .on property', () => {
        function mockES5Class() {
            const dispatch = d3_dispatch('mouseup', 'mousedown');

            const f = function() {};
            f.someProperty = 'abc';
            f.emit = () => dispatch.call('mousedown', f, 'a', 'b');
            f.on = utilBindDispatch(f, dispatch);
            return f;
        }

        const instance = mockES5Class();
        const spy = vi.fn();
        expect(instance
            .on('mousedown', spy)
            .someProperty
        ).toBe('abc');

        expect(spy).toHaveBeenCalledTimes(0);
        instance.emit();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('a', 'b');
    });
});
