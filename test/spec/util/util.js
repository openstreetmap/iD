describe('iD.Util', function() {
    it('#tagText', function() {
        expect(iD.util.tagText({})).to.eql('');
        expect(iD.util.tagText({tags:{foo:'bar'}})).to.eql('foo=bar');
        expect(iD.util.tagText({tags:{foo:'bar',two:'three'}})).to.eql('foo=bar, two=three');
    });

    it('#stringQs', function() {
        expect(iD.util.stringQs('foo=bar')).to.eql({foo: 'bar'});
        expect(iD.util.stringQs('foo=bar&one=2')).to.eql({foo: 'bar', one: '2' });
        expect(iD.util.stringQs('')).to.eql({});
    });

    it('#qsString', function() {
        expect(iD.util.qsString({ foo: 'bar' })).to.eql('foo=bar');
        expect(iD.util.qsString({ foo: 'bar', one: 2 })).to.eql('foo=bar&one=2');
        expect(iD.util.qsString({})).to.eql('');
    });

    it('#getPrototypeOf', function() {
        var a = function() {};
        a.prototype = { foo: 'foo' };
        expect(iD.util.getPrototypeOf({})).to.eql({});
        expect(iD.util.getPrototypeOf(new a())).to.eql({ foo: 'foo' });
    });

    describe('#editDistance', function() {
        it('returns zero for same strings', function() {
            expect(iD.util.editDistance('foo', 'foo')).to.eql(0);
        });

        it('reports an insertion of 1', function() {
            expect(iD.util.editDistance('foo', 'fooa')).to.eql(1);
        });

        it('reports a replacement of 1', function() {
            expect(iD.util.editDistance('foob', 'fooa')).to.eql(1);
        });

        it('does not fail on empty input', function() {
            expect(iD.util.editDistance('', '')).to.eql(0);
        });
    });

    describe('#asyncMap', function() {
        it('handles correct replies', function() {
            iD.util.asyncMap([1, 2, 3],
                function(d, c) { c(null, d * 2); },
                function(err, res) {
                    expect(err).to.eql([null, null, null]);
                    expect(res).to.eql([2, 4, 6]);
                });
        });
        it('handles errors', function() {
            iD.util.asyncMap([1, 2, 3],
                function(d, c) { c('whoops ' + d, null); },
                function(err, res) {
                    expect(err).to.eql(['whoops 1', 'whoops 2', 'whoops 3']);
                    expect(res).to.eql([null, null, null]);
                });
        });
    });
});
