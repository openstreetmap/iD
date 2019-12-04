describe('test some capabilities of PhantomJS', function () {
    it('Array.from(Set)', function () {
        var s = new Set([1,1]);
        var result = Array.from(s);
        expect(result).to.eql([1]);
    });
    it('has ArrayBuffer.isView', function () {
        expect(typeof ArrayBuffer.isView).to.eql('function');
    });
});
