describe("locale", function() {
    var saved, error;

    beforeEach(function() {
        saved = locale;
        error = console.error;
        console.error = function () {};
        locale = { _current: 'en', en: {test: 'test', foo: 'bar'}, __: {}}
    });

    afterEach(function() {
        locale = saved;
        console.error = error;
    });

    describe("t", function() {
        it("defaults to locale._current", function() {
            expect(t('test')).to.equal('test');
        });

        it("falls back to en", function() {
            locale._current = '__';
            expect(t('test')).to.equal('test');
        });
    });
});
