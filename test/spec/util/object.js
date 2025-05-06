describe('iD.utilObjectOmit', function() {
    it('omits keys', function() {
        var t = { a: 1, b: 2 };
        expect(iD.utilObjectOmit(t, [])).to.eql({ a: 1, b: 2 });
        expect(iD.utilObjectOmit(t, ['a'])).to.eql({ b: 2 });
        expect(iD.utilObjectOmit(t, ['a', 'b'])).to.eql({});
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

    it('can search a standard tag-dictionary for key=*', () => {
        expect(iD.utilCheckTagDictionary({}, iD.osmImpliedLayer)).toBeUndefined();
        expect(iD.utilCheckTagDictionary({ bridge: 'yes' }, iD.osmImpliedLayer)).toBe(1);
    });

    it('works for falsy values in key=*', () => {
        const dictionary = { bridge: 0 };
        expect(iD.utilCheckTagDictionary({}, dictionary)).toBeUndefined();
        expect(iD.utilCheckTagDictionary({ bridge: 'whatever' }, dictionary)).toBe(0);
    });
});
