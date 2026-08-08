import {
    cleanCustomTemplate,
    customIdNumber,
    customTemplateLabel
} from '../../../modules/renderer/custom_backgrounds';


describe('custom_backgrounds helpers', function() {
    describe('cleanCustomTemplate', function() {
        it('trims leading/trailing space and strips newlines from paste', function() {
            expect(cleanCustomTemplate('  https://ex.com/{z}/{x}/{y}.png\n\n'))
                .toBe('https://ex.com/{z}/{x}/{y}.png');
        });

        it('returns empty for whitespace-only input', function() {
            expect(cleanCustomTemplate('   \n')).toBe('');
            expect(cleanCustomTemplate('')).toBe('');
        });
    });

    describe('customTemplateLabel', function() {
        it('keeps host and folders only', function() {
            expect(customTemplateLabel(
                'https://www.mapproxy.codefor.de/tiles/1.0.0/alkis_sw/mercator/{z}/{x}/{y}.png?token=secret'
            )).toBe('mapproxy.codefor.de/tiles/1.0.0/alkis_sw/mercator');
        });

        it('strips protocol, www, query, hash, and tile tokens', function() {
            expect(customTemplateLabel(
                'http://www.example.com/tiles/berlin/{z}/{x}/{y}.png#foo'
            )).toBe('example.com/tiles/berlin');
        });
    });

    describe('customIdNumber', function() {
        it('parses the numeric suffix of custom-<n> ids', function() {
            expect(customIdNumber('custom-7')).toBe(7);
            expect(customIdNumber('custom')).toBe(0);
            expect(customIdNumber('Bing')).toBe(0);
        });
    });
});
