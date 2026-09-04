import { geoExtent } from '../../../modules/geo';
import { rendererDefaultBackground } from '../../../modules/renderer/background';


describe('iD.rendererDefaultBackground', function() {
    const extent = geoExtent([0, 0], [10, 10]);

    function source(id, polygon, options = {}) {
        return {
            id,
            polygon,
            overlay: !!options.overlay,
            startDate: options.startDate,
            endDate: options.endDate,
            best: () => options.best !== false
        };
    }

    it('prefers the source with more-specific coverage', function() {
        const broad = source('broad', [[[-5, -5], [-5, 15], [15, 15], [15, -5], [-5, -5]]]);
        const specific = source('specific', [[[0, 0], [0, 10], [6, 10], [6, 0], [0, 0]]]);

        expect(rendererDefaultBackground([broad, specific], extent)).toBe(specific);
    });

    it('prefers the most recent equally specific source when all have dates', function() {
        const polygon = [extent.polygon()];
        const older = source('older', polygon, { endDate: '2023-01-01T00:00:00.000Z' });
        const newer = source('newer', polygon, { endDate: '2026-01-01T00:00:00.000Z' });

        expect(rendererDefaultBackground([older, newer], extent)).toBe(newer);
    });

    it('uses start dates when end dates are unavailable', function() {
        const polygon = [extent.polygon()];
        const older = source('older', polygon, { startDate: '2023-01-01T00:00:00.000Z' });
        const newer = source('newer', polygon, { startDate: '2026-01-01T00:00:00.000Z' });

        expect(rendererDefaultBackground([older, newer], extent)).toBe(newer);
    });

    it('preserves the existing order when any equally specific source lacks a date', function() {
        const polygon = [extent.polygon()];
        const first = source('first', polygon);
        const dated = source('dated', polygon, { endDate: '2026-01-01T00:00:00.000Z' });

        expect(rendererDefaultBackground([first, dated], extent)).toBe(first);
    });

    it('preserves the existing order when any equally specific source has an invalid date', function() {
        const polygon = [extent.polygon()];
        const first = source('first', polygon, { endDate: 'not-a-date' });
        const dated = source('dated', polygon, { endDate: '2026-01-01T00:00:00.000Z' });

        expect(rendererDefaultBackground([first, dated], extent)).toBe(first);
    });

    it('preserves the existing order when equally specific sources have equal dates', function() {
        const polygon = [extent.polygon()];
        const first = source('first', polygon, { endDate: '2026-01-01T00:00:00.000Z' });
        const second = source('second', polygon, { endDate: '2026-01-01T00:00:00.000Z' });

        expect(rendererDefaultBackground([first, second], extent)).toBe(first);
    });

    it('ignores non-best sources and overlays', function() {
        const polygon = [extent.polygon()];
        const fallback = source('fallback', polygon);
        const notBest = source('not-best', polygon, { best: false });
        const overlay = source('overlay', polygon, { overlay: true });

        expect(rendererDefaultBackground([notBest, overlay, fallback], extent)).toBe(fallback);
    });

    it('requires a source to cover more than half the view', function() {
        const half = source('half', [[[0, 0], [0, 10], [5, 10], [5, 0], [0, 0]]]);

        expect(rendererDefaultBackground([half], extent)).toBeNull();
    });
});
