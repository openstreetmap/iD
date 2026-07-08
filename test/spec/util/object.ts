describe('iD.utilObjectOmit', function() {
    it('omits keys', function() {
        var t = { a: 1, b: 2 };
        expect(iD.utilObjectOmit(t, [])).toEqual({ a: 1, b: 2 });
        expect(iD.utilObjectOmit(t, ['a'])).toEqual({ b: 2 });
        expect(iD.utilObjectOmit(t, ['a', 'b'])).toEqual({});
    });
});


describe('iD.utilCheckTagDictionary', () => {
    it('can search a standard tag-dictionary', () => {
        expect(iD.utilCheckTagDictionary({}, iD.osmPavedTags)).toBeUndefined();
        expect(iD.utilCheckTagDictionary({ surface: 'asphalt' }, iD.osmPavedTags)).toBe(true);
    });

    it('works for falsy values', () => {
        const dictionary = { surface: { paved: 0 } };
        expect(iD.utilCheckTagDictionary({}, dictionary)).toBeUndefined();
        expect(iD.utilCheckTagDictionary({ surface: 'paved' }, dictionary)).toBe(0);
    });
});

describe('stringifyProperties', () => {
    it('converts object properties to a string', () => {
        const input = {
            a: 'a',
            b: 1,
            c: null,
            d: undefined,
            e: { f: 1 },
            g: [1, 2n],
            h: 1n,
        };
        expect(iD.stringifyProperties(input)).toStrictEqual({
            a: 'a',
            b: '1',
            c: 'null',
            // d (undefined) is skipped
            e: '{"f":1}',
            g: '[1,"2"]',
            h: '"1"',
        });
    });
});
