describe('iD.coreLocalizer', function() {
    describe('#localized-text', function() {
        it('appends localized text to the DOM', function() {
            var selection = d3.select(document.createElement('div'));
            selection.call(iD.localizer.t.append('icons.download' /* <- just any random string */));
            expect(selection.selectChild().classed('localized-text')).to.be.true;
        });
    });
    describe('#floatParser', function () {
        it('roundtrips English numbers', function () {
            var localizer = iD.coreLocalizer();
            var parseFloat = localizer.floatParser('en');
            expect(parseFloat((-0.1).toLocaleString(localizer.languageCode()))).to.eql(-0.1);
            expect(parseFloat((1.234).toLocaleString(localizer.languageCode()))).to.eql(1.234);
            expect(parseFloat(1234).toLocaleString(localizer.languageCode())).to.eql(1234);
            expect(parseFloat(1234.56).toLocaleString(localizer.languageCode())).to.eql(1234.56);
        });
        it('roundtrips Spanish numbers', function () {
            var localizer = iD.coreLocalizer();
            var parseFloat = localizer.floatParser('es');
            expect(parseFloat((-0.1).toLocaleString(localizer.languageCode()))).to.eql(-0.1);
            expect(parseFloat((1.234).toLocaleString(localizer.languageCode()))).to.eql(1.234);
            expect(parseFloat(1234).toLocaleString(localizer.languageCode())).to.eql(1234);
            expect(parseFloat(1234.56).toLocaleString(localizer.languageCode())).to.eql(1234.56);
        });
        it('roundtrips Arabic numbers', function () {
            var localizer = iD.coreLocalizer();
            var parseFloat = localizer.floatParser('ar-EG');
            expect(parseFloat((-0.1).toLocaleString(localizer.languageCode()))).to.eql(-0.1);
            expect(parseFloat((1.234).toLocaleString(localizer.languageCode()))).to.eql(1.234);
            expect(parseFloat(1234).toLocaleString(localizer.languageCode())).to.eql(1234);
            expect(parseFloat(1234.56).toLocaleString(localizer.languageCode())).to.eql(1234.56);
        });
        it('roundtrips Bengali numbers', function () {
            var localizer = iD.coreLocalizer();
            var parseFloat = localizer.floatParser('bn');
            expect(parseFloat((-0.1).toLocaleString(localizer.languageCode()))).to.eql(-0.1);
            expect(parseFloat((1.234).toLocaleString(localizer.languageCode()))).to.eql(1.234);
            expect(parseFloat(1234).toLocaleString(localizer.languageCode())).to.eql(1234);
            expect(parseFloat(1234.56).toLocaleString(localizer.languageCode())).to.eql(1234.56);
        });
    });
});
