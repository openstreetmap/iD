describe('iD.Util', function() {
    it('.trueObj', function() {
        expect(iD.util.trueObj(['a', 'b', 'c'])).to.eql({ a: true, b: true, c: true });
        expect(iD.util.trueObj([])).to.eql({});
    });

    it('.tagText', function() {
        expect(iD.util.tagText({})).to.eql('');
        expect(iD.util.tagText({tags:{foo:'bar'}})).to.eql('foo=bar');
        expect(iD.util.tagText({tags:{foo:'bar',two:'three'}})).to.eql('foo=bar, two=three');
    });

    it('.stringQs', function() {
        expect(iD.util.stringQs('foo=bar')).to.eql({foo: 'bar'});
        expect(iD.util.stringQs('foo=bar&one=2')).to.eql({foo: 'bar', one: '2' });
        expect(iD.util.stringQs('')).to.eql({});
    });

    it('.qsString', function() {
        expect(iD.util.qsString({ foo: 'bar' })).to.eql('foo=bar');
        expect(iD.util.qsString({ foo: 'bar', one: 2 })).to.eql('foo=bar&one=2');
        expect(iD.util.qsString({})).to.eql('');
    });
});
