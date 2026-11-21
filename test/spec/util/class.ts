import { getSet } from '../../../modules/util/class';

function mockES5Class() {
    let _myVar = 0;

    const f = function() {};
    f.myMethod = getSet(f, () => _myVar, _ => _myVar = _);
    f.someOtherProperty = 'hello';
    return f;
}

class mockES6Class {
    _myVar = 0;

    myMethod = getSet(this, () => this._myVar, _ => this._myVar = _);
    someOtherProperty = 'hello';
}

describe('getSet', () => {
    it.each([
        mockES5Class(),
        new mockES6Class(),
    ])('%%', (instance) => {

        expect(instance.someOtherProperty).toBe('hello');
        expect(instance.myMethod()).toBe(0);

        // set then get new value:
        expect(instance.myMethod(5)).toBe(instance);
        expect(instance.myMethod()).toBe(5);

        // it should return itself:
        expect(instance.myMethod(6).someOtherProperty).toBe('hello');

        // it should be chainable:
        expect(instance.myMethod(7).myMethod(8)).toBe(instance);
        expect(instance.myMethod()).toBe(8);

        // chaining set then get
        expect(instance.myMethod(1).myMethod(2).myMethod()).toBe(2);
    });
});
