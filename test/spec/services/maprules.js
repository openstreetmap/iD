describe('maprules', function() {
    var _ruleChecks, _savedAreaKeys, validationRules;

    before(function() {
        _savedAreaKeys = iD.osmAreaKeys;
        iD.osmSetAreaKeys({ building: {}, amenity: {} });

        iD.services.maprules = iD.serviceMapRules;
        iD.serviceMapRules.init();
        _ruleChecks = iD.serviceMapRules.ruleChecks();
    });

    after(function() {
        iD.osmSetAreaKeys(_savedAreaKeys);
        delete iD.services.maprules;
    });

    describe('#filterRuleChecks', function() {
        it('returns shortlist of mapcss checks relevant to provided selector', function() {
            var selector = {
                geometry: 'closedway',
                equals: {amenity: 'marketplace'},
                absence: 'name',
                error: '\'Marketplace\' preset must be coupled with name'
            };
            var filteredChecks = iD.serviceMapRules.filterRuleChecks(selector);
            var equalsCheck = filteredChecks[0];
            var absenceCheck = filteredChecks[1];
            var entityTags = { amenity: 'marketplace' };

            expect(filteredChecks.length).eql(2);
            expect(equalsCheck(entityTags)).toBe(true);
            expect(absenceCheck(entityTags)).toBe(true);
        });
    });

    describe('#buildTagMap', function() {
        it('builds a map of tag keys/values found in mapcss selector', function() {
            [
                {
                    t: {
                        equals: {
                            man_made: 'tower',
                            'tower:type': 'communication'
                        }
                    },
                    r: {
                        man_made: ['tower'],
                        'tower:type': ['communication']
                    }
                },
                {
                    t: {
                        equals: {
                            building: 'yes',
                            amenity: 'school'
                        },
                        positiveRegex: {
                            opening_hours: [
                                '24/7',
                                'sunrise_sundown'
                            ]
                        },
                        negativeRegex: {
                            source: [
                                'missing_maps',
                                'american_red_cross'
                            ]
                        },
                        greaterThanEqual: { floors: 2 },
                        lessThanEqual: { floors: 4 }

                    },
                    r: {
                        building: ['yes'],
                        amenity: ['school'],
                        opening_hours: ['24/7', 'sunrise_sundown'],
                        source: ['missing_maps', 'american_red_cross'],
                        floors: [4, 2]
                    }
                },
                {
                    t: {
                        equals: { highway: 'yes' },
                        greaterThan: { lanes: 1 },
                        lessThan: { lanes: 4 }
                    },
                    r: {
                        highway: ['yes'],
                        lanes: [4, 1]
                    }
                }
            ].forEach(function(test) {
                expect(iD.serviceMapRules.buildTagMap(test.t)).toEqual(test.r);
            });
        });
    });

    describe('#inferGeometry', function() {
        it('infers geometry using selector keys', function() {

            var amenityDerivedArea = {
                geometry: 'closedway',
                presence: 'amenity',
                positiveRegex: { amenity: ['^school$', '^healthcare$'] },
                error: 'amenity cannot be healthcare or school!'
            };

            var areaDerivedArea = {
                geometry: 'closedway',
                equals: { area: 'yes' },
            };

            var badAreaDerivedLine = {
                geometry: 'closedway',
                equals: { 'area': 'no' }
            };

            var roundHouseRailwayDerivedArea = {
                geometry: 'closedway',
                equals: { 'railway': 'roundhouse' }
            };

            var justClosedWayDerivedLine = {
                geometry: 'closedway'
            };

            var tagMap, geom;
            tagMap = iD.serviceMapRules.buildTagMap(amenityDerivedArea);
            geom = iD.serviceMapRules.inferGeometry(tagMap);
            expect(geom).toEqual('area');

            tagMap = iD.serviceMapRules.buildTagMap(areaDerivedArea);
            geom = iD.serviceMapRules.inferGeometry(tagMap);
            expect(geom).toEqual('area');

            tagMap = iD.serviceMapRules.buildTagMap(badAreaDerivedLine);
            geom = iD.serviceMapRules.inferGeometry(tagMap);
            expect(geom).toEqual('line');

            tagMap = iD.serviceMapRules.buildTagMap(roundHouseRailwayDerivedArea);
            geom = iD.serviceMapRules.inferGeometry(tagMap);
            expect(geom).toEqual('area');

            tagMap = iD.serviceMapRules.buildTagMap(justClosedWayDerivedLine);
            geom = iD.serviceMapRules.inferGeometry(tagMap);
            expect(geom).toEqual('line');
        });
    });

    describe('#addRule', function() {
        it('builds a rule from provided selector and adds it to _validationRules', function () {
            var selector = {
                geometry:'node',
                equals: {amenity:'marketplace'},
                absence:'name',
                warning:'\'Marketplace\' preset must be coupled with name'
            };
            expect(iD.serviceMapRules.validationRules()).toEqual([]);
            iD.serviceMapRules.addRule(selector);
            expect(iD.serviceMapRules.validationRules().length).toEqual(1);
        });
    });
    describe('#clearRules', function() {
        it('clears _validationRules array', function() {
            iD.serviceMapRules.clearRules();
            expect(iD.serviceMapRules.validationRules()).toEqual([]);

            iD.serviceMapRules.addRule({
                geometry:'node',
                equals: {amenity:'marketplace'},
                absence:'name',
                warning:'\'Marketplace\' preset must be coupled with name'
            });
            expect(iD.serviceMapRules.validationRules().length).toEqual(1);

            iD.serviceMapRules.clearRules();
            expect(iD.serviceMapRules.validationRules()).toEqual([]);
        });
    });

    describe('#validationRules', function() {
        it('returns _validationRules array', function() {
            var selector = {
                geometry: 'closedway',
                equals: {amenity: 'marketplace'},
                absence: 'name',
                error: '\'Marketplace\' preset must be coupled with name'
            };
            iD.serviceMapRules.addRule(selector);
            var rules = iD.serviceMapRules.validationRules();
            expect(rules).instanceof(Array);
            expect(rules.length).toEqual(1);
        });
    });

    describe('_ruleChecks', function () {
        describe('#equals', function() {
            it('is true when two tag maps intersect', function() {
                var a = { amenity: 'school' };
                var b = { amenity: 'school' };
                expect(_ruleChecks.equals(a)(b)).toBe(true);
            });
            it('is false when two tag maps intersect', function() {
                var a = { man_made: 'water_tap' };
                var b = { amenity: 'school' };
                expect(_ruleChecks.equals(a)(b)).toBe(false);
            });
        });
        describe('#notEquals', function() {
            it('is true when two tag maps do not intersect', function() {
                var a = { man_made: 'water_tap' };
                var b = { amenity: 'school' };
                expect(_ruleChecks.notEquals(a)(b)).toBe(true);
            });
            it('is not true when two tag maps intersect', function() {
                var a = { amenity: 'school' };
                var b = { amenity: 'school', opening_hours: '9-5' };
                expect(_ruleChecks.notEquals(a)(b)).toBe(false);
            });
        });
        describe('absence', function() {
            it('is true when tag map keys does not include key in question', function() {
                var key = 'amenity';
                var map = { building: 'yes' };
                expect(_ruleChecks.absence(key)(map)).toBe(true);
            });
            it('is false when tag map keys does include key in question', function() {
                var key = 'amenity';
                var map = { amenity: 'school' };
                expect(_ruleChecks.absence(key)(map)).toBe(false);
            });
        });
        describe('presence', function() {
            it('is true when tag map keys includes key in question', function() {
                var key = 'amenity';
                var map = { amenity: 'school'};
                expect(_ruleChecks.presence(key)(map)).toBe(true);
            });
            it('is false when tag map keys do not include key in question', function() {
                var key = 'amenity';
                var map = { building: 'yes'};
                expect(_ruleChecks.presence(key)(map)).toBe(false);
            });
        });
        describe('greaterThan', function() {
            it('is true when a tag value is greater than the selector value', function() {
                var selectorTags = { lanes: 5 };
                var tags = { lanes : 6 };
                expect(_ruleChecks.greaterThan(selectorTags)(tags)).toBe(true);
            });
            it('is false when a tag value is less than or equal to the selector value', function() {
                var selectorTags = { lanes: 5 };
                [4, 5].forEach(function(val) {
                    expect(_ruleChecks.greaterThan(selectorTags)({ lanes: val })).toBe(false);
                });
            });
        });
        describe('greaterThanEqual', function() {
            it('is true when a tag value is greater than or equal to the selector value', function() {
                var selectorTags = { lanes: 5 };
                [5, 6].forEach(function(val) {
                    expect(_ruleChecks.greaterThanEqual(selectorTags)({ lanes: val })).toBe(true);
                });
            });
            it('is false when a tag value is less than the selector value', function () {
                var selectorTags = { lanes: 5 };
                var tags = { lanes: 4 };
                expect(_ruleChecks.greaterThanEqual(selectorTags)(tags)).toBe(false);
            });
        });
        describe('lessThan', function() {
            it('is true when a tag value is less than the selector value', function() {
                var selectorTags = { lanes: 5 };
                var tags = { lanes: 4 };
                expect(_ruleChecks.lessThan(selectorTags)(tags)).toBe(true);
            });
            it('is false when a tag value is greater than or equal to the selector value', function() {
                var selectorTags = { lanes: 5 };
                [6, 7].forEach(function(val) {
					expect(_ruleChecks.lessThan(selectorTags)({ lanes: val })).toBe(false);
				});
            });
        });
        describe('lessThanEqual', function() {
            it('is true when a tag value  is less than or equal to the selector value', function() {
                var selectorTags = { lanes: 5 };
                [4, 5].forEach(function(val) {
                    expect(_ruleChecks.lessThanEqual(selectorTags)({ lanes: val })).toBe(true);
                });
            });
            it('is false when a tag value is greater than the selector value', function() {
               var selectorTags = { lanes: 5 };
               var tags = { lanes: 6 };
               expect(_ruleChecks.lessThanEqual(selectorTags)(tags)).toBe(false);
            });
        });
        describe('positiveRegex', function() {
            var positiveRegex = { amenity: ['^hospital$','^clinic$']};
            it('is true when tag value matches positiveRegex', function() {
                var tags = { amenity: 'hospital' };
                expect(_ruleChecks.positiveRegex(positiveRegex)(tags)).toBe(true);
            });
            it('is false when tag value does not match negative regex', function() {
                var tags = { amenity: 'school' };
                expect(_ruleChecks.positiveRegex(positiveRegex)(tags)).toBe(false);
            });
        });
        describe('negativeRegex', function() {
            var negativeRegex = { bicycle: [ 'use_path', 'designated' ] };
            it('is true when tag value does not match negativeRegex', function() {
                var tags = { bicycle: 'yes' };
                expect(_ruleChecks.negativeRegex(negativeRegex)(tags)).toBe(true);
            });
            it('is false when tag value matches negativeRegex', function() {
                var tags = { bicycle: 'designated' };
                expect(_ruleChecks.negativeRegex(negativeRegex)(tags)).toBe(false);
            });
        });
    });
    describe('rule', function() {
        var selectors;
        before(function() {
            selectors = [
                {
                    geometry:'node',
                    equals: {amenity:'marketplace'},
                    absence:'name',
                    error:'\'Marketplace\' preset must be coupled with name'
                },
                {
                    geometry: 'closedway',
                    notEquals: { building: 'yes', amenity: 'clinic' },
                    error: '\'Clinic\' preset must be coupled with building=yes'
                },
                {
                    geometry:'node',
                    equals: {man_made: 'tower', 'tower:type': 'communication'},
                    presence: 'height',
                    error:'\'Communication Tower\' preset must not be coupled with height'
                },
                {
                    geometry: 'node',
                    equals: { man_made: 'tower' },
                    lessThanEqual: { height: 6 },
                    error: '\'Tower\' preset height must be greater than 6'
                },
                {
                    geometry: 'node',
                    equals: { man_made: 'tower' },
                    greaterThanEqual: { height: 9 },
                    error: '\'Tower\' preset height must be less than 9'
                },
                {
                    geometry: 'node',
                    equals: { man_made: 'tower' },
                    lessThan: { height: 6 },
                    error: '\'Tower\' preset height must be greater than or equal to 6'
                },
                {
                    geometry: 'node',
                    equals: { man_made: 'tower' },
                    greaterThan: { height: 9 },
                    error: '\'Tower\' preset height must be greater less than or equal to 9'
                },
                {
                    geometry: 'closedway',
                    equals: { amenity: 'clinic' },
                    negativeRegex: { emergency: ['yes', 'no'] },
                    error: '\'Clinic\' preset\'s emergency tag must be equal to \'yes\' or \'no\''
                },
                {
                    geometry: 'way',
                    equals: { highway: 'residential' },
                    positiveRegex: { structure: ['bridge', 'tunnel'] },
                    error: '\'suburban road\' structure tag cannot be \'bridge\' or \'tunnel\''
                }
            ];

            iD.serviceMapRules.clearRules();
            selectors.forEach(function(selector) { iD.serviceMapRules.addRule(selector); });
            validationRules = iD.serviceMapRules.validationRules();
        });
        describe('#matches', function() {
            var selectors, entities;
            before(function() {
                selectors = [
                    {
                        geometry:'node',
                        equals: {amenity:'marketplace'},
                        absence:'name',
                        error:'\'Marketplace\' preset must be coupled with name'
                    },
                    {
                        geometry: 'closedway',
                        notEquals: { building: 'yes', amenity: 'clinic' },
                        error: '\'Clinic\' preset must be coupled with building=yes'
                    },
                    {
                        geometry:'node',
                        equals: {man_made: 'tower', 'tower:type': 'communication'},
                        presence: 'height',
                        error:'\'Communication Tower\' preset must not be coupled with height'
                    },
                    {
                        geometry: 'node',
                        equals: { man_made: 'tower' },
                        lessThanEqual: { height: 6 },
                        error: '\'Tower\' preset height must be greater than 6'
                    },
                    {
                        geometry: 'node',
                        equals: { man_made: 'tower' },
                        greaterThanEqual: { height: 9 },
                        error: '\'Tower\' preset height must be less than 9'
                    },
                    {
                        geometry: 'node',
                        equals: { man_made: 'tower' },
                        lessThan: { height: 6 },
                        error: '\'Tower\' preset height must be greater than or equal to 6'
                    },
                    {
                        geometry: 'node',
                        equals: { man_made: 'tower' },
                        greaterThan: { height: 9 },
                        error: '\'Tower\' preset height must be greater less than or equal to 9'
                    },
                    {
                        geometry: 'closedway',
                        equals: { amenity: 'clinic' },
                        negativeRegex: { emergency: ['yes', 'no'] },
                        error: '\'Clinic\' preset\'s emergency tag must be equal to \'yes\' or \'no\''
                    },
                    {
                        geometry: 'way',
                        equals: { highway: 'residential' },
                        positiveRegex: { structure: ['bridge', 'tunnel'] },
                        error: '\'suburban road\' structure tag cannot be \'bridge\' or \'tunnel\''
                    }
                ];
                entities = [
                    new iD.osmNode({ tags: { amenity: 'marketplace' }}),
                    new iD.osmWay({ tags: { building: 'house', amenity: 'clinic' }, nodes: [ 'a', 'b', 'c', 'a' ]}),
                    new iD.osmNode({ tags: { man_made: 'tower', 'tower:type': 'communication', height: 5 }}),
                    new iD.osmNode({ tags: { man_made: 'tower', height: 6 }}),
                    new iD.osmNode({ tags: { man_made: 'tower', height: 9 }}),
                    new iD.osmNode({ tags: { man_made: 'tower', height: 5 }}),
                    new iD.osmNode({ tags: { man_made: 'tower', height: 10 }}),
                    new iD.osmWay({ tags: { amenity: 'clinic', emergency: 'definitely' }, nodes: [ 'd', 'e', 'f', 'd' ]}),
                    new iD.osmWay({ tags: { highway: 'residential', structure: 'bridge' }}),
                ];

                iD.serviceMapRules.clearRules();
                selectors.forEach(function(selector) { iD.serviceMapRules.addRule(selector); });
                validationRules = iD.serviceMapRules.validationRules();
            });
            it('is true when each rule check is \'true\'', function() {
                validationRules.forEach(function(rule, i) {
                    expect(rule.matches(entities[i])).toBe(true);
                });
            });
            it('is true when at least one rule check is \'false\'', function() {
                var selector = {
                    geometry: 'way',
                    equals: { highway: 'residential' },
                    positiveRegex: { structure: ['embarkment', 'bridge'] },
                    error: '\'suburban road\' structure tag cannot be \'bridge\' or \'tunnel\''
                };
                var entity = new iD.osmWay({ tags: { highway: 'residential', structure: 'tunnel' }});
                iD.serviceMapRules.clearRules();
                iD.serviceMapRules.addRule(selector);
                var rule = iD.serviceMapRules.validationRules()[0];

                expect(rule.matches(entity)).toBe(false);
            });
        });
        describe('#findIssues', function() {
            var selectors, entities, _graph;

            before(function() {
                selectors = [
                    {
                        geometry:'node',
                        equals: {amenity:'marketplace'},
                        absence:'name',
                        error:'\'Marketplace\' preset must be coupled with name'
                    },
                    {
                        geometry: 'closedway',
                        notEquals: { building: 'yes', amenity: 'clinic' },
                        error: '\'Clinic\' preset must be coupled with building=yes'
                    },
                    {
                        geometry:'node',
                        equals: {man_made: 'tower', 'tower:type': 'communication'},
                        presence: 'height',
                        error:'\'Communication Tower\' preset must not be coupled with height'
                    },
                    {
                        geometry: 'node',
                        equals: { man_made: 'tower' },
                        lessThanEqual: { height: 6 },
                        error: '\'Tower\' preset height must be greater than 6'
                    },
                    {
                        geometry: 'node',
                        equals: { man_made: 'tower' },
                        greaterThanEqual: { height: 9 },
                        error: '\'Tower\' preset height must be less than 9'
                    },
                    {
                        geometry: 'node',
                        equals: { man_made: 'tower' },
                        lessThan: { height: 6 },
                        error: '\'Tower\' preset height must be greater than or equal to 6'
                    },
                    {
                        geometry: 'node',
                        equals: { man_made: 'tower' },
                        greaterThan: { height: 9 },
                        error: '\'Tower\' preset height must be greater less than or equal to 9'
                    },
                    {
                        geometry: 'closedway',
                        equals: { amenity: 'clinic' },
                        negativeRegex: { emergency: ['yes', 'no'] },
                        error: '\'Clinic\' preset\'s emergency tag must be equal to \'yes\' or \'no\''
                    },
                    {
                        geometry: 'way',
                        equals: { highway: 'residential' },
                        positiveRegex: { structure: ['bridge', 'tunnel'] },
                        error: '\'suburban road\' structure tag cannot be \'bridge\' or \'tunnel\''
                    }
                ];
                entities = [
                    new iD.osmNode({ tags: { amenity: 'marketplace' }}),
                    new iD.osmWay({ tags: { building: 'house', amenity: 'clinic' }, nodes: [ 'a', 'b', 'c', 'a' ]}),
                    new iD.osmNode({ tags: { man_made: 'tower', 'tower:type': 'communication', height: 5 }}),
                    new iD.osmNode({ tags: { man_made: 'tower', height: 6 }}),
                    new iD.osmNode({ tags: { man_made: 'tower', height: 9 }}),
                    new iD.osmNode({ tags: { man_made: 'tower', height: 5 }}),
                    new iD.osmNode({ tags: { man_made: 'tower', height: 10 }}),
                    new iD.osmWay({ tags: { amenity: 'clinic', emergency: 'definitely' }, nodes: [ 'd', 'e', 'f', 'd' ]}),
                    new iD.osmWay({ tags: { highway: 'residential', structure: 'bridge' }}),
                ];

                var wayNodes = [
                    new iD.osmNode({ id: 'a' }),
                    new iD.osmNode({ id: 'b' }),
                    new iD.osmNode({ id: 'c' }),
                    new iD.osmNode({ id: 'd' }),
                    new iD.osmNode({ id: 'e' }),
                    new iD.osmNode({ id: 'f' }),
                ];
                _graph = new iD.coreGraph(entities.concat(wayNodes));
                iD.serviceMapRules.clearRules();
                selectors.forEach(function(selector) { iD.serviceMapRules.addRule(selector); });
                validationRules = iD.serviceMapRules.validationRules();
            });
            it('finds issues', function() {
                validationRules.forEach(function(rule, i) {
                    var issues = [];
                    var entity = entities[i];
                    var selector = selectors[i];

                    rule.findIssues(entity, _graph, issues);

                    var issue = issues[0];
                    var type = Object.keys(selector).indexOf('error') ? 'error' : 'warning';

                    expect(issues.length).toEqual(1);
                    expect(issue.entityIds).toEqual([entity.id]);
                    expect(issue.message(iD.coreContext())).toEqual(selector[type]);
                    expect(type).toEqual(issue.severity);
                });
            });
        });
    });
});
