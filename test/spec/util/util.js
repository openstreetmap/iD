describe('iD.util', function() {
    it('utilTagText', function() {
        expect(iD.utilTagText({})).to.eql('');
        expect(iD.utilTagText({tags:{foo:'bar'}})).to.eql('foo=bar');
        expect(iD.utilTagText({tags:{foo:'bar',two:'three'}})).to.eql('foo=bar, two=three');
    });

    it('utilStringQs', function() {
        expect(iD.utilStringQs('foo=bar')).to.eql({foo: 'bar'});
        expect(iD.utilStringQs('foo=bar&one=2')).to.eql({foo: 'bar', one: '2' });
        expect(iD.utilStringQs('')).to.eql({});
    });

    it('utilQsString', function() {
        expect(iD.utilQsString({ foo: 'bar' })).to.eql('foo=bar');
        expect(iD.utilQsString({ foo: 'bar', one: 2 })).to.eql('foo=bar&one=2');
        expect(iD.utilQsString({})).to.eql('');
    });

    it('utilGetPrototypeOf', function() {
        var a = function() {};
        a.prototype = { foo: 'foo' };
        expect(iD.utilGetPrototypeOf({})).to.eql({});
        expect(iD.utilGetPrototypeOf(new a())).to.eql({ foo: 'foo' });
    });

    describe('utilEditDistance', function() {
        it('returns zero for same strings', function() {
            expect(iD.utilEditDistance('foo', 'foo')).to.eql(0);
        });

        it('reports an insertion of 1', function() {
            expect(iD.utilEditDistance('foo', 'fooa')).to.eql(1);
        });

        it('reports a replacement of 1', function() {
            expect(iD.utilEditDistance('foob', 'fooa')).to.eql(1);
        });

        it('does not fail on empty input', function() {
            expect(iD.utilEditDistance('', '')).to.eql(0);
        });
    });

    describe('utilAsyncMap', function() {
        it('handles correct replies', function() {
            iD.utilAsyncMap([1, 2, 3],
                function(d, c) { c(null, d * 2); },
                function(err, res) {
                    expect(err).to.eql([null, null, null]);
                    expect(res).to.eql([2, 4, 6]);
                });
        });
        it('handles errors', function() {
            iD.utilAsyncMap([1, 2, 3],
                function(d, c) { c('whoops ' + d, null); },
                function(err, res) {
                    expect(err).to.eql(['whoops 1', 'whoops 2', 'whoops 3']);
                    expect(res).to.eql([null, null, null]);
                });
        });
    });
});
