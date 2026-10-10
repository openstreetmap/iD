import { geoMercator as d3_geoMercator } from 'd3-geo';

describe('iD.parseDistanceWithUnit', () => {
    it('handles valid tag values', () => {
        expect(iD.parseDistanceWithUnit(' 12.5 ', 'm')).toBe(12.5);
        expect(iD.parseDistanceWithUnit('12cm', 'm')).toBe(0.12);
        expect(iD.parseDistanceWithUnit('12 cm', 'm')).toBe(0.12);
        expect(iD.parseDistanceWithUnit('12000', 'mm')).toBe(12);
        expect(iD.parseDistanceWithUnit('5feet', 'm')).toBe(1.5239256324291375);
        expect(iD.parseDistanceWithUnit('5ft', 'm')).toBe(1.5239256324291375);
        expect(iD.parseDistanceWithUnit('5\'', 'm')).toBe(1.5239256324291375);
        expect(iD.parseDistanceWithUnit('5\'9"', 'm')).toBe(1.7525260896300519);
        expect(iD.parseDistanceWithUnit('5foot 9"', 'm')).toBe(
            1.7525260896300519,
        );
        expect(iD.parseDistanceWithUnit(' 5  feet   9 inches ', 'm')).toBe(
            1.7525260896300519,
        );
        expect(iD.parseDistanceWithUnit(' 5.5\' 9.12" ', 'm')).toBe(
            1.9079666589689779,
        );
    });

    it('handles invalid tag values', () => {
        expect(iD.parseDistanceWithUnit('', 'm')).toBeUndefined();
        expect(iD.parseDistanceWithUnit('15 bananas', 'm')).toBeUndefined();
        expect(iD.parseDistanceWithUnit('qwertyuiop', 'm')).toBeUndefined();
    });
});

describe('iD.getRadiusValuesFromTags', () => {
    it('can identify the radius tag', () => {
        expect(iD.getRadiusValuesFromTags({ radius: '10' })).toStrictEqual([10]);
        expect(iD.getRadiusValuesFromTags({ 'hole:diameter': '10' })).toStrictEqual([5]);
        expect(iD.getRadiusValuesFromTags({ 'hole:diameter': '6 ft' })).toStrictEqual(
            [0.9143553794574825],
        );
        expect(iD.getRadiusValuesFromTags({ 'seamark:anchor_berth:radius': '0.2' })).toStrictEqual(
            [0.2],
        );
        expect(
            iD.getRadiusValuesFromTags({
                'seamark:anchor_berth:radius': '0.2',
                'seamark:anchor_berth:units': 'nm',
            }),
        ).toStrictEqual([370.40000000000003]);

        expect(iD.getRadiusValuesFromTags({})).toStrictEqual([]);
    });
});

describe('iD.getRadiiInPixels', () => {
    it('sanity check that the test environment has screen dimensions', () => {
        expect(window.innerWidth).toBe(1024);
        expect(window.innerHeight).toBe(768);
    });
    it('can convert metres to pixels', () => {
        const node = new iD.osmNode({
            id: 'n1',
            loc: [174.7822771, -36.809856],
            tags: { highway: 'turning_circle', diameter: '16m' },
        });

        const px = 0.0002404180484063545;
        expect(iD.getRadiiInPixels(node, d3_geoMercator())).toStrictEqual([px]);
    });
});
