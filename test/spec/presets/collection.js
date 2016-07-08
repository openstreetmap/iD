/* global locale: true */
/* eslint no-console: 0 */

describe('iD.presets.Collection', function() {

    var p = {
        point: iD.presets.Preset('point', {
            name: 'Point',
            tags: {},
            geometry: ['point']
        }),
        line: iD.presets.Preset('line', {
            name: 'Line',
            tags: {},
            geometry: ['line']
        }),
        area: iD.presets.Preset('area', {
            name: 'Area',
            tags: {},
            geometry: ['area']
        }),
        grill: iD.presets.Preset('__test/amenity/bbq', {
            name: 'Grill',
            tags: { amenity: 'bbq' },
            geometry: ['point'],
            terms: []
        }),
        sandpit: iD.presets.Preset('__test/amenity/grit_bin', {
            name: 'Sandpit',
            tags: { amenity: 'grit_bin' },
            geometry: ['point'],
            terms: []
        }),
        residential: iD.presets.Preset('__test/highway/residential', {
            name: 'Residential Area',
            tags: { highway: 'residential' },
            geometry: ['point', 'area'],
            terms: []
        }),
        grass: iD.presets.Preset('__test/landuse/grass', {
            name: 'Grass',
            tags: { landuse: 'grass' },
            geometry: ['point', 'area'],
            terms: []
        }),
        park: iD.presets.Preset('__test/leisure/park', {
            name: 'Park',
            tags: { leisure: 'park' },
            geometry: ['point', 'area'],
            terms: [ 'grass' ]
        }),
        soccer: iD.presets.Preset('__test/leisure/pitch/soccer', {
            name: 'Soccer Field',
            tags: { leisure: 'pitch', sport: 'soccer' },
            geometry: ['point', 'area'],
            terms: ['fußball']
        }),
        football: iD.presets.Preset('__test/leisure/pitch/american_football', {
            name: 'Football Field',
            tags: { leisure: 'pitch', sport: 'american_football' },
            geometry: ['point', 'area'],
            terms: ['gridiron']
        })
    };


    var c = iD.presets.Collection([
        p.point, p.line, p.area, p.grill, p.sandpit,
        p.residential, p.grass, p.park, p.soccer, p.football
    ]);

    var saved, error;

    // setup mock locale object..
    beforeEach(function() {
        saved = locale;
        error = console.error;
        console.error = function () {};
        locale = {
            _current: 'en',
            en: {
                presets: {
                    presets: {
                        // fake locale names and terms for `preset.t()`
                        '__test/amenity/bbq': {
                            'name': 'Grill',
                            'terms': ''
                        },
                        '__test/amenity/grit_bin': {
                            'name': 'Sandpit',
                            'terms': ''
                        },
                        '__test/highway/residential': {
                            'name': 'Residential Area',
                            'terms': ''
                        },
                        '__test/landuse/grass': {
                            'name': 'Grass',
                            'terms': ''
                        },
                        '__test/leisure/park': {
                            'name': 'Park',
                            'terms': 'grass'
                        },
                        '__test/leisure/pitch/soccer': {
                            'name': 'Soccer Field',
                            'terms': 'fußball'
                        },
                        '__test/leisure/pitch/american_football': {
                            'name': 'Football Field',
                            'terms': 'gridiron'
                        }
                    }
                }
            }
        };
    });

    afterEach(function() {
        locale = saved;
        console.error = error;
    });


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
            expect(col.indexOf(p.grill)).to.eql(0);      // 1. 'Grill' (leading name)
            expect(col.indexOf(p.football)).to.eql(1);   // 2. 'Football' (leading term 'gridiron')
            expect(col.indexOf(p.sandpit)).to.eql(2);    // 3. 'Sandpit' (leading tag value 'grit_bin')
            expect(col.indexOf(p.grass)).to.eql(3);      // 4. 'Grass' (similar name 'grass')
            expect(col.indexOf(p.park)).to.eql(4);       // 5. 'Park' (similar term 'grass')
        });

        it.skip('considers diacritics on exact matches', function() {
        });

        it.skip('replaces diacritics on fuzzy matches', function() {
        });

        it('includes the appropriate fallback preset', function() {
            expect(c.search('foo', 'point').collection).to.include(p.point);
            expect(c.search('foo', 'line').collection).to.include(p.line);
            expect(c.search('foo', 'area').collection).to.include(p.area);
        });

        it('excludes presets with searchable: false', function() {
            var excluded = iD.presets.Preset('__test/excluded', {
                    name: 'excluded',
                    tags: { amenity: 'excluded' },
                    geometry: ['point'],
                    searchable: false
                }),
                collection = iD.presets.Collection([excluded, p.point]);
            expect(collection.search('excluded', 'point').collection).not.to.include(excluded);
        });
    });
});
