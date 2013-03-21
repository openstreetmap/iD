describe('translations', function() {
    var languages = [], languageKeys = {};

    function getKeys(lang, keys, prefix) {
        keys = keys || [];
        prefix = prefix || '';
        for (var i in lang) {
            keys.push(prefix + i);
            if (typeof lang[i] === 'object') {
                getKeys(lang[i], keys, i + '.');
            }
        }
        return keys;
    }

    describe('#translation-differences', function() {

        xit('does not differ between languages', function() {
            languages = _(locale).keys()
                .without('current', '_current').value();

            languageKeys = _.reduce(languages, function(mem, lang) {
                 mem[lang] = getKeys(locale[lang]);
                 return mem;
            }, {});

            var allkeys = _.flatten(_.values(languageKeys));

            _.forEach(languageKeys, function(l, k) {
                var diff = _.difference(allkeys, l).join(", ");
                expect(diff).to.equal("");
            });
        });

    });
});
