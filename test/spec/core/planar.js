describe('iD.parseDistanceWithUnit', () => {
    it('handles valid tag values', () => {
        expect(iD.parseDistanceWithUnit(' 12.5 ', 'm')).to.equal(12.5);
        expect(iD.parseDistanceWithUnit('12cm', 'm')).to.equal(0.12);
        expect(iD.parseDistanceWithUnit('12 cm', 'm')).to.equal(0.12);
        expect(iD.parseDistanceWithUnit('12000', 'mm')).to.equal(12);
        expect(iD.parseDistanceWithUnit('5feet', 'm')).to.equal(1.5239256324291375);
        expect(iD.parseDistanceWithUnit('5ft', 'm')).to.equal(1.5239256324291375);
        expect(iD.parseDistanceWithUnit('5′', 'm')).to.equal(1.5239256324291375);
        expect(iD.parseDistanceWithUnit('5\'9"', 'm')).to.equal(1.7525260896300519);
        expect(iD.parseDistanceWithUnit('5foot 9″', 'm')).to.equal(1.7525260896300519);
        expect(iD.parseDistanceWithUnit(' 5  feet   9 inches ', 'm')).to.equal(1.7525260896300519);
        expect(iD.parseDistanceWithUnit(' 5.5′ 9.12″ ', 'm')).to.equal(1.9079666589689779);
    });

    it('handles invalid tag values', () => {
        expect(iD.parseDistanceWithUnit('', 'm')).to.be.undefined;
        expect(iD.parseDistanceWithUnit('15 bananas', 'm')).to.be.undefined;
        expect(iD.parseDistanceWithUnit('qwertyuiop', 'm')).to.be.undefined;
    });
});

describe('iD.getRadiusTag', () => {
    it('can identify the radius tag', () => {
        expect(iD.getRadiusTag({ radius: '10' })).to.equal(10);
        expect(iD.getRadiusTag({ 'hole:diameter': '10' })).to.equal(5);
        expect(iD.getRadiusTag({ 'hole:diameter': '6 ft' })).to.equal(0.9143553794574825);
        expect(iD.getRadiusTag({ 'seamark:anchor_berth:radius': '0.2' })).to.equal(0.2);
        expect(iD.getRadiusTag({
            'seamark:anchor_berth:radius': '0.2',
            'seamark:anchor_berth:units': 'nm',
        })).to.equal(370.40000000000003);

        expect(iD.getRadiusTag({})).to.be.undefined;
    });
});

describe('iD.getRadiusInPixels', () => {
    it('can convert metres to pixels', () => {
        // fake coordinate system
        const projection = ([lng, lat]) => [lng / 4 - 5, lat / 2 - 3];
        projection.invert = ([x, y]) => [(x + 5) * 4, (y + 3) * 2];

        const node = iD.osmNode({
            id: 'a',
            loc: [174.7822771, -36.8098560],
            tags: { highway: 'turning_circle', diameter: '16m' }
        });

        const px = -0.000035932611364586364;
        expect(iD.getRadiusInPixels(node, projection)).to.equal(px);
    });
});
