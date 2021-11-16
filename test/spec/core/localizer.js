describe('iD.coreLocalizer', function () {
    describe('#floatParser', function () {
        it('formats Bengali numbers', function () {
            expect('Intl' in window).to.eql(true);
            expect('NumberFormat' in Intl).to.eql(true);
            const format = new Intl.NumberFormat('bn');
            expect('formatToParts' in format).to.eql(true);
        });
    });
});
