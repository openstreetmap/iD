describe('iD.utilObjectOmit', function() {
    it('omits keys', function() {
        var t = { a: 1, b: 2 };
        expect(iD.utilObjectOmit(t, [])).to.eql({ a: 1, b: 2 });
        expect(iD.utilObjectOmit(t, ['a'])).to.eql({ b: 2 });
        expect(iD.utilObjectOmit(t, ['a', 'b'])).to.eql({});
    });
});

