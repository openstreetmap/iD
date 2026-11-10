import { PRESET_GALLERY_LAYOUT, presetGallerySegment } from '../../../modules/actions/add_preset_gallery';

describe('iD.actionAddPresetGallery', function () {
    const { origin, segmentLengthMeters, spacingMeters, segmentsPerRow, rowGapMeters } = PRESET_GALLERY_LAYOUT;
    const metersPerDegreeLat = iD.geoLatToMeters(1);
    const metersPerDegreeLon = iD.geoLonToMeters(1, origin[1]);

    // [index, expected column, expected row]
    [
        [0, 0, 0],
        [1, 1, 0],
        [segmentsPerRow - 1, segmentsPerRow - 1, 0],
        [segmentsPerRow, 0, 1],
        [2 * segmentsPerRow + 3, 3, 2]
    ].forEach(function ([index, column, row]) {
        it(`places segment ${index} at column ${column}, row ${row}`, function () {
            const [south, north] = presetGallerySegment(index);
            expect((south[0] - origin[0]) * metersPerDegreeLon).toBeCloseTo(column * spacingMeters, 6);
            expect((origin[1] - south[1]) * metersPerDegreeLat).toBeCloseTo(row * (segmentLengthMeters + rowGapMeters), 6);
            expect(north[0]).toEqual(south[0]);
            expect((north[1] - south[1]) * metersPerDegreeLat).toBeCloseTo(segmentLengthMeters, 6);
        });
    });

    it('adds one two-node way per tag set, in order', function () {
        const tagSets = [{ highway: 'service' }, { highway: 'footway', footway: 'sidewalk' }];
        const graph = iD.actionAddPresetGallery(tagSets)(new iD.coreGraph());
        const ways = Object.values(graph.entities).filter((entity) => entity.type === 'way');

        expect(ways.map((way) => way.tags)).toEqual(tagSets);
        ways.forEach(function (way, index) {
            expect(way.nodes.map((id) => graph.entity(id).loc)).toEqual(presetGallerySegment(index));
        });
    });
});
