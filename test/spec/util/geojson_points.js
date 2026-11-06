describe('iD.utilGeojsonPoints', function() {
    var address = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-61.5, 47.6] },
        properties: { 'addr:housenumber': '50', 'addr:street': ' Chemin Principal ' }
    };
    var tags = { 'addr:housenumber': '50', 'addr:street': 'Chemin Principal' };

    it.each([
        ['a FeatureCollection', { type: 'FeatureCollection', features: [address] }, [{ loc: [-61.5, 47.6], tags: tags }]],
        ['a Feature', address, [{ loc: [-61.5, 47.6], tags: tags }]],
        ['non string and empty properties skipped', { ...address, properties: { ...address.properties, numero: 50, note: '' } },
            [{ loc: [-61.5, 47.6], tags: tags }]],
        ['not a point', { ...address, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } }, []],
        ['out of range', { ...address, geometry: { type: 'Point', coordinates: [200, 47.6] } }, []],
        ['without tags', { ...address, properties: { numero: 50 } }, []],
        ['not GeoJSON', { foo: 'bar' }, []],
    ])('%s', function(_, geojson, expected) {
        expect(iD.utilGeojsonPoints(JSON.stringify(geojson))).toEqual(expected);
    });

    it('returns no points for a text that is not JSON', function() {
        expect(iD.utilGeojsonPoints('50 Chemin Principal')).toEqual([]);
    });
});
