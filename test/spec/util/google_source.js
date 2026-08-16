import { utilGoogleImageryRegex } from '../../../modules/util/google_source';

describe('utilGoogleImageryRegex', function() {
    it.each([
        'https://goo.gl/maps/example',
        'https://maps.app.goo.gl/example',
        '//share.goo.gl/example',
        'goo.gl/example'
    ])('matches a goo.gl shortlink host: %s', function(template) {
        expect(utilGoogleImageryRegex.test(template)).toBe(true);
    });

    it.each([
        'https://notgoo.gl/example',
        'https://goo.gl.example.com/map',
        'https://example.com/goo.gl/map'
    ])('does not match a lookalike goo.gl host: %s', function(template) {
        expect(utilGoogleImageryRegex.test(template)).toBe(false);
    });
});
