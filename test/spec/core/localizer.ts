import { select as d3_select } from 'd3-selection';

describe('iD.coreLocalizer', function() {
    describe('#localized-text', function() {
        it('appends localized text to the DOM', function() {
            var selection = d3_select(document.createElement('div'));
            selection.call(iD.localizer.t_append('icons.download' /* <- just any random string */));
            expect(selection.selectChild().classed('localized-text')).toBe(true);
        });
    });
    describe('#floatFormatter', function () {
        it('uses the specified number of fraction digits', function () {
            var localizer = new iD.coreLocalizer();
            var formatFloat = localizer.floatFormatter('en');
            expect(formatFloat(-0.1)).toEqual('-0.1');
            expect(formatFloat(-0.1, 0)).toEqual('-0');
            expect(formatFloat(-0.1, 2)).toEqual('-0.10');
            expect(formatFloat(0.0, 1)).toEqual('0.0');
        });
        it('roundtrips English numbers', function () {
            var localizer = new iD.coreLocalizer();
            var parseFloat = localizer.floatParser('en');
            var formatFloat = localizer.floatFormatter('en');
            expect(formatFloat(parseFloat('0.1'))).toEqual('0.1');
            expect(formatFloat(parseFloat('.1'))).toEqual('0.1');
            expect(formatFloat(parseFloat('-0.1'))).toEqual('-0.1');
            expect(formatFloat(parseFloat('1.234'))).toEqual('1.234');
            expect(formatFloat(parseFloat('1234'))).toEqual('1,234');
            expect(formatFloat(parseFloat('1234.56'))).toEqual('1,234.56');
            expect(formatFloat(parseFloat('3.14159'))).toEqual('3.14159');
        });
    });
    describe('#floatParser', function () {
        it('roundtrips English numbers', function () {
            var localizer = new iD.coreLocalizer();
            var formatFloat = localizer.floatFormatter('en');
            var parseFloat = localizer.floatParser('en');
            expect(parseFloat(formatFloat(-0.1))).toEqual(-0.1);
            expect(parseFloat(formatFloat(1.234))).toEqual(1.234);
            expect(parseFloat(formatFloat(1234))).toEqual(1234);
            expect(parseFloat(formatFloat(1234.56))).toEqual(1234.56);
            expect(parseFloat(formatFloat(3.14159))).toEqual(3.14159);
        });
        it('roundtrips Spanish numbers', function () {
            var localizer = new iD.coreLocalizer();
            var formatFloat = localizer.floatFormatter('es');
            var parseFloat = localizer.floatParser('es');
            expect(parseFloat(formatFloat(-0.1))).toEqual(-0.1);
            expect(parseFloat(formatFloat(1.234))).toEqual(1.234);
            expect(parseFloat(formatFloat(1234))).toEqual(1234);
            expect(parseFloat(formatFloat(1234.56))).toEqual(1234.56);
            expect(parseFloat(formatFloat(3.14159))).toEqual(3.14159);
        });
        it('roundtrips Hebrew numbers', function () {
            var localizer = new iD.coreLocalizer();
            var formatFloat = localizer.floatFormatter('he');
            var parseFloat = localizer.floatParser('he');
            expect(parseFloat(formatFloat(-0.1))).toEqual(-0.1);
            expect(parseFloat(formatFloat(1.234))).toEqual(1.234);
            expect(parseFloat(formatFloat(1234))).toEqual(1234);
            expect(parseFloat(formatFloat(1234.56))).toEqual(1234.56);
            expect(parseFloat(formatFloat(3.14159))).toEqual(3.14159);
        });
        it('roundtrips Arabic numbers', function () {
            var localizer = new iD.coreLocalizer();
            var formatFloat = localizer.floatFormatter('ar-EG');
            var parseFloat = localizer.floatParser('ar-EG');
            expect(parseFloat(formatFloat(-0.1))).toEqual(-0.1);
            expect(parseFloat(formatFloat(1.234))).toEqual(1.234);
            expect(parseFloat(formatFloat(1234))).toEqual(1234);
            expect(parseFloat(formatFloat(1234.56))).toEqual(1234.56);
            expect(parseFloat(formatFloat(3.14159))).toEqual(3.14159);
        });
        it('roundtrips Bengali numbers', function () {
            var localizer = new iD.coreLocalizer();
            var formatFloat = localizer.floatFormatter('bn');
            var parseFloat = localizer.floatParser('bn');
            expect(parseFloat(formatFloat(-0.1))).toEqual(-0.1);
            expect(parseFloat(formatFloat(1.234))).toEqual(1.234);
            expect(parseFloat(formatFloat(1234))).toEqual(1234);
            expect(parseFloat(formatFloat(1234.56))).toEqual(1234.56);
            expect(parseFloat(formatFloat(3.14159))).toEqual(3.14159);
        });
        it('roundtrips Persian numerals', () => {
            const localizer = new iD.coreLocalizer();
            const formatFloat = localizer.floatFormatter('fa');
            const parseFloat = localizer.floatParser('fa');
            expect(parseFloat(formatFloat(-1))).toEqual(-1);
            expect(parseFloat(formatFloat(-0.1))).toEqual(-0.1);
            expect(parseFloat(formatFloat(1234.56))).toEqual(1234.56);
        });
        it('roundtrips Chinese numerals', () => {
            const localizer = new iD.coreLocalizer();
            const formatFloat = localizer.floatFormatter('zh-u-nu-hanidec');
            const parseFloat = localizer.floatParser('zh-u-nu-hanidec');
            expect(parseFloat(formatFloat(-1))).toEqual(-1);
            expect(parseFloat(formatFloat(-0.1))).toEqual(-0.1);
            expect(parseFloat(formatFloat(1234.56))).toEqual(1234.56);
        });
    });
    describe('#decimalPlaceCounter', function () {
        it('counts decimal places in English numbers', function () {
            var localizer = new iD.coreLocalizer();
            var countDecimalPlaces = localizer.decimalPlaceCounter('en');
            expect(countDecimalPlaces('-0')).toEqual(0);
            expect(countDecimalPlaces('-0.1')).toEqual(1);
            expect(countDecimalPlaces('1.234')).toEqual(3);
            expect(countDecimalPlaces('10')).toEqual(0);
        });
    });

    describe('localesToUseFrom', () => {
        const SUPPORTED_LANGS = {
            en: true,
            'en-AU': true,
            fr: true,
            zh: true,
            'zh-CN': true,
        };

        it.each([
            /* [requested, matching] */
            [[], ['en']],
            [['en'], ['en']],
            [['en-AU'], ['en-AU', 'en']],
            [['zh'], ['zh', 'en']],
            [['zh-CN'], ['zh-CN', 'zh', 'en']],
            [['zh-Hans-CN'], ['zh-CN', 'zh', 'en']],
            [['zh-Hans'], ['zh', 'en']],
            [['fr-Latn'], ['fr', 'en']],
        ])('resolves %s to %s', (requested, matching) => {
            const localizer = new iD.coreLocalizer();
            localizer.preferredLocaleCodes(requested);
            expect(localizer.localesToUseFrom(SUPPORTED_LANGS)).toStrictEqual(matching);
        });

        afterEach(() => {
            new iD.coreLocalizer().preferredLocaleCodes([]);
        });
    });

    describe('#keys', function () {
        it('returns keys from the requested locale', function () {
            const localizer = new iD.coreLocalizer();
            const internals = localizer as any;

            internals._localeStrings = {
                tagging: {
                    bg: {
                        presets: {
                            fields: {
                                'crossing/markings-BG': {
                                    options: {
                                        zebra: 'Зебра',
                                        dots: 'Точки'
                                    }
                                }
                            }
                        }
                    }
                }
            };

            internals._localeCodes = ['bg', 'en'];

            expect(localizer.keys(
                '_tagging.presets.fields.crossing/markings-BG.options',
                'bg'
            )).toStrictEqual(['zebra', 'dots']);
        });

        it('falls back to the next locale when the requested path is missing', function () {
            const localizer = new iD.coreLocalizer();
            const internals = localizer as any;

            internals._localeStrings = {
                tagging: {
                    en: {
                        presets: {
                            fields: {
                                'crossing/markings-BG': {
                                    options: {
                                        zebra: 'Longitudinal Bars',
                                        surface: 'Surface Treatment Only'
                                    }
                                }
                            }
                        }
                    }
                }
            };

            internals._localeCodes = ['bg', 'en'];

            expect(localizer.keys(
                '_tagging.presets.fields.crossing/markings-BG.options',
                'bg'
            )).toStrictEqual(['zebra', 'surface']);
        });

        it('returns an empty array when the translation path does not exist', function () {
            const localizer = new iD.coreLocalizer();

            expect(localizer.keys('_tagging.presets.fields.unknown.options', 'en'))
                .toStrictEqual([]);
        });
    });
});
