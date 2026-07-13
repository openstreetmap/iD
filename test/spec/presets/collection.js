describe('iD.presetCollection', function() {
    // Note: __TEST is added to these because the search uses localized
    //   preset.name() keyed on id, which would use the names from en.json.
    // Except for fallback presets which must have those names because of the logic in fallback()
    var p = {
        point: iD.presetPreset('point',
            { name: 'Point', tags: {}, geometry: ['point'], matchScore: 0.1 }
        ),
        line: iD.presetPreset('line',
            { name: 'Line', tags: {}, geometry: ['line'], matchScore: 0.1 }
        ),
        area: iD.presetPreset('area',
            { name: 'Area', tags: { area: 'yes' }, geometry: ['area'], matchScore: 0.1 }
        ),
        grill: iD.presetPreset('__TEST/amenity/bbq',
            { name: 'Grill', tags: { amenity: 'bbq' }, geometry: ['point'], terms: [] }
        ),
        sandpit: iD.presetPreset('__TEST/amenity/grit_bin',
            { name: 'Sandpit', tags: { amenity: 'grit_bin' }, geometry: ['point'], terms: [] }
        ),
        residential: iD.presetPreset('__TEST/highway/residential',
            { name: 'Residential Area', tags: { highway: 'residential' }, geometry: ['point', 'area'], terms: [] }
        ),
        grass1: iD.presetPreset('__TEST/landuse/grass1',
            { name: 'Grass', tags: { landuse: 'grass' }, geometry: ['point', 'area'], terms: [] }
        ),
        grass2: iD.presetPreset('__TEST/landuse/grass2',
            { name: 'Ğṝȁß', tags: { landuse: 'ğṝȁß' }, geometry: ['point', 'area'], terms: [] }
        ),
        park: iD.presetPreset('__TEST/leisure/park',
            { name: 'Park', tags: { leisure: 'park' }, geometry: ['point', 'area'], aliases: ['Field'], terms: [ 'grass' ], matchScore: 0.5 }
        ),
        parking: iD.presetPreset('__TEST/amenity/parking',
            { name: 'Parking', tags: { amenity: 'parking' }, geometry: ['point', 'area'], terms: [ 'cars' ] }
        ),
        soccer: iD.presetPreset('__TEST/leisure/pitch/soccer',
            { name: 'Soccer Field', tags: { leisure: 'pitch', sport: 'soccer' }, geometry: ['point', 'area'], terms: ['fußball'] }
        ),
        football: iD.presetPreset('__TEST/leisure/pitch/american_football',
            { name: 'Football Field', tags: { leisure: 'pitch', sport: 'american_football' }, geometry: ['point', 'area'], terms: ['gridiron'] }
        )
    };


    var c = iD.presetCollection([
        p.point, p.line, p.area, p.grill, p.sandpit, p.residential,
        p.grass1, p.grass2, p.park, p.parking, p.soccer, p.football
    ]);

    describe('#item', function() {
        it('fetches a preset by id', function() {
            expect(c.item('__TEST/highway/residential')).toEqual(p.residential);
        });
    });

    describe('#index', function() {
        it('returns preset position in the collection', function() {
            expect(c.index('point')).toEqual(0);
        });
        it('return -1 when given id for preset not in the collection', function() {
            expect(c.index('foobar')).toEqual(-1);
        });
    });

    describe('#matchGeometry', function() {
        it('returns a new collection only containing presets matching a geometry', function() {
            expect(c.matchGeometry('area').collection).toEqual(expect.arrayContaining(
                [p.area, p.residential, p.park, p.soccer, p.football]
            ));
        });
    });

    describe('#search', function() {
        it('matches leading name', function() {
            var result = c.search('resid', 'area').collection;
            expect(result.indexOf(p.residential)).toEqual(0);  // 1. 'Residential' (by name)
        });

        it('returns alternate matches in correct order', function() {
            var result = c.search('gri', 'point').matchGeometry('point').collection;
            expect(result.indexOf(p.grill), 'Grill').toEqual(0);            // 1. 'Grill' (leading name)
            expect(result.indexOf(p.football), 'Football').toEqual(1);      // 2. 'Football' (leading term 'gridiron')
            expect(result.indexOf(p.sandpit), 'Sandpit').toEqual(2);        // 3. 'Sandpit' (leading tag value 'grit_bin')
            expect(result.indexOf(p.grass1), 'Grass').toBeGreaterThanOrEqual(3);   // 4. 'Grass' (similar name)
            expect(result.indexOf(p.grass1), 'Grass').toBeLessThanOrEqual(5);
            expect(result.indexOf(p.grass2), 'Ğṝȁß').toBeGreaterThanOrEqual(3);    // 5. 'Ğṝȁß' (similar name)
            expect(result.indexOf(p.grass2), 'Ğṝȁß').toBeLessThanOrEqual(5);
            expect(result.indexOf(p.park), 'Park').toBeGreaterThanOrEqual(3);      // 6. 'Park' (similar term 'grass')
            expect(result.indexOf(p.park), 'Park').toBeLessThanOrEqual(5);
        });

        it('matches alias', function() {
            var result = c.search('Field', 'area').collection;
            expect(result.indexOf(p.park)).toEqual(0);  // 1. 'Park' (by alias)
        });

        it('sorts preset with matchScore penalty below others', function() {
            var result = c.search('par', 'point').matchGeometry('point').collection;
            expect(result.indexOf(p.parking), 'Parking').toEqual(0);   // 1. 'Parking' (default matchScore)
            expect(result.indexOf(p.park), 'Park').toEqual(1);         // 2. 'Park' (low matchScore)
        });

        it('ignores matchScore penalty for exact name match', function() {
            var result = c.search('park', 'point').matchGeometry('point').collection;
            expect(result.indexOf(p.park), 'Park').toEqual(0);         // 1. 'Park' (low matchScore)
            expect(result.indexOf(p.parking), 'Parking').toEqual(1);   // 2. 'Parking' (default matchScore)
        });

        it('considers diacritics on exact matches', function() {
            var result = c.search('ğṝȁ', 'point').matchGeometry('point').collection;
            expect(result.indexOf(p.grass2), 'Ğṝȁß').toEqual(0);    // 1. 'Ğṝȁß'  (leading name)
            expect(result.indexOf(p.grass1), 'Grass').toEqual(1);   // 2. 'Grass' (similar name)
        });

        it('replaces diacritics on fuzzy matches', function() {
            var result = c.search('graß', 'point').matchGeometry('point').collection;
            expect(result.indexOf(p.grass1), 'Grass').toBeGreaterThanOrEqual(0);   // 1. 'Grass' (similar name)
            expect(result.indexOf(p.grass1), 'Grass').toBeLessThanOrEqual(1);
            expect(result.indexOf(p.grass2), 'Ğṝȁß').toBeGreaterThanOrEqual(0);    // 2. 'Ğṝȁß'  (similar name)
            expect(result.indexOf(p.grass2), 'Ğṝȁß').toBeLessThanOrEqual(1);
        });

        it('includes the appropriate fallback preset', function() {
            expect(c.search('foo', 'point').collection, 'point').toContain(p.point);
            expect(c.search('foo', 'line').collection, 'line').toContain(p.line);
            expect(c.search('foo', 'area').collection, 'area').toContain(p.area);
        });

        it('excludes presets with searchable: false', function() {
            var excluded = iD.presetPreset('excluded', {
                name: 'excluded',
                tags: { amenity: 'excluded' },
                geometry: ['point'],
                searchable: false
            });
            var collection = iD.presetCollection([excluded, p.point]);
            expect(collection.search('excluded', 'point').collection).not.toContain(excluded);
        });

        it('matches tag key=value', function() {
            var result = c.search('landuse=grass', 'area').collection;
            expect(result.indexOf(p.grass1)).toEqual(0);  // 1. 'Grass' (by tag key=value)
        });

        it.each([
            'private grill',
            'very private and secret mysterious grill',
            'private grill in garden',
        ])('returns matches also when search term includes the preset name as substring', function(search) {
            var result = c.search(search, 'point').matchGeometry('point').collection;
            expect(result.indexOf(p.grill), 'Grill').toEqual(0);
        });
    });
});
