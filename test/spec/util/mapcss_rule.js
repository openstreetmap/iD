describe('iD.utilMapCSSRule', function() {
    var entities = [
        iD.Entity({ type: 'node', tags: { amenity: 'marketplace' }}),
        iD.Entity({ type: 'node', tags: { man_made: 'water_tap' }}),
        iD.Entity({ type: 'node', tags: { amenity: 'marketplace', height: 0 }}),
        iD.Entity({ type: 'node', tags: { amenity: 'school', height: 5, width: 3 }}),
        iD.Entity({ type: 'node', tags: { amenity: 'healthcare' }}),
        iD.Entity({ type: 'node', tags: { amenity: 'place_of_worship' }}),
    ];
    var selectors = [
        {
            'geometry':'node',
            'equals':{'amenity':'marketplace'},
            'absence':'name',
            'warning':'throwWarning: "[amenity=marketplace]: MapRules preset \'Market\': must be coupled with name";'
        },
        {
            'geometry':'node',
            'equals':{'man_made':'water_tap'},
            'absence':'name',
            'warning':'throwWarning: "[amenity=drinking_water][man_made=water_tap]: MapRules preset \'Water Tap\': must be coupled with name";'
        },
        {
            'geometry':'node',
            'equals':{'amenity':'marketplace'},
            'presence':'height',
            'lessThanEqual': { 'height': 0 },
            'warning':'throwWarning: "[amenity=marketplace]: height must be greater than 0";'
        },
        {
            'geometry': 'node',
            'equals': {'amenity': 'school'},
            'greaterThan': { 'height': 0 },
            'greaterThanEqual': { 'width': 1 },
            'lessThanEqual': { 'width': 10 },
            'lessThan': { 'height': 10 },
            'warning': 'this is the warning!'
        },
        {
            'geometry': 'node',
            'presence': 'amenity',
            'positiveRegex': { amenity: ['^school$', '^healthcare$'] },
            'error': 'amenity cannot be healthcare or school!'
        }
    ];
    var rules = selectors.map(function(s) { return iD.utilMapCSSRule(s); });
    it ('turns selector object in mapcssRule', function () {
        var ruleKeys = ['ruleChecks', 'type','buildChecks','matches', 'inferGeometry', 'geometryMatches','findWarnings'];
        rules.forEach(function(rule) {
            expect(Object.keys(rule)).to.eql(ruleKeys);
        });
    });
    describe('#type', function() {
        it('is either error or warning', function() {
            selectors.forEach(function(s) {
                expect(['error', 'warning'].indexOf(iD.utilMapCSSRule(s).type)).to.be.greaterThan(-1);
            });
        });
    });
    describe('#geometryMatches', function() {
        it('determines if entity and rule geometries match', function() {
            var node = iD.Entity({ type: 'node'});
            var way = iD.Entity({ type: 'way'});
            var graph = iD.Graph([node, way]);
            rules.forEach(function(rule) {
                expect(rule.geometryMatches(node, graph)).to.be.true;
                expect(rule.geometryMatches(way, graph)).to.be.false;
            });
        });
    });
    describe('#buildsChecks', function() {
        it('builds array of MapCSS rule check functions to run entities against', function() {
            rules.forEach(function(rule) {
                expect(rule.buildChecks().every(function(fn) { return fn instanceof Function; })).to.be.true;
            });
        });
    });
    describe('#matches', function() {
        it('determines if an entity matches the MapCSS rule checks', function() {
            var node  = iD.Entity({ type: 'node', tags: { power: 'tower' }});
            rules.forEach(function(rule, i) {
                expect(rule.matches(entities[i])).to.be.true;
                expect(rule.matches(node)).to.be.false;
            });
        });
    });
    describe('#ruleChecks', function() {
        describe('equals', function() {
            it('is true when entity.tags intersects selector.equals', function() {
                var pseudoSelector = { equals: {'amenity': 'school'} };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector); 
                var school = iD.Entity({ type: 'node', tags: { amenity: 'school' }});
                expect(pseudoRule.ruleChecks.equals(school.tags)).to.be.true;
            });
            it('is false when entity.tags intersects selector.equals', function() {
                var pseudoSelector = { equals: { 'man_made': 'water_tap'} };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var school = iD.Entity({ type: 'node', tags: { amenity: 'school' } } );
                expect(pseudoRule.ruleChecks.equals(school.tags)).to.be.false;
            });
        });
        describe('notEquals', function() {
            it('is true when entity.tags does not intersect selector.notEquals', function() {
                var pseudoSelector = { notEquals: { 'man_made': 'water_tap'} };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var school = iD.Entity({ type: 'node', tags: { amenity: 'school' } } );
                expect(pseudoRule.ruleChecks.notEquals(school.tags)).to.be.true;
            });
            it('is false when entity.tags does not intersect selector.notEquals', function() {
                var pseudoSelector = { notEquals: { 'amenity': 'school'} };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var school = iD.Entity({ type: 'node', tags: { amenity: 'school' } } );
                expect(pseudoRule.ruleChecks.notEquals(school.tags)).to.be.false;
            });
        });
        describe('presence', function() {
            it('is true when entity.tags\' key s include selector.presence', function() {
                var pseudoSelector = { presence: 'name' };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var kHouse = iD.Entity({ type: 'node', tags: { amenity: 'marketplace', name: 'Kensington Square' }});
                expect(pseudoRule.ruleChecks.presence(kHouse.tags)).to.be.true;
            });
            it('is false when entity tags\' keys do not include selector.presence', function() {
                var pseudoSelector = { presence: 'name' };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var notKHouse = iD.Entity({ type: 'node', tags: { amenity: 'marketplace' }});
                expect(pseudoRule.ruleChecks.presence(notKHouse.tags)).to.be.false;
            });
        });
        describe('absence', function() {
            it('is true when entity.tags\' keys do not include selector.absence', function() {
                var pseudoSelector = { absence: 'name' };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var notKHouse = iD.Entity({ type: 'node', tags: { amenity: 'marketplace' }});
                expect(pseudoRule.ruleChecks.absence(notKHouse.tags)).to.be.true;
            });
            it('is false when entity.tags\' keys include selector.absence', function() {
                var pseudoSelector = { absence: 'name' };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var kHouse = iD.Entity({ type: 'node', tags: { amenity: 'marketplace', name: 'Kensington Square' }});
                expect(pseudoRule.ruleChecks.presence(kHouse.tags)).to.be.false;
            });
        });
        describe('greaterThan', function() {
            it('is true when entity.tags\' equivalent value is greater than selector.greaterThan', function() {
                var pseudoSelector = { greaterThan: { height: 10 }};
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var tallSchool = iD.Entity({ type: 'node', tags: { amenity: 'school', height: 9000 }});
                expect(pseudoRule.ruleChecks.greaterThan(tallSchool.tags)).to.be.true;
            });
            it('is false when entity.tags\' equivalent value is less than or equal to selector.greaterThan', function() {
                var pseudoSelector = { greaterThan: { height: 10 }};
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var smallSchool = iD.Entity({ type: 'node', tags: { amenity: 'school', height: 9 }});
                expect(pseudoRule.ruleChecks.greaterThan(smallSchool.tags)).to.be.false;
            });        
        });
        describe('greaterThanEqual', function() {
            it('is true when entity.tags\' equivalent value is greater than or equal to selector.greaterThanEqual', function() {
                var pseudoSelector = { greaterThanEqual: { height: 10 } };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var okHeightSchool = iD.Entity({ type: 'node', tags: { amenity: 'school', height: 10 }});
                expect(pseudoRule.ruleChecks.greaterThanEqual(okHeightSchool.tags)).to.be.true;
            });
            it('is false when entity.tags\' equivalent value is less than to selector.greaterThanEqual', function() {
                var pseudoSelector = { greaterThanEqual: { height: 10 }};
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var smallSchool = iD.Entity({ type: 'node', tags: { amenity: 'school', height: 9 }});
                expect(pseudoRule.ruleChecks.greaterThanEqual(smallSchool.tags)).to.be.false;
            });
        });
        describe('lessThan', function() {
            it('is true when entity.tags\' equivalent value is less than to selector.lessThan', function() {
                var pseudoSelector = { lessThan: { height: 10 } };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var smallSchool = iD.Entity({ type: 'node', tags: { amenity: 'school', height: 3 }});
                expect(pseudoRule.ruleChecks.lessThan(smallSchool.tags)).to.be.tru;
            });
            it('is false when entity.tags\' equivalent value is greater than or equal to selector.lessThan', function() {
                var pseudoSelector = { lessThan: { height: 10 } };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var notOkHeightSchool = iD.Entity({ type: 'node', tags: { amenity: 'school', height: 10 }});
                expect(pseudoRule.ruleChecks.lessThan(notOkHeightSchool.tags)).to.be.false;
            });
        });
        describe('lessThanEqual', function() {
            it('is true when entity.tags\' equivalent value is less than or equal to to selector.lessThan', function() {
                var pseudoSelector = { lessThanEqual: { height: 10 } };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var okHeightSchool = iD.Entity({ type: 'node', tags: { 'amenity': 'school', 'height': 10 }});
                expect(pseudoRule.ruleChecks.lessThanEqual(okHeightSchool.tags)).to.be.true;
            });
            it('is false when entity.tags\' equivalent value is greater than to selector.lessThan', function() {
                var pseudoSelector = { lessThanEqual: { height: 10 } };
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var notOkHeightSchool = iD.Entity({ type: 'node', tags: { amenity: 'school', height: 11 }});
                expect(pseudoRule.ruleChecks.lessThanEqual(notOkHeightSchool.tags)).to.be.false;
            });
        });
        describe('positiveRegex', function() {
            it('is true when entity.tags\' equivalent value matches regular expression built from selector.positiveRegex', function() {
                var pseudoSelector = { positiveRegex: { amenity: ['^school$', '^healthcare$'] }};
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var okAmenities = [
                    iD.Entity({ type: 'node', tags: { amenity: 'school' }}),
                    iD.Entity({ type: 'node', tags: { amenity: 'healthcare' }})
                ];
                okAmenities.forEach(function(amenity) {
                    expect(pseudoRule.ruleChecks.positiveRegex(amenity.tags)).to.be.true;
                });
            });
            it('is false when entity.tags\' equivalent value does not match regular expression built from selector.positiveRegex', function() {
                var pseudoSelector = { positiveRegex: { amenity: ['^school$', '^healthcare$'] }};
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var notOkAmenities = [
                    iD.Entity({ type: 'node', tags: { amenity: 'parking' }}),
                    iD.Entity({ type: 'node', tags: { amenity: 'place_of_worship' }})
                ];
                notOkAmenities.forEach(function(amenity) {
                    expect(pseudoRule.ruleChecks.positiveRegex(amenity.tags)).to.be.false;
                });
            });
        });
        describe('negativeRegex', function() {
            it('is true when entity.tags\' equivalent value does not match regular exprsesion built from selector.negativeRegex', function() {
                var pseudoSelector = { negativeRegex: { amenity: ['^school$', '^healthcare$'] }};
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var notOkAmenities = [
                    iD.Entity({ type: 'node', tags: { amenity: 'parking' }}),
                    iD.Entity({ type: 'node', tags: { amenity: 'place_of_worship' }})
                ];
                notOkAmenities.forEach(function(amenity) {
                    expect(pseudoRule.ruleChecks.negativeRegex(amenity.tags)).to.be.true;
                });
            });
            it('is false when entity.tags\' equivalent value matches regular expression built from selector.negativeRegex', function() {
                var pseudoSelector = { negativeRegex: { amenity: ['^school$', '^healthcare$'] }};
                var pseudoRule = iD.utilMapCSSRule(pseudoSelector);
                var okAmenities = [
                    iD.Entity({ type: 'node', tags: { amenity: 'school' }}),
                    iD.Entity({ type: 'node', tags: { amenity: 'healthcare' }})
                ];
                okAmenities.forEach(function(amenity) {
                    expect(pseudoRule.ruleChecks.negativeRegex(amenity.tags)).to.be.false;
                });
            });
        });
    });
    describe('#inferGeometry', function() {
        var amenityDerivedArea = {
            selector: {
                'geometry': 'closedway',
                'presence': 'amenity',
                'positiveRegex': { amenity: ['^school$', '^healthcare$'] },
                'error': 'amenity cannot be healthcare or school!'
            },
            tagMap: {
                amenity: [ 'school', 'healthcare' ]
            }
        };
        
        var areaDerivedArea = {
            selector: {
                'geometry': 'closedway',
                'equals': { area: 'yes' },
            },
            tagMap: {
                amenity: [ 'school', 'healthcare' ],
                area: [ 'yes' ]
            }
        };

        var badAreaDerivedLine = {
            selector: {
                'geometry': 'closedway',
                'equals': { 'area': 'no' }
            },
            tagMap: {
                area: ['no']
            }
        };

        var roundHouseRailwayDerivedArea = {
            selector: {
                'geometry': 'closedway',
                'equals': { 'railway': 'roundhouse' }
            }, 
            tagMap: {
                railway: ['roundhouse']
            }
        };

        var justClosedWayDerivedLine = {
            selector: {
                'geometry': 'closedway'
            },
            tagMap: {}
        };

        var areaKeys = iD.Context().presets().areaKeys();
        var rule, geom;
        
        rule = iD.utilMapCSSRule(amenityDerivedArea.selector);
        geom = rule.inferGeometry(amenityDerivedArea.tagMap, areaKeys);
        expect(geom).to.be.eql('area');

        rule = iD.utilMapCSSRule(areaDerivedArea.selector);
        geom = rule.inferGeometry(areaDerivedArea.tagMap, areaKeys);
        expect(geom).to.be.eql('area');

        rule = iD.utilMapCSSRule(badAreaDerivedLine.selector);
        geom = rule.inferGeometry(badAreaDerivedLine.tagMap);
        expect(geom).to.be.eql('line');

        rule = iD.utilMapCSSRule(roundHouseRailwayDerivedArea.selector);
        geom = rule.inferGeometry(roundHouseRailwayDerivedArea.tagMap, areaKeys);
        expect(geom).to.be.eql('area');

        rule = iD.utilMapCSSRule(justClosedWayDerivedLine.selector);
        geom = rule.inferGeometry(justClosedWayDerivedLine.tagMap);
        expect(geom).to.be.eql('line');

    });
    describe('#findWarnings', function() {
        it('adds found warnings to warnings array', function() {
            var graph = iD.Graph([entities]);
            var warnings = [];
            
            rules.forEach(function(rule) {
                entities.forEach(function(entity) {
                    rule.findWarnings(entity, graph, warnings);
                });
            });
            
            // warnings.forEach(function(warning) {
                // console.log(warning);
                // expect(warning.message).to.not.be.null;
                // expect(['mapcss_warning', 'mapcss_error'].indexOf(warning.id)).to.be.greaterThan(-1);
                // expect(warning.entity).to.be.instanceOf(iD.Entity);
            // });
        });
    });
});

