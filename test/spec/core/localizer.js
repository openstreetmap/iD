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
            var formatFloat = localizer.floatFormatter('en');
            var parseFloat = localizer.floatParser('en');
            expect(parseFloat(formatFloat(-0.1))).to.eql(-0.1);
            expect(parseFloat(formatFloat(1.234))).to.eql(1.234);
            expect(parseFloat(formatFloat(1234))).to.eql(1234);
            expect(parseFloat(formatFloat(1234.56))).to.eql(1234.56);
            expect(parseFloat(formatFloat(3.14159))).to.eql(3.14159);
        });
        it('roundtrips Spanish numbers', function () {
            var localizer = iD.coreLocalizer();
            var formatFloat = localizer.floatFormatter('es');
            var parseFloat = localizer.floatParser('es');
            expect(parseFloat(formatFloat(-0.1))).to.eql(-0.1);
            expect(parseFloat(formatFloat(1.234))).to.eql(1.234);
            expect(parseFloat(formatFloat(1234))).to.eql(1234);
            expect(parseFloat(formatFloat(1234.56))).to.eql(1234.56);
            expect(parseFloat(formatFloat(3.14159))).to.eql(3.14159);
        });
        it('roundtrips Hebrew numbers', function () {
            var localizer = iD.coreLocalizer();
            var formatFloat = localizer.floatFormatter('he');
            var parseFloat = localizer.floatParser('he');
            expect(parseFloat(formatFloat(-0.1))).to.eql(-0.1);
            expect(parseFloat(formatFloat(1.234))).to.eql(1.234);
            expect(parseFloat(formatFloat(1234))).to.eql(1234);
            expect(parseFloat(formatFloat(1234.56))).to.eql(1234.56);
            expect(parseFloat(formatFloat(3.14159))).to.eql(3.14159);
        });
        it('roundtrips Arabic numbers', function () {
            var localizer = iD.coreLocalizer();
            var formatFloat = localizer.floatFormatter('ar-EG');
            var parseFloat = localizer.floatParser('ar-EG');
            expect(parseFloat(formatFloat(-0.1))).to.eql(-0.1);
            expect(parseFloat(formatFloat(1.234))).to.eql(1.234);
            expect(parseFloat(formatFloat(1234))).to.eql(1234);
            expect(parseFloat(formatFloat(1234.56))).to.eql(1234.56);
            expect(parseFloat(formatFloat(3.14159))).to.eql(3.14159);
        });
        it('roundtrips Bengali numbers', function () {
            var localizer = iD.coreLocalizer();
            var formatFloat = localizer.floatFormatter('bn');
            var parseFloat = localizer.floatParser('bn');
            expect(parseFloat(formatFloat(-0.1))).to.eql(-0.1);
            expect(parseFloat(formatFloat(1.234))).to.eql(1.234);
            expect(parseFloat(formatFloat(1234))).to.eql(1234);
            expect(parseFloat(formatFloat(1234.56))).to.eql(1234.56);
            expect(parseFloat(formatFloat(3.14159))).to.eql(3.14159);
        });
    });
});
