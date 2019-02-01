describe('iD.presetIndex', function () {
    var savedPresets, server;

    before(function () {
        savedPresets = iD.data.presets;
    });

    after(function () {
        iD.data.presets = savedPresets;
    });

    describe('#match', function () {
        var testPresets = {
            presets: {
                point: {
                    tags: {},
                    geometry: ['point']
                },
                line: {
                    tags: {},
                    geometry: ['line']
                },
                vertex: {
                    tags: {},
                    geometry: ['vertex']
                },
                residential: {
                    tags: { highway: 'residential' },
                    geometry: ['line']
                },
                park: {
                    tags: { leisure: 'park' },
                    geometry: ['point', 'area']
                }
            }
        };

        it('returns a collection containing presets matching a geometry and tags', function () {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets(),
                way = iD.Way({ tags: { highway: 'residential' } }),
                graph = iD.Graph([way]);

            expect(presets.match(way, graph).id).to.eql('residential');
        });

        it('returns the appropriate fallback preset when no tags match', function () {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets(),
                point = iD.Node(),
                line = iD.Way({ tags: { foo: 'bar' } }),
                graph = iD.Graph([point, line]);

            expect(presets.match(point, graph).id).to.eql('point');
            expect(presets.match(line, graph).id).to.eql('line');
        });

        it('matches vertices on a line as vertices', function () {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets(),
                point = iD.Node({ tags: { leisure: 'park' } }),
                line = iD.Way({ nodes: [point.id], tags: { 'highway': 'residential' } }),
                graph = iD.Graph([point, line]);

            expect(presets.match(point, graph).id).to.eql('vertex');
        });

        it('matches vertices on an addr:interpolation line as points', function () {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets(),
                point = iD.Node({ tags: { leisure: 'park' } }),
                line = iD.Way({ nodes: [point.id], tags: { 'addr:interpolation': 'even' } }),
                graph = iD.Graph([point, line]);

            expect(presets.match(point, graph).id).to.eql('park');
        });
    });


    describe('#areaKeys', function () {
        var testPresets = {
            presets: {
                'amenity/fuel/shell': {
                    tags: { 'amenity': 'fuel' },
                    geometry: ['point', 'area'],
                    suggestion: true
                },
                'highway/foo': {
                    tags: { 'highway': 'foo' },
                    geometry: ['area']
                },
                'leisure/track': {
                    tags: { 'leisure': 'track' },
                    geometry: ['line', 'area']
                },
                'natural': {
                    tags: { 'natural': '*' },
                    geometry: ['point', 'vertex', 'area']
                },
                'natural/peak': {
                    tags: { 'natural': 'peak' },
                    geometry: ['point', 'vertex']
                },
                'natural/tree_row': {
                    tags: { 'natural': 'tree_row' },
                    geometry: ['line']
                },
                'natural/wood': {
                    tags: { 'natural': 'wood' },
                    geometry: ['point', 'area']
                }
            }

        };

        it('whitelists keys for presets with area geometry', function () {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys()).to.include.keys('natural');
        });

        it('blacklists key-values for presets with a line geometry', function () {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys().natural).to.include.keys('tree_row');
            expect(presets.areaKeys().natural.tree_row).to.be.true;
        });

        it('blacklists key-values for presets with both area and line geometry', function () {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys().leisure).to.include.keys('track');
        });

        it('does not blacklist key-values for presets with neither area nor line geometry', function () {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys().natural).not.to.include.keys('peak');
        });

        it('does not blacklist generic \'*\' key-values', function () {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys().natural).not.to.include.keys('natural');
        });

        it('ignores keys like \'highway\' that are assumed to be lines', function () {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys()).not.to.include.keys('highway');
        });

        it('ignores suggestion presets', function () {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys()).not.to.include.keys('amenity');
        });
    });

    describe('#build', function () {
        it('builds presets from provided', function () {
            var surfShop = iD.Node({ tags: { amenity: 'shop', 'shop:type': 'surf' } }),
                graph = iD.Graph([surfShop]),
                presets = iD.Context().presets(),
                morePresets = {
                    presets: {
                        'amenity/shop/surf': {
                            tags: { amenity: 'shop', 'shop:type': 'surf' },
                            geometry: ['point', 'area']
                        }
                    }
                };

            expect(presets.match(surfShop, graph)).to.eql(undefined); // no surfshop preset yet...
            presets.build(morePresets, true);
            expect(presets.match(surfShop, graph).addTags).to.eql({ amenity: 'shop', 'shop:type': 'surf' });
        });
        it('configures presets\' initial visibility', function () {
            var surfShop = iD.Node({ tags: { amenity: 'shop', 'shop:type': 'surf' } }),
                firstStreetJetty = iD.Node({ tags: { man_made: 'jetty' } }),
                entities = [surfShop, firstStreetJetty],
                graph = iD.Graph(entities),
                presets = iD.Context().presets(),
                morePresets = {
                    presets: {
                        'amenity/shop/surf': {
                            tags: { amenity: 'shop', 'shop:type': 'surf' },
                            geometry: ['point', 'area']
                        },
                        'man_made/jetty': {
                            tags: { man_made: 'jetty' },
                            geometry: ['point']
                        }
                    }
                };

            presets.build(morePresets, false);
            entities.forEach(function (entity) {
                var preset = presets.match(entity, graph);
                expect(preset.visible()).to.be.false;
            });
        });
    });

    describe('expected matches', function () {

        it('prefers building to multipolygon', function () {
            iD.data.presets = savedPresets;
            var presets = iD.Context().presets(),
                relation = iD.Relation({ tags: { type: 'multipolygon', building: 'yes' } }),
                graph = iD.Graph([relation]);
            expect(presets.match(relation, graph).id).to.eql('building');
        });

        it('prefers building to address', function () {
            iD.data.presets = savedPresets;
            var presets = iD.Context().presets(),
                way = iD.Way({ tags: { area: 'yes', building: 'yes', 'addr:housenumber': '1234' } }),
                graph = iD.Graph([way]);
            expect(presets.match(way, graph).id).to.eql('building');
        });

        it('prefers pedestrian to area', function () {
            iD.data.presets = savedPresets;
            var presets = iD.Context().presets(),
                way = iD.Way({ tags: { area: 'yes', highway: 'pedestrian' } }),
                graph = iD.Graph([way]);
            expect(presets.match(way, graph).id).to.eql('highway/pedestrian_area');
        });
    });

    describe('#fromExternal', function () {
        var morePresets;
        before(function () {
            morePresets = {
                'categories': {
                    'category-area': {
                        'icon': 'maki-natural',
                        'geometry': 'area',
                        'name': 'MapRules area Features',
                        'members': [
                            '8bc64d6d-1dbb-44a8-a2f9-80d41d067d78',
                            'a9b78746-ca8a-4380-b340-157414f1464d'
                        ]
                    },
                    'category-point': {
                        'icon': 'maki-natural',
                        'geometry': 'point',
                        'name': 'MapRules point Features',
                        'members': [
                            '8bc64d6d-1dbb-44a8-a2f9-80d41d067d78',
                            '8f83ed0b-6514-4772-a644-f04aad9d2308'
                        ]
                    }
                },
                'presets': {
                    '8bc64d6d-1dbb-44a8-a2f9-80d41d067d78': {
                        'geometry': ['area', 'point'],
                        'tags': { 'amenity': 'shop', 'shop:type': 'surf' },
                        'icon': 'maki-natural',
                        'name': 'Surf Shop',
                        'fields': ['358f404a-c7d5-4267-94ed-41f789b16228'],
                        'matchScore': 0.99
                    },
                    'a9b78746-ca8a-4380-b340-157414f1464d': {
                        'geometry': ['area'],
                        'tags': { 'amenity': 'marketplace' },
                        'icon': 'maki-natural',
                        'name': 'Market',
                        'fields': [
                            'name',
                            'source',
                            '2161a712-f67f-4759-92fa-f5d9488ba969',
                            '368ecbdf-bc02-4de2-a82e-d51c250602da',
                            '1887834c-0cdd-4d40-852b-d29b8df94567'
                        ],
                        'matchScore': 0.99
                    },
                    '8f83ed0b-6514-4772-a644-f04aad9d2308': {
                        'geometry': ['point'],
                        'tags': {
                            'amenity': 'drinking_water',
                            'man_made': 'water_tap'
                        },
                        'icon': 'maki-natural',
                        'name': 'Water Tap',
                        'fields': ['name'],
                        'matchScore': 0.99
                    }
                },
                'fields': {
                    '358f404a-c7d5-4267-94ed-41f789b16228': {
                        'key': 'healthcare',
                        'label': 'Healthcare',
                        'overrideLabel': 'Healthcare',
                        'placeholder': '...',
                        'type': 'text'
                    },
                    'name': {
                        'key': 'name',
                        'type': 'localized',
                        'label': 'Name',
                        'universal': true,
                        'placeholder': 'Common name (if any)'
                    },
                    'source': {
                        'key': 'source',
                        'type': 'semiCombo',
                        'icon': 'source',
                        'universal': true,
                        'label': 'Sources',
                        'snake_case': false,
                        'caseSensitive': true,
                        'options': [
                            'survey',
                            'local knowledge',
                            'gps',
                            'aerial imagery',
                            'streetlevel imagery'
                        ]
                    },
                    '2161a712-f67f-4759-92fa-f5d9488ba969': {
                        'key': 'building',
                        'label': 'Building',
                        'overrideLabel': 'Building',
                        'placeholder': '...',
                        'type': 'text'
                    },
                    '368ecbdf-bc02-4de2-a82e-d51c250602da': {
                        'key': 'opening_hours',
                        'label': 'Opening Hours',
                        'overrideLabel': 'Opening Hours',
                        'placeholder': '24/7, sunrise to sunset...',
                        'strings': {
                            'options': {
                                '24/7': '24/7',
                                'sunrise to sunset': 'sunrise to sunset'
                            }
                        },
                        'type': 'combo'
                    },
                    '1887834c-0cdd-4d40-852b-d29b8df94567': {
                        'key': 'height',
                        'label': 'Height',
                        'overrideLabel': 'Height',
                        'placeholder': '...',
                        'minValue': 1, 'type': 'number'
                    },
                    'relation': {
                        'key': 'type',
                        'type': 'combo',
                        'label': 'Type'
                    },
                    'comment': {
                        'key': 'comment',
                        'type': 'textarea',
                        'label': 'Changeset Comment',
                        'placeholder': 'Brief description of your contributions (required)'
                    },
                    'hashtags': {
                        'key': 'hashtags',
                        'type': 'semiCombo',
                        'label': 'Suggested Hashtags',
                        'placeholder': '#example'
                    }
                },
                'defaults': {
                    'point': [
                        'point',
                        '8bc64d6d-1dbb-44a8-a2f9-80d41d067d78',
                        '8f83ed0b-6514-4772-a644-f04aad9d2308'
                    ],
                    'line': ['line'],
                    'area': [
                        'area',
                        '8bc64d6d-1dbb-44a8-a2f9-80d41d067d78',
                        'a9b78746-ca8a-4380-b340-157414f1464d'
                    ],
                    'vertex': ['vertex'],
                    'relation': ['relation']
                }
            };


        });
        beforeEach(function () {
            server = sinon.fakeServer.create();
        });
        afterEach(function () {
            server.restore();
        });
        it('builds presets w/external sources set to visible', function () {
            var surfShop = iD.Node({ tags: { amenity: 'shop', 'shop:type': 'surf' } }),
                graph = iD.Graph([surfShop]),
                maprules = 'https://fakemaprules.io',
                presetLocation = '/config/dfcfac13-ba7c-4223-8880-c856180e5c5b/presets/iD/',
                match = new RegExp(presetLocation),
                external = maprules + presetLocation;
            
                // no exernal presets yet
            expect(iD.Context().presets().match(surfShop, graph).id).to.eql('amenity');
            // reset graph...
            graph = iD.Graph([surfShop]);

            // add the validations query param...
            iD.Context().presets().fromExternal(external, function (externalPresets) {
                // includes newer presets...
                expect(externalPresets.match(surfShop, graph).id).to.eql('8bc64d6d-1dbb-44a8-a2f9-80d41d067d78');
            });

            server.respondWith('GET', match,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(morePresets)]
            );
            server.respond();
        });
        it('makes only the external presets initially visible', function () {
            var maprules = 'https://fakemaprules.io',
                presetLocation = '/config/dfcfac13-ba7c-4223-8880-c856180e5c5b/presets/iD/',
                match = new RegExp(presetLocation),
                external = maprules + presetLocation;

            iD.Context().presets().fromExternal(external, function(externalPresets) {
                var external = externalPresets.collection.reduce(function(presets, preset) { 
                    if (!preset.hasOwnProperty('members') && preset.visible()) {
                        presets.push(preset.id);
                    }
                    return presets;
                }, []);
                
                var morePresetKeys = Object.keys(morePresets.presets);

                expect(morePresetKeys.length).to.eql(external.length);

                morePresetKeys.forEach(function(presetId) {
                    expect(external.indexOf(presetId)).to.be.at.least(0);
                });
            });


            server.respondWith('GET', match,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(morePresets)]
            );
            server.respond();
        });
    });

});
