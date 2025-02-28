describe('iD.coreLocalizer', function() {
    describe('#localized-text', function() {
        it('appends localized text to the DOM', function() {
            const selection = d3.select(document.createElement('div'));
            selection.call(iD.localizer.t.append('icons.download' /* <- just any random string */));
            expect(selection.selectChild().classed('localized-text')).to.be.true;
        });
    });
    describe('#floatFormatter', function () {
        it('uses the specified number of fraction digits', function () {
            const localizer = iD.coreLocalizer();
            const formatFloat = localizer.floatFormatter('en');
            expect(formatFloat(-0.1)).to.eql('-0.1');
            expect(formatFloat(-0.1, 0)).to.eql('-0');
            expect(formatFloat(-0.1, 2)).to.eql('-0.10');
            expect(formatFloat(0.0, 1)).to.eql('0.0');
        });
        it('roundtrips English numbers', function () {
            const localizer = iD.coreLocalizer();
            const parseFloat = localizer.floatParser('en');
            const formatFloat = localizer.floatFormatter('en');
            expect(formatFloat(parseFloat('0.1'))).to.eql('0.1');
            expect(formatFloat(parseFloat('.1'))).to.eql('0.1');
            expect(formatFloat(parseFloat('-0.1'))).to.eql('-0.1');
            expect(formatFloat(parseFloat('1.234'))).to.eql('1.234');
            expect(formatFloat(parseFloat('1234'))).to.eql('1,234');
            expect(formatFloat(parseFloat('1234.56'))).to.eql('1,234.56');
            expect(formatFloat(parseFloat('3.14159'))).to.eql('3.14159');
        });
    });
    describe('#floatParser', function () {
        it('roundtrips English numbers', function () {
            const localizer = iD.coreLocalizer();
            const formatFloat = localizer.floatFormatter('en');
            const parseFloat = localizer.floatParser('en');
            expect(parseFloat(formatFloat(-0.1))).to.eql(-0.1);
            expect(parseFloat(formatFloat(1.234))).to.eql(1.234);
            expect(parseFloat(formatFloat(1234))).to.eql(1234);
            expect(parseFloat(formatFloat(1234.56))).to.eql(1234.56);
            expect(parseFloat(formatFloat(3.14159))).to.eql(3.14159);
        });
        it('roundtrips Spanish numbers', function () {
            const localizer = iD.coreLocalizer();
            const formatFloat = localizer.floatFormatter('es');
            const parseFloat = localizer.floatParser('es');
            expect(parseFloat(formatFloat(-0.1))).to.eql(-0.1);
            expect(parseFloat(formatFloat(1.234))).to.eql(1.234);
            expect(parseFloat(formatFloat(1234))).to.eql(1234);
            expect(parseFloat(formatFloat(1234.56))).to.eql(1234.56);
            expect(parseFloat(formatFloat(3.14159))).to.eql(3.14159);
        });
        it('roundtrips Hebrew numbers', function () {
            const localizer = iD.coreLocalizer();
            const formatFloat = localizer.floatFormatter('he');
            const parseFloat = localizer.floatParser('he');
            expect(parseFloat(formatFloat(-0.1))).to.eql(-0.1);
            expect(parseFloat(formatFloat(1.234))).to.eql(1.234);
            expect(parseFloat(formatFloat(1234))).to.eql(1234);
            expect(parseFloat(formatFloat(1234.56))).to.eql(1234.56);
            expect(parseFloat(formatFloat(3.14159))).to.eql(3.14159);
        });
        it('roundtrips Arabic numbers', function () {
            const localizer = iD.coreLocalizer();
            const formatFloat = localizer.floatFormatter('ar-EG');
            const parseFloat = localizer.floatParser('ar-EG');
            expect(parseFloat(formatFloat(-0.1))).to.eql(-0.1);
            expect(parseFloat(formatFloat(1.234))).to.eql(1.234);
            expect(parseFloat(formatFloat(1234))).to.eql(1234);
            expect(parseFloat(formatFloat(1234.56))).to.eql(1234.56);
            expect(parseFloat(formatFloat(3.14159))).to.eql(3.14159);
        });
        it('roundtrips Bengali numbers', function () {
            const localizer = iD.coreLocalizer();
            const formatFloat = localizer.floatFormatter('bn');
            const parseFloat = localizer.floatParser('bn');
            expect(parseFloat(formatFloat(-0.1))).to.eql(-0.1);
            expect(parseFloat(formatFloat(1.234))).to.eql(1.234);
            expect(parseFloat(formatFloat(1234))).to.eql(1234);
            expect(parseFloat(formatFloat(1234.56))).to.eql(1234.56);
            expect(parseFloat(formatFloat(3.14159))).to.eql(3.14159);
        });
    });
    describe('#decimalPlaceCounter', function () {
        it('counts decimal places in English numbers', function () {
            const localizer = iD.coreLocalizer();
            const countDecimalPlaces = localizer.decimalPlaceCounter('en');
            expect(countDecimalPlaces('-0')).to.eql(0);
            expect(countDecimalPlaces('-0.1')).to.eql(1);
            expect(countDecimalPlaces('1.234')).to.eql(3);
            expect(countDecimalPlaces('10')).to.eql(0);
        });
    });
});
