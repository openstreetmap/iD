describe('iD.presetCollection', function() {
    var p = {
        point: iD.presetPreset('point', {
            name: 'Point',
            tags: {},
            geometry: ['point']
        }),
        line: iD.presetPreset('line', {
            name: 'Line',
            tags: {},
            geometry: ['line']
        }),
        area: iD.presetPreset('area', {
            name: 'Area',
            tags: {},
            geometry: ['area']
        }),
        grill: iD.presetPreset('__test/amenity/bbq', {
            name: 'Grill',
            tags: { amenity: 'bbq' },
            geometry: ['point'],
            terms: []
        }),
        sandpit: iD.presetPreset('__test/amenity/grit_bin', {
            name: 'Sandpit',
            tags: { amenity: 'grit_bin' },
            geometry: ['point'],
            terms: []
        }),
        residential: iD.presetPreset('__test/highway/residential', {
            name: 'Residential Area',
            tags: { highway: 'residential' },
            geometry: ['point', 'area'],
            terms: []
        }),
        grass1: iD.presetPreset('__test/landuse/grass1', {
            name: 'Grass',
            tags: { landuse: 'grass' },
            geometry: ['point', 'area'],
            terms: []
        }),
        grass2: iD.presetPreset('__test/landuse/grass2', {
            name: 'Ğṝȁß',
            tags: { landuse: 'ğṝȁß' },
            geometry: ['point', 'area'],
            terms: []
        }),
        park: iD.presetPreset('__test/leisure/park', {
            name: 'Park',
            tags: { leisure: 'park' },
            geometry: ['point', 'area'],
            terms: [ 'grass' ],
            matchScore: 0.5
        }),
        parking: iD.presetPreset('__test/amenity/parking', {
            name: 'Parking',
            tags: { amenity: 'parking' },
            geometry: ['point', 'area'],
            terms: [ 'cars' ]
        }),
        soccer: iD.presetPreset('__test/leisure/pitch/soccer', {
            name: 'Soccer Field',
            tags: { leisure: 'pitch', sport: 'soccer' },
            geometry: ['point', 'area'],
            terms: ['fußball']
        }),
        football: iD.presetPreset('__test/leisure/pitch/american_football', {
            name: 'Football Field',
            tags: { leisure: 'pitch', sport: 'american_football' },
            geometry: ['point', 'area'],
            terms: ['gridiron']
        })
    };


    var c = iD.presetCollection([
        p.point, p.line, p.area, p.grill, p.sandpit, p.residential,
        p.grass1, p.grass2, p.park, p.parking, p.soccer, p.football
    ]);

    describe('#item', function() {
        it('fetches a preset by id', function() {
            expect(c.item('__test/highway/residential')).to.equal(p.residential);
        });
    });

    describe('#matchGeometry', function() {
        it('returns a new collection only containing presets matching a geometry', function() {
            expect(c.matchGeometry('area').collection).to.include.members(
                [p.area, p.residential, p.park, p.soccer, p.football]
            );
        });
    });

    describe('#search', function() {
        it('matches leading name', function() {
            var col = c.search('resid', 'area').collection;
            expect(col.indexOf(p.residential)).to.eql(0);  // 1. 'Residential' (by name)
        });

        it('returns alternate matches in correct order', function() {
            var col = c.search('gri', 'point').matchGeometry('point').collection;
            expect(col.indexOf(p.grill), 'Grill').to.eql(0);            // 1. 'Grill' (leading name)
            expect(col.indexOf(p.football), 'Football').to.eql(1);      // 2. 'Football' (leading term 'gridiron')
            expect(col.indexOf(p.sandpit), 'Sandpit').to.eql(2);        // 3. 'Sandpit' (leading tag value 'grit_bin')
            expect(col.indexOf(p.grass1), 'Grass').to.be.within(3,5);   // 4. 'Grass' (similar name)
            expect(col.indexOf(p.grass2), 'Ğṝȁß').to.be.within(3,5);    // 5. 'Ğṝȁß' (similar name)
            expect(col.indexOf(p.park), 'Park').to.be.within(3,5);      // 6. 'Park' (similar term 'grass')
        });

        it('sorts preset with matchScore penalty below others', function() {
            var col = c.search('par', 'point').matchGeometry('point').collection;
            expect(col.indexOf(p.parking), 'Parking').to.eql(0);   // 1. 'Parking' (default matchScore)
            expect(col.indexOf(p.park), 'Park').to.eql(1);         // 2. 'Park' (low matchScore)
        });

        it('ignores matchScore penalty for exact name match', function() {
            var col = c.search('park', 'point').matchGeometry('point').collection;
            expect(col.indexOf(p.park), 'Park').to.eql(0);         // 1. 'Park' (low matchScore)
            expect(col.indexOf(p.parking), 'Parking').to.eql(1);   // 2. 'Parking' (default matchScore)
        });

        it('considers diacritics on exact matches', function() {
            var col = c.search('ğṝȁ', 'point').matchGeometry('point').collection;
            expect(col.indexOf(p.grass2), 'Ğṝȁß').to.eql(0);    // 1. 'Ğṝȁß'  (leading name)
            expect(col.indexOf(p.grass1), 'Grass').to.eql(1);   // 2. 'Grass' (similar name)
        });

        it('replaces diacritics on fuzzy matches', function() {
            var col = c.search('graß', 'point').matchGeometry('point').collection;
            expect(col.indexOf(p.grass1), 'Grass').to.be.within(0,1);   // 1. 'Grass' (similar name)
            expect(col.indexOf(p.grass2), 'Ğṝȁß').to.be.within(0,1);    // 2. 'Ğṝȁß'  (similar name)
        });

        it('includes the appropriate fallback preset', function() {
            expect(c.search('foo', 'point').collection, 'point').to.include(p.point);
            expect(c.search('foo', 'line').collection, 'line').to.include(p.line);
            expect(c.search('foo', 'area').collection, 'area').to.include(p.area);
        });

        it('excludes presets with searchable: false', function() {
            var excluded = iD.presetPreset('__test/excluded', {
                    name: 'excluded',
                    tags: { amenity: 'excluded' },
                    geometry: ['point'],
                    searchable: false
                }),
                collection = iD.presetCollection([excluded, p.point]);
            expect(collection.search('excluded', 'point').collection).not.to.include(excluded);
        });
    });
});
