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
            geometry: ['point']
        }),
        sandpit: iD.presetPreset('__test/amenity/grit_bin', {
            name: 'Sandpit',
            aliases: ['Grit Bin'],
            tags: { amenity: 'grit_bin' },
            geometry: ['point']
        }),
        griffin_nest: iD.presetPreset('__test/natural/griffin_nest', {
            name: 'Fantasy Bird Nest',
            tags: { natural: 'griffin_nest' },
            geometry: ['point']
        }),
        grillos_burgers: iD.presetPreset('__test/amenity/fast_food/burger/Grillo\'s_Burgers', {
            name: 'Grillo\'s Burgers',
            tags: { amenity: 'fast_food', cuisine: 'burger', name: 'Grillo\'s Burgers' },
            geometry: ['point'],
            suggestion: true
        }),
        residential: iD.presetPreset('__test/highway/residential', {
            name: 'Residential Area',
            tags: { highway: 'residential' },
            geometry: ['point', 'area']
        }),
        grass1: iD.presetPreset('__test/landuse/grass1', {
            name: 'Grass',
            tags: { landuse: 'grass' },
            geometry: ['point', 'area']
        }),
        grass2: iD.presetPreset('__test/landuse/grass2', {
            name: 'Ğṝȁß',
            tags: { landuse: 'ğṝȁß' },
            geometry: ['point', 'area']
        }),
        park: iD.presetPreset('__test/leisure/park', {
            name: 'Park',
            tags: { leisure: 'park' },
            geometry: ['point', 'area'],
            terms: [ 'grass' ]
        }),
        parking: iD.presetPreset('__test/amenity/parking', {
            name: 'Parking',
            tags: { amenity: 'parking' },
            geometry: ['point', 'area'],
            terms: [ 'cars' ]
        }),
        bicycle_parking: iD.presetPreset('__test/amenity/bicycle_parking', {
            name: 'Bicycle Parking',
            tags: { amenity: 'bicycle_parking' },
            geometry: ['point', 'area']
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
        }),
        tennis: iD.presetPreset('__test/leisure/pitch/tennis', {
            name: 'Tennis Field',
            tags: { leisure: 'pitch', sport: 'tennis' },
            geometry: ['point'],
        }),
        tetris: iD.presetPreset('__test/leisure/pitch/tetris', {
            name: 'Tetris Field',
            tags: { leisure: 'pitch', sport: 'tetris' },
            geometry: ['point'],
        }),
        bicycle: iD.presetPreset('__test/barrier/bicycle', {
            name: 'Bicycle',
            tags: { barrier: 'bicycle' },
            geometry: ['point'],
            matchScore: 0.5
        })
    };


    var c = iD.presetCollection([
        p.point, p.line, p.area, p.grill, p.sandpit, p.residential,
        p.grass1, p.grass2, p.park, p.parking, p.soccer, p.football,
        p.tennis, p.tetris, p.bicycle_parking, p.bicycle, p.grillos_burgers,
        p.griffin_nest
    ]);

    describe('#item', function() {
        it('fetches a preset by id', function() {
            expect(c.item('__test/highway/residential')).to.equal(p.residential);
        });
    });

    describe('#index', function() {
        it('returns preset position in the collection', function() {
            expect(c.index('point')).to.equal(0);
        });
        it('return -1 when given id for preset not in the collection', function() {
            expect(c.index('foobar')).to.equal(-1);
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

        function toPreset(a) { return a.preset; }
        function toName(a) { return a.preset.originalName; }

        it('matches leading name', function() {
            expect(c.search('resid', 'area')[0]).to.eql({ preset: p.residential });
        });

        describe('sorting result list', function() {

            it('returns alternate matches in correct order', function() {
                var leadingMatches = c.search('gri').map(toName).slice(0, 5);
                expect(leadingMatches).to.eql([
                    'Grill',             // 1. leading name
                    'Sandpit',           // 2. leading alias 'Grit Bin'
                    'Grillo\'s Burgers', // 3. leading suggestion name
                    'Football Field',    // 4. leading term 'gridiron'
                    'Fantasy Bird Nest', // 5. leading tag value 'griffin_nest'
                ]);
            });

            it('sorts matches earlier in word first', function() {
                var firstNames = c.search('par').map(toName).slice(0,3);
                expect(firstNames).to.eql([
                    'Park',           // cause it is shorter
                    'Parking',       
                    'Bicycle Parking' // cause it matches the word later
                ]);
            });

            it('sorts less fuzzy matches above more fuzzy matches', function() {
                var firstNames = c.search('terris').map(toName).slice(0,2);
                expect(firstNames).to.eql([
                    'Tetris Field',   // 1. fuzziness = 1
                    'Tennis Field',   // 2. fuzziness = 2
                ]);
            });

            it('sorts preset with matchScore penalty below others', function() {
                var firstNames = c.search('bicyc').map(toName).slice(0,2);
                expect(firstNames).to.eql([
                    'Bicycle Parking',   // 1. default matchScore
                    'Bicycle',           // 2. low matchScore
                ]); 
            });

            it('ignores matchScore penalty for exact name match', function() {
                var firstNames = c.search('bicycle').map(toName).slice(0,2);
                expect(firstNames).to.eql([
                    'Bicycle',           // 1. low matchScore
                    'Bicycle Parking',   // 2. default matchScore
                ]);
            });

        });

        it('considers diacritics on exact matches', function() {
            var firstNames = c.matchGeometry('point').search('ğṝȁ').map(toName).slice(0,2);
            expect(firstNames).to.eql([
                'Ğṝȁß',     // 1. leading name
                'Grass'     // 2. similar name
            ]);
        });

        it('replaces diacritics on fuzzy matches', function() {
            var names = iD.presetCollection([p.grass1, p.grass2]).search('graß').map(toName);
            expect(names).to.include.members(['Ğṝȁß', 'Grass']);
        });

        it('includes the appropriate fallback preset', function() {
            expect(c.search('foo', 'point').map(toPreset), 'point').to.include(p.point);
            expect(c.search('foo', 'line').map(toPreset), 'line').to.include(p.line);
            expect(c.search('foo', 'area').map(toPreset), 'area').to.include(p.area);
        });

        it('excludes presets with searchable: false', function() {
            var excluded = iD.presetPreset('__test/excluded', {
                name: 'excluded',
                tags: { amenity: 'excluded' },
                geometry: ['point'],
                searchable: false
            });
            var collection = iD.presetCollection([excluded, p.point]);
            var presets = collection.search('excluded', 'point').map(toPreset);
            expect(presets).not.to.include(excluded);
        });

        describe('match properties', function() {

            it('returns term in match results', function() {
                var matches = iD.presetCollection([p.soccer]).search('fußball');
                expect(matches).to.eql([ { preset: p.soccer, term: 'fußball' } ]);
            });

            it('returns alias in match results', function() {
                var matches = iD.presetCollection([p.sandpit]).search('Grit Bin');
                expect(matches).to.eql([ { preset: p.sandpit, alias: 'Grit Bin' } ]);
            });

            it('returns tagValue in match results', function() {
                var matches = iD.presetCollection([p.griffin_nest]).search('griffin');
                expect(matches).to.eql([ { preset: p.griffin_nest, tagValue: 'griffin_nest' } ]);
            });

            it('returns fuzziness in fuzzy name match result', function() {
                var matches = iD.presetCollection([p.sandpit]).search('sendpot');
                expect(matches).to.eql([ { preset: p.sandpit, fuzziness: 2 } ]);
            });

            it('returns fuzziness and term in fuzzy term match result', function() {
                var matches = iD.presetCollection([p.soccer]).search('fußback');
                expect(matches).to.eql([ { preset: p.soccer, term: 'fußball', fuzziness: 2 } ]);
            });

            it('returns fuzziness and alias in fuzzy alias match result', function() {
                var matches = iD.presetCollection([p.sandpit]).search('Great Bin');
                expect(matches).to.eql([ { preset: p.sandpit, alias: 'Grit Bin', fuzziness: 2 } ]);
            });
        });
    });
});
