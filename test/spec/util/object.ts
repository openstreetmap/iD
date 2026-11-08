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

    it('does not truncate values by default', () => {
        const long = 'x'.repeat(10_000);
        expect(iD.stringifyProperties({ long, arr: [long] })).toStrictEqual({
            long,
            arr: `["${long}"]`,
        });
    });

    it('truncates values longer than maxLength', () => {
        const times = Array.from({ length: 10_000 }, (_, i) => new Date(i * 1000).toISOString());
        const result = iD.stringifyProperties({
            name: 'track',
            coordinateProperties: { times },
            long: 'x'.repeat(300),
            exact: 'y'.repeat(255),
        }, 255);
        expect(result.name).toBe('track');
        expect(result.coordinateProperties).toHaveLength(255);
        expect(result.coordinateProperties).toMatch(/^\{"times":\["1970-01-01T00:00:00.000Z",.*…$/);
        expect(result.long).toBe('x'.repeat(254) + '…');
        expect(result.exact).toBe('y'.repeat(255));
        expect(iD.stringifyProperties({ a: 'abcdef' }, 4)).toStrictEqual({ a: 'abc…' });
    });
});
