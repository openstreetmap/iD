describe("iD.util.SuggestNames", function() {
    var suggestions = {
        'key': {
            'value': {
                'abcdef': {},
                'ghijkl': {}
            }
        }
    };

    var preset = {
        'id': 'key/value'
    };

    var a = iD.util.SuggestNames(preset, suggestions);

    it('provides suggestions for an entered value', function(done) {
        a('abcd', function(result) {
            expect(result).to.eql([
                {
                    title: 'abcdef',
                    value: 'abcdef',
                    dist: 0
                }
            ]);
            done();
        });
    });

    it('provides no suggestions for short values', function(done){
        a('ab', function(result) {
            expect(result).to.eql([]);
            done();
        });
    });
});
