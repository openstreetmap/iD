describe('iD.osmWay', function() {
    var _savedAreaKeys;

    before(function() {
        _savedAreaKeys = iD.osmAreaKeys;
        iD.osmSetAreaKeys({ building: {} });
    });

    after(function() {
        iD.osmSetAreaKeys(_savedAreaKeys);
    });


    if (iD.debug) {
        it('freezes nodes', function () {
            expect(Object.isFrozen(new iD.osmWay().nodes)).toBe(true);
        });
    }

    it('returns a way', function () {
        expect(new iD.osmWay()).toBeInstanceOf(iD.osmWay);
        expect(new iD.osmWay().type).to.equal('way');
    });

    it('defaults nodes to an empty array', function () {
        expect(new iD.osmWay().nodes).to.eql([]);
    });

    it('sets nodes as specified', function () {
        expect(new iD.osmWay({nodes: ['n-1']}).nodes).to.eql(['n-1']);
    });

    it('defaults tags to an empty object', function () {
        expect(new iD.osmWay().tags).to.eql({});
    });

    it('sets tags as specified', function () {
        expect(new iD.osmWay({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });

    describe('#copy', function () {
        it('returns a new Way', function () {
            var w = new iD.osmWay({id: 'w'}),
                result = w.copy(null, {});

            expect(result).toBeInstanceOf(iD.osmWay);
            expect(result).not.to.equal(w);
        });

        it('adds the new Way to input object', function () {
            var w = new iD.osmWay({id: 'w'}),
                copies = {},
                result = w.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(copies.w).to.equal(result);
        });

        it('returns an existing copy in input object', function () {
            var w = new iD.osmWay({id: 'w'}),
                copies = {},
                result1 = w.copy(null, copies),
                result2 = w.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(result1).to.equal(result2);
        });

        it('deep copies nodes', function () {
            var a = new iD.osmNode({id: 'a'}),
                b = new iD.osmNode({id: 'b'}),
                w = new iD.osmWay({id: 'w', nodes: ['a', 'b']}),
                graph = new iD.coreGraph([a, b, w]),
                copies = {},
                result = w.copy(graph, copies);

            expect(Object.keys(copies)).to.have.length(3);
            expect(copies.a).toBeInstanceOf(iD.osmNode);
            expect(copies.b).toBeInstanceOf(iD.osmNode);
            expect(copies.a).not.to.equal(w.nodes[0]);
            expect(copies.b).not.to.equal(w.nodes[1]);
            expect(result.nodes).to.deep.eql([copies.a.id, copies.b.id]);
        });

        it('creates only one copy of shared nodes', function () {
            var a = new iD.osmNode({id: 'a'}),
                w = new iD.osmWay({id: 'w', nodes: ['a', 'a']}),
                graph = new iD.coreGraph([a, w]),
                copies = {},
                result = w.copy(graph, copies);

            expect(result.nodes[0]).to.equal(result.nodes[1]);
        });
    });

    describe('#first', function () {
        it('returns the first node', function () {
            expect(new iD.osmWay({nodes: ['a', 'b', 'c']}).first()).to.equal('a');
        });
    });

    describe('#last', function () {
        it('returns the last node', function () {
            expect(new iD.osmWay({nodes: ['a', 'b', 'c']}).last()).to.equal('c');
        });
    });

    describe('#contains', function () {
        it('returns true if the way contains the given node', function () {
            expect(new iD.osmWay({nodes: ['a', 'b', 'c']}).contains('b')).toBe(true);
        });

        it('returns false if the way does not contain the given node', function () {
            expect(new iD.osmWay({nodes: ['a', 'b', 'c']}).contains('d')).toBe(false);
        });
    });

    describe('#affix', function () {
        it('returns \'prefix\' if the way starts with the given node', function () {
            expect(new iD.osmWay({nodes: ['a', 'b', 'c']}).affix('a')).to.equal('prefix');
        });

        it('returns \'suffix\' if the way ends with the given node', function () {
            expect(new iD.osmWay({nodes: ['a', 'b', 'c']}).affix('c')).to.equal('suffix');
        });

        it('returns falsy if the way does not start or end with the given node', function () {
            expect(new iD.osmWay({nodes: ['a', 'b', 'c']}).affix('b')).toBeFalsy();
            expect(new iD.osmWay({nodes: []}).affix('b')).toBeFalsy();
        });
    });

    describe('#extent', function () {
        it('returns the minimal extent containing all member nodes', function () {
            var node1 = new iD.osmNode({loc: [0, 0]}),
                node2 = new iD.osmNode({loc: [5, 10]}),
                way   = new iD.osmWay({nodes: [node1.id, node2.id]}),
                graph = new iD.coreGraph([node1, node2, way]);
            expect(way.extent(graph).equals([[0, 0], [5, 10]])).toBeTruthy();
        });
    });

    describe('#isClosed', function() {
        it('returns false when the way contains no nodes', function() {
            expect(new iD.osmWay().isClosed()).toBe(false);
        });

        it('returns false when the way contains a single node', function() {
            expect(new iD.osmWay({ nodes: 'a'.split('') }).isClosed()).toBe(false);
        });

        it('returns false when the way ends are not equal', function() {
            expect(new iD.osmWay({ nodes: 'abc'.split('') }).isClosed()).toBe(false);
        });

        it('returns true when the way ends are equal', function() {
            expect(new iD.osmWay({ nodes: 'aba'.split('') }).isClosed()).toBe(true);
        });

        it('returns true when the way contains two of the same node', function() {
            expect(new iD.osmWay({ nodes: 'aa'.split('') }).isClosed()).toBe(true);
        });
    });

    describe('#isConvex', function() {
        it('returns true for convex ways', function() {
            //    d -- e
            //    |     \
            //    |      a
            //    |     /
            //    c -- b
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [ 0.0003,  0.0000]}),
                new iD.osmNode({id: 'b', loc: [ 0.0002, -0.0002]}),
                new iD.osmNode({id: 'c', loc: [-0.0002, -0.0002]}),
                new iD.osmNode({id: 'd', loc: [-0.0002,  0.0002]}),
                new iD.osmNode({id: 'e', loc: [ 0.0002,  0.0002]}),
                new iD.osmWay({id: 'w', nodes: ['a','b','c','d','e','a']})
            ]);
            expect(graph.entity('w').isConvex(graph)).toBe(true);
        });

        it('returns false for concave ways', function() {
            //    d -- e
            //    |   /
            //    |  a
            //    |   \
            //    c -- b
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [ 0.0000,  0.0000]}),
                new iD.osmNode({id: 'b', loc: [ 0.0002, -0.0002]}),
                new iD.osmNode({id: 'c', loc: [-0.0002, -0.0002]}),
                new iD.osmNode({id: 'd', loc: [-0.0002,  0.0002]}),
                new iD.osmNode({id: 'e', loc: [ 0.0002,  0.0002]}),
                new iD.osmWay({id: 'w', nodes: ['a','b','c','d','e','a']})
            ]);
            expect(graph.entity('w').isConvex(graph)).toBe(false);
        });

        it('returns null for non-closed ways', function() {
            //    d -- e
            //    |
            //    |  a
            //    |   \
            //    c -- b
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [ 0.0000,  0.0000]}),
                new iD.osmNode({id: 'b', loc: [ 0.0002, -0.0002]}),
                new iD.osmNode({id: 'c', loc: [-0.0002, -0.0002]}),
                new iD.osmNode({id: 'd', loc: [-0.0002,  0.0002]}),
                new iD.osmNode({id: 'e', loc: [ 0.0002,  0.0002]}),
                new iD.osmWay({id: 'w', nodes: ['a','b','c','d','e']})
            ]);
            expect(graph.entity('w').isConvex(graph)).toBeNull();
        });

        it('returns null for degenerate ways', function() {
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [0.0000,  0.0000]}),
                new iD.osmWay({id: 'w', nodes: ['a','a']})
            ]);
            expect(graph.entity('w').isConvex(graph)).toBeNull();
        });
    });

    describe('#layer', function() {
        it('returns 0 when the way has no tags', function() {
            expect(new iD.osmWay().layer()).to.equal(0);
        });

        it('returns 0 when the way has a non numeric layer tag', function() {
            expect(new iD.osmWay({tags: { layer: 'NaN' }}).layer()).to.equal(0);
            expect(new iD.osmWay({tags: { layer: 'Infinity' }}).layer()).to.equal(0);
            expect(new iD.osmWay({tags: { layer: 'Foo' }}).layer()).to.equal(0);
        });

        it('returns the layer when the way has an explicit layer tag', function() {
            expect(new iD.osmWay({tags: { layer: '2' }}).layer()).to.equal(2);
            expect(new iD.osmWay({tags: { layer: '-5' }}).layer()).to.equal(-5);
        });

        it('clamps the layer to within -10, 10', function() {
            expect(new iD.osmWay({tags: { layer: '12' }}).layer()).to.equal(10);
            expect(new iD.osmWay({tags: { layer: '-15' }}).layer()).to.equal(-10);
        });

        it('returns 1 for location=overground', function() {
            expect(new iD.osmWay({tags: { location: 'overground' }}).layer()).to.equal(1);
        });

        it('returns -1 for covered=yes', function() {
            expect(new iD.osmWay({tags: { covered: 'yes' }}).layer()).to.equal(-1);
        });

        it('returns -1 for location=underground', function() {
            expect(new iD.osmWay({tags: { location: 'underground' }}).layer()).to.equal(-1);
        });

        it('returns -10 for location=underwater', function() {
            expect(new iD.osmWay({tags: { location: 'underwater' }}).layer()).to.equal(-10);
        });

        it('returns 10 for power lines', function() {
            expect(new iD.osmWay({tags: { power: 'line' }}).layer()).to.equal(10);
            expect(new iD.osmWay({tags: { power: 'minor_line' }}).layer()).to.equal(10);
        });

        it('returns 10 for aerialways', function() {
            expect(new iD.osmWay({tags: { aerialway: 'cable_car' }}).layer()).to.equal(10);
        });

        it('returns 1 for bridges', function() {
            expect(new iD.osmWay({tags: { bridge: 'yes' }}).layer()).to.equal(1);
        });

        it('returns -1 for cuttings', function() {
            expect(new iD.osmWay({tags: { cutting: 'yes' }}).layer()).to.equal(-1);
        });

        it('returns -1 for tunnels', function() {
            expect(new iD.osmWay({tags: { tunnel: 'yes' }}).layer()).to.equal(-1);
        });

        it('returns -1 for waterways', function() {
            expect(new iD.osmWay({tags: { waterway: 'stream' }}).layer()).to.equal(-1);
        });

        it('returns -10 for pipelines', function() {
            expect(new iD.osmWay({tags: { man_made: 'pipeline' }}).layer()).to.equal(-10);
        });

        it('returns -10 for boundaries', function() {
            expect(new iD.osmWay({tags: { boundary: 'administrative' }}).layer()).to.equal(-10);
        });

    });

    describe('#isOneWay', function() {
        it('returns false when the way has no tags', function() {
            expect(new iD.osmWay().isOneWay()).toBe(false);
        });

        it('returns false when the way has tag oneway=no', function() {
            expect(new iD.osmWay({tags: { oneway: 'no' }}).isOneWay(), 'oneway no').toBe(false);
            expect(new iD.osmWay({tags: { oneway: '0' }}).isOneWay(), 'oneway 0').toBe(false);
        });

        it('returns true when the way has tag oneway=yes', function() {
            expect(new iD.osmWay({tags: { oneway: 'yes' }}).isOneWay(), 'oneway yes').toBe(true);
            expect(new iD.osmWay({tags: { oneway: '-1' }}).isOneWay(), 'oneway -1').toBe(true);
        });

        it('returns true when the way has tag oneway=reversible', function() {
            expect(new iD.osmWay({tags: { oneway: 'reversible' }}).isOneWay(), 'oneway reversible').toBe(true);
        });

        it('returns true when the way has tag oneway=alternating', function() {
            expect(new iD.osmWay({tags: { oneway: 'alternating' }}).isOneWay(), 'oneway alternating').toBe(true);
        });

        it('returns true when the way has implied oneway tag (waterway=river, waterway=stream, etc)', function() {
            expect(new iD.osmWay({tags: { waterway: 'river' }}).isOneWay(), 'river').toBe(true);
            expect(new iD.osmWay({tags: { waterway: 'stream' }}).isOneWay(), 'stream').toBe(true);
            expect(new iD.osmWay({tags: { highway: 'motorway' }}).isOneWay(), 'motorway').toBe(true);
            expect(new iD.osmWay({tags: { junction: 'roundabout' }}).isOneWay(), 'roundabout').toBe(true);
            expect(new iD.osmWay({tags: { junction: 'circular' }}).isOneWay(), 'circular').toBe(true);
        });

        it('returns false when the way does not have implied oneway tag', function() {
            expect(new iD.osmWay({tags: { highway: 'motorway_link' }}).isOneWay(), 'motorway_link').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'trunk' }}).isOneWay(), 'trunk').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'trunk_link' }}).isOneWay(), 'trunk_link').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'primary' }}).isOneWay(), 'primary').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'primary_link' }}).isOneWay(), 'primary_link').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'secondary' }}).isOneWay(), 'secondary').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'secondary_link' }}).isOneWay(), 'secondary_link').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'tertiary' }}).isOneWay(), 'tertiary').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'tertiary_link' }}).isOneWay(), 'tertiary_link').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'unclassified' }}).isOneWay(), 'unclassified').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'residential' }}).isOneWay(), 'residential').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'living_street' }}).isOneWay(), 'living_street').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'service' }}).isOneWay(), 'service').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'track' }}).isOneWay(), 'track').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'path' }}).isOneWay(), 'path').toBe(false);
        });

        it('returns false when oneway=no overrides implied oneway tag', function() {
            expect(new iD.osmWay({tags: { junction: 'roundabout', oneway: 'no' }}).isOneWay(), 'roundabout').toBe(false);
            expect(new iD.osmWay({tags: { junction: 'circular', oneway: 'no' }}).isOneWay(), 'circular').toBe(false);
            expect(new iD.osmWay({tags: { highway: 'motorway', oneway: 'no' }}).isOneWay(), 'motorway').toBe(false);
        });
    });

    describe('#sidednessIdentifier', function() {
        it('returns tag when the tag has implied sidedness', function() {
            expect(new iD.osmWay({tags: { natural: 'cliff' }}).sidednessIdentifier()).to.eql('natural');
            expect(new iD.osmWay({tags: { natural: 'coastline' }}).sidednessIdentifier()).to.eql('coastline');
            expect(new iD.osmWay({tags: { barrier: 'retaining_wall' }}).sidednessIdentifier()).to.eql('barrier');
            expect(new iD.osmWay({tags: { barrier: 'kerb' }}).sidednessIdentifier()).to.eql('barrier');
            expect(new iD.osmWay({tags: { barrier: 'guard_rail' }}).sidednessIdentifier()).to.eql('guard_rail');
            expect(new iD.osmWay({tags: { barrier: 'city_wall' }}).sidednessIdentifier()).to.eql('barrier');
            expect(new iD.osmWay({tags: { man_made: 'embankment' }}).sidednessIdentifier()).to.eql('man_made');
            expect(new iD.osmWay({tags: { 'abandoned:barrier': 'retaining_wall' }}).sidednessIdentifier()).to.eql('barrier');
        });

        it('returns null when tag does not have implied sidedness', function() {
            expect(new iD.osmWay({tags: { natural: 'ridge' }}).sidednessIdentifier()).toBeNull();
            expect(new iD.osmWay({tags: { barrier: 'fence' }}).sidednessIdentifier()).toBeNull();
            expect(new iD.osmWay({tags: { man_made: 'dyke' }}).sidednessIdentifier()).toBeNull();
            expect(new iD.osmWay({tags: { highway: 'motorway' }}).sidednessIdentifier()).toBeNull();
            expect(new iD.osmWay({tags: { 'demolished:highway': 'motorway' }}).sidednessIdentifier()).toBeNull();
            expect(new iD.osmWay({tags: { 'not:natural': 'cliff' }}).sidednessIdentifier()).toBeNull();
        });
    });

    describe('#isSided', function() {
        it('returns false when the way has no tags', function() {
            expect(new iD.osmWay().isSided()).toBe(false);
        });

        it('returns false when the way has two_sided=yes', function() {
            expect(new iD.osmWay({tags: { two_sided: 'yes' }}).isSided()).toBe(false);
        });

        it('returns true when the tag has implied sidedness', function() {
            expect(new iD.osmWay({tags: { natural: 'cliff' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { natural: 'coastline' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { barrier: 'retaining_wall' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { barrier: 'kerb' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { barrier: 'guard_rail' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { barrier: 'city_wall' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { man_made: 'embankment' }}).isSided()).toBe(true);
        });

        it('returns false when two_sided=yes overrides tag with implied sidedness', function() {
            expect(new iD.osmWay({tags: { natural: 'cliff', two_sided: 'yes' }}).isSided()).toBe(false);
            expect(new iD.osmWay({tags: { natural: 'coastline', two_sided: 'yes' }}).isSided()).toBe(false);
            expect(new iD.osmWay({tags: { barrier: 'retaining_wall', two_sided: 'yes' }}).isSided()).toBe(false);
            expect(new iD.osmWay({tags: { barrier: 'kerb', two_sided: 'yes' }}).isSided()).toBe(false);
            expect(new iD.osmWay({tags: { barrier: 'guard_rail', two_sided: 'yes' }}).isSided()).toBe(false);
            expect(new iD.osmWay({tags: { barrier: 'city_wall', two_sided: 'yes' }}).isSided()).toBe(false);
            expect(new iD.osmWay({tags: { man_made: 'embankment', two_sided: 'yes' }}).isSided()).toBe(false);
        });

        it('returns true when two_sided=no is on tag with implied sidedness', function() {
            expect(new iD.osmWay({tags: { natural: 'cliff', two_sided: 'no' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { natural: 'coastline', two_sided: 'no' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { barrier: 'retaining_wall', two_sided: 'no' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { barrier: 'kerb', two_sided: 'no' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { barrier: 'guard_rail', two_sided: 'no' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { barrier: 'city_wall', two_sided: 'no' }}).isSided()).toBe(true);
            expect(new iD.osmWay({tags: { man_made: 'embankment', two_sided: 'no' }}).isSided()).toBe(true);
        });

        it('returns false when the tag does not have implied sidedness', function() {
            expect(new iD.osmWay({tags: { natural: 'ridge' }}).isSided()).toBe(false);
            expect(new iD.osmWay({tags: { barrier: 'fence' }}).isSided()).toBe(false);
            expect(new iD.osmWay({tags: { man_made: 'dyke' }}).isSided()).toBe(false);
            expect(new iD.osmWay({tags: { highway: 'motorway' }}).isSided()).toBe(false);
        });
    });

    describe('#isArea', function() {
        it('returns false when the way has no tags', function() {
            expect(new iD.osmWay().isArea()).to.equal(false);
        });

        it('returns true if the way has tag area=yes', function() {
            expect(new iD.osmWay({tags: { area: 'yes' }}).isArea()).to.equal(true);
        });

        it('returns false if the way is closed and has no tags', function() {
            expect(new iD.osmWay({nodes: ['n1', 'n1']}).isArea()).to.equal(false);
        });

        it('returns true if the way is closed and has a key in iD.osmAreaKeys', function() {
            expect(new iD.osmWay({nodes: ['n1', 'n1'], tags: {building: 'yes'}}).isArea()).to.equal(true);
        });

        it('returns true for some highway and railway exceptions', function() {
            expect(new iD.osmWay({nodes: ['n1', 'n1'], tags: { highway: 'services' }}).isArea(), 'highway=services').to.equal(true);
            expect(new iD.osmWay({nodes: ['n1', 'n1'], tags: { highway: 'rest_area' }}).isArea(), 'highway=rest_area').to.equal(true);
            expect(new iD.osmWay({nodes: ['n1', 'n1'], tags: { railway: 'roundhouse' }}).isArea(), 'railway=roundhouse').to.equal(true);
            expect(new iD.osmWay({nodes: ['n1', 'n1'], tags: { railway: 'station' }}).isArea(), 'railway=station').to.equal(true);
            expect(new iD.osmWay({nodes: ['n1', 'n1'], tags: { railway: 'traverser' }}).isArea(), 'railway=traverser').to.equal(true);
            expect(new iD.osmWay({nodes: ['n1', 'n1'], tags: { railway: 'turntable' }}).isArea(), 'railway=turntable').to.equal(true);
            expect(new iD.osmWay({nodes: ['n1', 'n1'], tags: { railway: 'wash' }}).isArea(), 'railway=wash').to.equal(true);
        });

        it('returns false if the way is closed and has no keys in iD.osmAreaKeys', function() {
            expect(new iD.osmWay({nodes: ['n1', 'n1'], tags: {a: 'b'}}).isArea()).to.equal(false);
        });

        it('returns false if the way is closed and has tag area=no', function() {
            expect(new iD.osmWay({nodes: ['n1', 'n1'], tags: {area: 'no', building: 'yes'}}).isArea()).to.equal(false);
        });

        it('returns false for coastline', function() {
            expect(new iD.osmWay({nodes: ['n1', 'n1'], tags: {natural: 'coastline'}}).isArea()).to.equal(false);
        });
    });

    describe('#isDegenerate', function() {
       it('returns true for a linear way with zero or one nodes', function () {
           expect(new iD.osmWay({nodes: []}).isDegenerate()).to.equal(true);
           expect(new iD.osmWay({nodes: ['a']}).isDegenerate()).to.equal(true);
       });

        it('returns true for a circular way with only one unique node', function () {
            expect(new iD.osmWay({nodes: ['a', 'a']}).isDegenerate()).to.equal(true);
        });

        it('returns false for a linear way with two or more nodes', function () {
            expect(new iD.osmWay({nodes: ['a', 'b']}).isDegenerate()).to.equal(false);
        });

        it('returns true for a linear way that doubles back on itself', function () {
            expect(new iD.osmWay({nodes: ['a', 'b', 'a']}).isDegenerate()).to.equal(true);
        });

        it('returns true for an area with zero, one, or two unique nodes', function () {
            expect(new iD.osmWay({tags: {area: 'yes'}, nodes: []}).isDegenerate()).to.equal(true);
            expect(new iD.osmWay({tags: {area: 'yes'}, nodes: ['a', 'a']}).isDegenerate()).to.equal(true);
            expect(new iD.osmWay({tags: {area: 'yes'}, nodes: ['a', 'b', 'a']}).isDegenerate()).to.equal(true);
        });

        it('returns false for an area with three or more unique nodes', function () {
            expect(new iD.osmWay({tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'a']}).isDegenerate()).to.equal(false);
        });
    });

    describe('#areAdjacent', function() {
        it('returns false for nodes not in the way', function() {
            expect(new iD.osmWay().areAdjacent('a', 'b')).to.equal(false);
        });

        it('returns false for non-adjacent nodes in the way', function() {
            expect(new iD.osmWay({nodes: ['a', 'b', 'c']}).areAdjacent('a', 'c')).to.equal(false);
        });

        it('returns true for adjacent nodes in the way (forward)', function() {
            var way = new iD.osmWay({nodes: ['a', 'b', 'c', 'd']});
            expect(way.areAdjacent('a', 'b')).to.equal(true);
            expect(way.areAdjacent('b', 'c')).to.equal(true);
            expect(way.areAdjacent('c', 'd')).to.equal(true);
        });

        it('returns true for adjacent nodes in the way (reverse)', function() {
            var way = new iD.osmWay({nodes: ['a', 'b', 'c', 'd']});
            expect(way.areAdjacent('b', 'a')).to.equal(true);
            expect(way.areAdjacent('c', 'b')).to.equal(true);
            expect(way.areAdjacent('d', 'c')).to.equal(true);
        });
    });

    describe('#geometry', function() {
        it('returns \'line\' when the way is not an area', function () {
            expect(new iD.osmWay().geometry(new iD.coreGraph())).to.equal('line');
        });

        it('returns \'area\' when the way is an area', function () {
            expect(new iD.osmWay({tags: { area: 'yes' }}).geometry(new iD.coreGraph())).to.equal('area');
        });
    });

    describe('#close', function () {
        it('returns self for empty way', function () {
            var w = new iD.osmWay();
            expect(w.close()).toEqual(w);
        });

        it('returns self for already closed way', function () {
            var w1 = new iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.close()).toEqual(w1);
            var w2 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.close()).toEqual(w2);
        });

        it('closes a way', function () {
            var w1 = new iD.osmWay({ nodes: 'ab'.split('') });
            expect(w1.close().nodes.join('')).to.eql('aba', 'multiple');
            var w2 = new iD.osmWay({ nodes: 'a'.split('') });
            expect(w2.close().nodes.join('')).to.eql('aa', 'single');
        });

        it('eliminates duplicate consecutive nodes when closing a linear way', function () {
            var w1 = new iD.osmWay({ nodes: 'abb'.split('') });
            expect(w1.close().nodes.join('')).to.eql('aba', 'duplicate at end');
            var w2 = new iD.osmWay({ nodes: 'abbc'.split('') });
            expect(w2.close().nodes.join('')).to.eql('abca', 'duplicate in middle');
            var w3 = new iD.osmWay({ nodes: 'aabc'.split('') });
            expect(w3.close().nodes.join('')).to.eql('abca', 'duplicate at beginning');
            var w4 = new iD.osmWay({ nodes: 'abbbcbb'.split('') });
            expect(w4.close().nodes.join('')).to.eql('abcba', 'duplicates multiple places');
        });
    });

    describe('#unclose', function () {
        it('returns self for empty way', function () {
            var w = new iD.osmWay();
            expect(w.unclose()).toEqual(w);
        });

        it('returns self for already unclosed way', function () {
            var w1 = new iD.osmWay({ nodes: 'a'.split('') });
            expect(w1.unclose()).toEqual(w1);
            var w2 = new iD.osmWay({ nodes: 'ab'.split('') });
            expect(w2.unclose()).toEqual(w2);
        });

        it('uncloses a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.unclose().nodes.join('')).to.eql('ab', 'multiple');
            var w2 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.unclose().nodes.join('')).to.eql('a', 'single');
        });

        it('eliminates duplicate consecutive nodes when unclosing a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.unclose().nodes.join('')).to.eql('abc', 'duplicate internal node at end');
            var w2 = new iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.unclose().nodes.join('')).to.eql('abc', 'duplicate internal node in middle');
            var w3 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.unclose().nodes.join('')).to.eql('abc', 'duplicate connector node at beginning');
            var w4 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.unclose().nodes.join('')).to.eql('abc', 'duplicate connector node at end');
            var w5 = new iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.unclose().nodes.join('')).to.eql('abcb', 'duplicates multiple places');
            var w6 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.unclose().nodes.join('')).to.eql('a', 'single node circular');
            var w7 = new iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.unclose().nodes.join('')).to.eql('a', 'single node circular with duplicates');
        });
    });

    describe('#addNode', function () {
        it('adds a node to an empty way', function () {
            var w = new iD.osmWay();
            expect(w.addNode('a').nodes).to.eql(['a']);
        });

        it('adds a node to the end of a linear way when index is undefined', function () {
            var w = new iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.addNode('c').nodes.join('')).to.eql('abc');
        });

        it('adds a node before the end connector of a circular way when index is undefined', function () {
            var w1 = new iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.addNode('c').nodes.join('')).to.eql('abca', 'circular');
            var w2 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.addNode('c').nodes.join('')).to.eql('aca', 'single node circular');
        });

        it('adds an internal node to a linear way at a positive index', function () {
            var w = new iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.addNode('c', 1).nodes.join('')).to.eql('acb');
        });

        it('adds an internal node to a circular way at a positive index', function () {
            var w1 = new iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.addNode('c', 1).nodes.join('')).to.eql('acba', 'circular');
            var w2 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.addNode('c', 1).nodes.join('')).to.eql('aca', 'single node circular');
        });

        it('adds a leading node to a linear way at index 0', function () {
            var w = new iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.addNode('c', 0).nodes.join('')).to.eql('cab');
        });

        it('adds a leading node to a circular way at index 0, preserving circularity', function () {
            var w1 = new iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.addNode('c', 0).nodes.join('')).to.eql('cabc', 'circular');
            var w2 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.addNode('c', 0).nodes.join('')).to.eql('cac', 'single node circular');
        });

        it('throws RangeError if index outside of array range for linear way', function () {
            var w = new iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.addNode.bind(w, 'c', 3)).to.throw(RangeError, /out of range 0\.\.2/, 'over range');
            expect(w.addNode.bind(w, 'c', -1)).to.throw(RangeError, /out of range 0\.\.2/, 'under range');
        });

        it('throws RangeError if index outside of array range for circular way', function () {
            var w = new iD.osmWay({ nodes: 'aba'.split('') });
            expect(w.addNode.bind(w, 'c', 3)).to.throw(RangeError, /out of range 0\.\.2/, 'over range');
            expect(w.addNode.bind(w, 'c', -1)).to.throw(RangeError, /out of range 0\.\.2/, 'under range');
        });

        it('eliminates duplicate consecutive nodes when adding to the end of a linear way', function () {
            var w1 = new iD.osmWay({ nodes: 'abb'.split('') });
            expect(w1.addNode('b').nodes.join('')).to.eql('ab', 'duplicate at end');
            var w2 = new iD.osmWay({ nodes: 'abbc'.split('') });
            expect(w2.addNode('c').nodes.join('')).to.eql('abc', 'duplicate in middle');
            var w3 = new iD.osmWay({ nodes: 'aabc'.split('') });
            expect(w3.addNode('c').nodes.join('')).to.eql('abc', 'duplicate at beginning');
            var w4 = new iD.osmWay({ nodes: 'abbbcbb'.split('') });
            expect(w4.addNode('b').nodes.join('')).to.eql('abcb', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when adding same node before the end connector of a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.addNode('c').nodes.join('')).to.eql('abca', 'duplicate internal node at end');
            var w2 = new iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.addNode('c').nodes.join('')).to.eql('abca', 'duplicate internal node in middle');
            var w3 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.addNode('c').nodes.join('')).to.eql('abca', 'duplicate connector node at beginning');
            var w4 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.addNode('a').nodes.join('')).to.eql('abca', 'duplicate connector node at end');
            var w5 = new iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.addNode('b').nodes.join('')).to.eql('abcba', 'duplicates multiple places');
            var w6 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.addNode('a').nodes.join('')).to.eql('aa', 'single node circular');
            var w7 = new iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.addNode('a').nodes.join('')).to.eql('aa', 'single node circular with duplicates');
        });

        it('eliminates duplicate consecutive nodes when adding different node before the end connector of a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.addNode('d').nodes.join('')).to.eql('abcda', 'duplicate internal node at end');
            var w2 = new iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.addNode('d').nodes.join('')).to.eql('abcda', 'duplicate internal node in middle');
            var w3 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.addNode('d').nodes.join('')).to.eql('abcda', 'duplicate connector node at beginning');
            var w4 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.addNode('d').nodes.join('')).to.eql('abcda', 'duplicate connector node at end');
            var w5 = new iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.addNode('d').nodes.join('')).to.eql('abcbda', 'duplicates multiple places');
            var w6 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.addNode('d').nodes.join('')).to.eql('ada', 'single node circular');
            var w7 = new iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.addNode('d').nodes.join('')).to.eql('ada', 'single node circular with duplicates');
        });

        it('eliminates duplicate consecutive nodes when adding to the beginning of a linear way', function () {
            var w1 = new iD.osmWay({ nodes: 'abb'.split('') });
            expect(w1.addNode('a', 0).nodes.join('')).to.eql('ab', 'duplicate at end');
            var w2 = new iD.osmWay({ nodes: 'abbc'.split('') });
            expect(w2.addNode('a', 0).nodes.join('')).to.eql('abc', 'duplicate in middle');
            var w3 = new iD.osmWay({ nodes: 'aabc'.split('') });
            expect(w3.addNode('a', 0).nodes.join('')).to.eql('abc', 'duplicate at beginning');
            var w4 = new iD.osmWay({ nodes: 'abbbcbb'.split('') });
            expect(w4.addNode('a', 0).nodes.join('')).to.eql('abcb', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when adding same node as beginning connector a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.addNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate internal node at end');
            var w2 = new iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.addNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate internal node in middle');
            var w3 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.addNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate connector node at beginning');
            var w4 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.addNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate connector node at end');
            var w5 = new iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.addNode('a', 0).nodes.join('')).to.eql('abcba', 'duplicates multiple places');
            var w6 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.addNode('a', 0).nodes.join('')).to.eql('aa', 'single node circular');
            var w7 = new iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.addNode('a', 0).nodes.join('')).to.eql('aa', 'single node circular with duplicates');
        });

        it('eliminates duplicate consecutive nodes when adding different node as beginning connector of a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.addNode('d', 0).nodes.join('')).to.eql('dabcd', 'duplicate internal node at end');
            var w2 = new iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.addNode('d', 0).nodes.join('')).to.eql('dabcd', 'duplicate internal node in middle');
            var w3 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.addNode('d', 0).nodes.join('')).to.eql('dabcd', 'duplicate connector node at beginning');
            var w4 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.addNode('d', 0).nodes.join('')).to.eql('dabcd', 'duplicate connector node at end');
            var w5 = new iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.addNode('d', 0).nodes.join('')).to.eql('dabcbd', 'duplicates multiple places');
            var w6 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.addNode('d', 0).nodes.join('')).to.eql('dad', 'single node circular');
            var w7 = new iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.addNode('d', 0).nodes.join('')).to.eql('dad', 'single node circular with duplicates');
        });
    });

    describe('#updateNode', function () {
        it('throws RangeError if empty way', function () {
            var w = new iD.osmWay();
            expect(w.updateNode.bind(w, 'd', 0)).to.throw(RangeError, /out of range 0\.\.-1/);
        });

        it('updates an internal node on a linear way at a positive index', function () {
            var w = new iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.updateNode('d', 1).nodes.join('')).to.eql('ad');
        });

        it('updates an internal node on a circular way at a positive index', function () {
            var w = new iD.osmWay({ nodes: 'aba'.split('') });
            expect(w.updateNode('d', 1).nodes.join('')).to.eql('ada', 'circular');
        });

        it('updates a leading node on a linear way at index 0', function () {
            var w = new iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.updateNode('d', 0).nodes.join('')).to.eql('db');
        });

        it('updates a leading node on a circular way at index 0, preserving circularity', function () {
            var w1 = new iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.updateNode('d', 0).nodes.join('')).to.eql('dbd', 'circular');
            var w2 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.updateNode('d', 0).nodes.join('')).to.eql('dd', 'single node circular');
        });

        it('throws RangeError if index outside of array range for linear way', function () {
            var w = new iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.updateNode.bind(w, 'd', 2)).to.throw(RangeError, /out of range 0\.\.1/, 'over range');
            expect(w.updateNode.bind(w, 'd', -1)).to.throw(RangeError, /out of range 0\.\.1/, 'under range');
        });

        it('throws RangeError if index outside of array range for circular way', function () {
            var w = new iD.osmWay({ nodes: 'aba'.split('') });
            expect(w.updateNode.bind(w, 'd', 3)).to.throw(RangeError, /out of range 0\.\.2/, 'over range');
            expect(w.updateNode.bind(w, 'd', -1)).to.throw(RangeError, /out of range 0\.\.2/, 'under range');
        });

        it('eliminates duplicate consecutive nodes when updating the end of a linear way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcc'.split('') });
            expect(w1.updateNode('c', 3).nodes.join('')).to.eql('abc', 'duplicate at end');
            var w2 = new iD.osmWay({ nodes: 'abbc'.split('') });
            expect(w2.updateNode('c', 3).nodes.join('')).to.eql('abc', 'duplicate in middle');
            var w3 = new iD.osmWay({ nodes: 'aabc'.split('') });
            expect(w3.updateNode('c', 3).nodes.join('')).to.eql('abc', 'duplicate at beginning');
            var w4 = new iD.osmWay({ nodes: 'abbbcbb'.split('') });
            expect(w4.updateNode('b', 6).nodes.join('')).to.eql('abcb', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when updating same node before the end connector of a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.updateNode('c', 3).nodes.join('')).to.eql('abca', 'duplicate internal node at end');
            var w2 = new iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.updateNode('c', 3).nodes.join('')).to.eql('abca', 'duplicate internal node in middle');
            var w3 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.updateNode('c', 3).nodes.join('')).to.eql('abca', 'duplicate connector node at beginning');
            var w4 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.updateNode('a', 3).nodes.join('')).to.eql('abca', 'duplicate connector node at end');
            var w5 = new iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.updateNode('b', 6).nodes.join('')).to.eql('abcba', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when updating different node before the end connector of a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.updateNode('d', 3).nodes.join('')).to.eql('abcda', 'duplicate internal node at end');
            var w2 = new iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.updateNode('d', 3).nodes.join('')).to.eql('abda', 'duplicate internal node in middle');
            var w3 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.updateNode('d', 3).nodes.join('')).to.eql('abda', 'duplicate connector node at beginning');
            var w4 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.updateNode('d', 3).nodes.join('')).to.eql('dbcd', 'duplicate connector node at end');
            var w5 = new iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.updateNode('d', 6).nodes.join('')).to.eql('abcbda', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when updating the beginning of a linear way', function () {
            var w1 = new iD.osmWay({ nodes: 'abb'.split('') });
            expect(w1.updateNode('b', 0).nodes.join('')).to.eql('b', 'duplicate at end');
            var w2 = new iD.osmWay({ nodes: 'abbc'.split('') });
            expect(w2.updateNode('b', 0).nodes.join('')).to.eql('bc', 'duplicate in middle');
            var w3 = new iD.osmWay({ nodes: 'aabc'.split('') });
            expect(w3.updateNode('a', 0).nodes.join('')).to.eql('abc', 'duplicate at beginning');
            var w4 = new iD.osmWay({ nodes: 'abbbcbb'.split('') });
            expect(w4.updateNode('a', 0).nodes.join('')).to.eql('abcb', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when updating same node as beginning connector a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.updateNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate internal node at end');
            var w2 = new iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.updateNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate internal node in middle');
            var w3 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.updateNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate connector node at beginning');
            var w4 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.updateNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate connector node at end');
            var w5 = new iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.updateNode('a', 0).nodes.join('')).to.eql('abcba', 'duplicates multiple places');
            var w6 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.updateNode('a', 0).nodes.join('')).to.eql('aa', 'single node circular');
            var w7 = new iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.updateNode('a', 0).nodes.join('')).to.eql('aa', 'single node circular with duplicates');
        });

        it('eliminates duplicate consecutive nodes when updating different node as beginning connector of a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.updateNode('d', 0).nodes.join('')).to.eql('dbcd', 'duplicate internal node at end');
            var w2 = new iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.updateNode('d', 0).nodes.join('')).to.eql('dbcd', 'duplicate internal node in middle');
            var w3 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.updateNode('d', 0).nodes.join('')).to.eql('dbcd', 'duplicate connector node at beginning');
            var w4 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.updateNode('d', 0).nodes.join('')).to.eql('dbcd', 'duplicate connector node at end');
            var w5 = new iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.updateNode('d', 0).nodes.join('')).to.eql('dbcbd', 'duplicates multiple places');
            var w6 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.updateNode('d', 0).nodes.join('')).to.eql('dd', 'single node circular');
            var w7 = new iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.updateNode('d', 0).nodes.join('')).to.eql('dd', 'single node circular with duplicates');
        });

        it('eliminates duplicate consecutive nodes when updating different node as ending connector of a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.updateNode('d', 4).nodes.join('')).to.eql('dbcd', 'duplicate internal node at end');
            var w2 = new iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.updateNode('d', 4).nodes.join('')).to.eql('dbcd', 'duplicate internal node in middle');
            var w3 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.updateNode('d', 4).nodes.join('')).to.eql('dbcd', 'duplicate connector node at beginning');
            var w4 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.updateNode('d', 4).nodes.join('')).to.eql('dbcd', 'duplicate connector node at end');
            var w5 = new iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.updateNode('d', 7).nodes.join('')).to.eql('dbcbd', 'duplicates multiple places');
            var w6 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.updateNode('d', 1).nodes.join('')).to.eql('dd', 'single node circular');
            var w7 = new iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.updateNode('d', 2).nodes.join('')).to.eql('dd', 'single node circular with duplicates');
        });
    });

    describe('#replaceNode', function () {
        it('replaces a node', function () {
            var w1 = new iD.osmWay({ nodes: 'a'.split('') });
            expect(w1.replaceNode('a','b').nodes.join('')).to.eql('b', 'single replace, single node');
            var w2 = new iD.osmWay({ nodes: 'abc'.split('') });
            expect(w2.replaceNode('b','d').nodes.join('')).to.eql('adc', 'single replace, linear');
            var w4 = new iD.osmWay({ nodes: 'abca'.split('') });
            expect(w4.replaceNode('b','d').nodes.join('')).to.eql('adca', 'single replace, circular');
        });

        it('replaces multiply occurring nodes', function () {
            var w1 = new iD.osmWay({ nodes: 'abcb'.split('') });
            expect(w1.replaceNode('b','d').nodes.join('')).to.eql('adcd', 'multiple replace, linear');
            var w2 = new iD.osmWay({ nodes: 'abca'.split('') });
            expect(w2.replaceNode('a','d').nodes.join('')).to.eql('dbcd', 'multiple replace, circular');
            var w3 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w3.replaceNode('a','d').nodes.join('')).to.eql('dd', 'multiple replace, single node circular');
        });

        it('eliminates duplicate consecutive nodes when replacing along a linear way', function () {
            var w1 = new iD.osmWay({ nodes: 'abbcd'.split('') });
            expect(w1.replaceNode('c','b').nodes.join('')).to.eql('abd', 'duplicate before');
            var w2 = new iD.osmWay({ nodes: 'abcdd'.split('') });
            expect(w2.replaceNode('c','d').nodes.join('')).to.eql('abd', 'duplicate after');
            var w3 = new iD.osmWay({ nodes: 'abbcbb'.split('')});
            expect(w3.replaceNode('c','b').nodes.join('')).to.eql('ab', 'duplicate before and after');
        });

        it('eliminates duplicate consecutive nodes when replacing internal nodes along a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abbcda'.split('') });
            expect(w1.replaceNode('c','b').nodes.join('')).to.eql('abda', 'duplicate before');
            var w2 = new iD.osmWay({ nodes: 'abcdda'.split('') });
            expect(w2.replaceNode('c','d').nodes.join('')).to.eql('abda', 'duplicate after');
            var w3 = new iD.osmWay({ nodes: 'abbcbba'.split('')});
            expect(w3.replaceNode('c','b').nodes.join('')).to.eql('aba', 'duplicate before and after');
        });

        it('eliminates duplicate consecutive nodes when replacing adjacent to connecting nodes along a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcda'.split('') });
            expect(w1.replaceNode('d','a').nodes.join('')).to.eql('abca', 'before single end connector');
            var w2 = new iD.osmWay({ nodes: 'abcda'.split('') });
            expect(w2.replaceNode('b','a').nodes.join('')).to.eql('acda', 'after single beginning connector');
            var w3 = new iD.osmWay({ nodes: 'abcdaa'.split('') });
            expect(w3.replaceNode('d','a').nodes.join('')).to.eql('abca', 'before duplicate end connector');
            var w4 = new iD.osmWay({ nodes: 'aabcda'.split('') });
            expect(w4.replaceNode('b','a').nodes.join('')).to.eql('acda', 'after duplicate beginning connector');
        });

        it('eliminates duplicate consecutive nodes when replacing connecting nodes along a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w1.replaceNode('a','d').nodes.join('')).to.eql('dbcd', 'duplicate end connector');
            var w2 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w2.replaceNode('a','d').nodes.join('')).to.eql('dbcd', 'duplicate beginning connector');
            var w3 = new iD.osmWay({ nodes: 'aabcaa'.split('') });
            expect(w3.replaceNode('a','d').nodes.join('')).to.eql('dbcd', 'duplicate beginning and end connectors');
            var w4 = new iD.osmWay({ nodes: 'aabaacaa'.split('') });
            expect(w4.replaceNode('a','d').nodes.join('')).to.eql('dbdcd', 'duplicates multiple places');
        });
    });

    describe('#removeNode', function () {
        it('removes a node', function () {
            var w1 = new iD.osmWay({ nodes: 'a'.split('') });
            expect(w1.removeNode('a').nodes.join('')).to.eql('', 'single remove, single node');
            var w2 = new iD.osmWay({ nodes: 'abc'.split('') });
            expect(w2.removeNode('b').nodes.join('')).to.eql('ac', 'single remove, linear');
            var w3 = new iD.osmWay({ nodes: 'abca'.split('') });
            expect(w3.removeNode('b').nodes.join('')).to.eql('aca', 'single remove, circular');
            var w4 = new iD.osmWay({ nodes: 'aa'.split('') });
            expect(w4.removeNode('a').nodes.join('')).to.eql('', 'multiple remove, single node circular');
        });

        it('removes multiply occurring nodes', function () {
            var w1 = new iD.osmWay({ nodes: 'abcb'.split('') });
            expect(w1.removeNode('b').nodes.join('')).to.eql('ac', 'multiple remove, linear');
            var w2 = new iD.osmWay({ nodes: 'abcba'.split('') });
            expect(w2.removeNode('b').nodes.join('')).to.eql('aca', 'multiple remove, circular');
        });

        it('eliminates duplicate consecutive nodes when removing along a linear way', function () {
            var w1 = new iD.osmWay({ nodes: 'abbcd'.split('') });
            expect(w1.removeNode('c').nodes.join('')).to.eql('abd', 'duplicate before');
            var w2 = new iD.osmWay({ nodes: 'abcdd'.split('') });
            expect(w2.removeNode('c').nodes.join('')).to.eql('abd', 'duplicate after');
            var w3 = new iD.osmWay({ nodes: 'abbcbb'.split('')});
            expect(w3.removeNode('c').nodes.join('')).to.eql('ab', 'duplicate before and after');
        });

        it('eliminates duplicate consecutive nodes when removing internal nodes along a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abbcda'.split('') });
            expect(w1.removeNode('c').nodes.join('')).to.eql('abda', 'duplicate before');
            var w2 = new iD.osmWay({ nodes: 'abcdda'.split('') });
            expect(w2.removeNode('c').nodes.join('')).to.eql('abda', 'duplicate after');
            var w3 = new iD.osmWay({ nodes: 'abbcbba'.split('')});
            expect(w3.removeNode('c').nodes.join('')).to.eql('aba', 'duplicate before and after');
        });

        it('eliminates duplicate consecutive nodes when removing adjacent to connecting nodes along a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcdaa'.split('') });
            expect(w1.removeNode('d').nodes.join('')).to.eql('abca', 'duplicate end connector');
            var w2 = new iD.osmWay({ nodes: 'aabcda'.split('') });
            expect(w2.removeNode('b').nodes.join('')).to.eql('acda', 'duplicate beginning connector');
        });

        it('eliminates duplicate consecutive nodes when removing connecting nodes along a circular way', function () {
            var w1 = new iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w1.removeNode('a').nodes.join('')).to.eql('bcb', 'duplicate end connector');
            var w2 = new iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w2.removeNode('a').nodes.join('')).to.eql('bcb', 'duplicate beginning connector');
            var w3 = new iD.osmWay({ nodes: 'aabcaa'.split('') });
            expect(w3.removeNode('a').nodes.join('')).to.eql('bcb', 'duplicate beginning and end connectors');
            var w4 = new iD.osmWay({ nodes: 'aabaacaa'.split('') });
            expect(w4.removeNode('a').nodes.join('')).to.eql('bcb', 'duplicates multiple places');
        });
    });

    describe('#asJXON', function () {
        it('converts a way to jxon', function() {
            var node = new iD.osmWay({id: 'w-1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}});
            expect(node.asJXON()).to.eql({way: {
                '@id': '-1',
                '@version': 0,
                nd: [{keyAttributes: {ref: '1'}}, {keyAttributes: {ref: '2'}}],
                tag: [{keyAttributes: {k: 'highway', v: 'residential'}}]}});
        });

        it('includes changeset if provided', function() {
            expect(new iD.osmWay().asJXON('1234').way['@changeset']).to.equal('1234');
        });
    });

    describe('#asGeoJSON', function () {
        it('converts a line to a GeoJSON LineString geometry', function () {
            var a = new iD.osmNode({loc: [1, 2]}),
                b = new iD.osmNode({loc: [3, 4]}),
                w = new iD.osmWay({tags: {highway: 'residential'}, nodes: [a.id, b.id]}),
                graph = new iD.coreGraph([a, b, w]),
                json = w.asGeoJSON(graph);

            expect(json.type).to.equal('LineString');
            expect(json.coordinates).to.eql([a.loc, b.loc]);
        });

        it('converts an area to a GeoJSON Polygon geometry', function () {
            var a = new iD.osmNode({loc: [1, 2]}),
                b = new iD.osmNode({loc: [5, 6]}),
                c = new iD.osmNode({loc: [3, 4]}),
                w = new iD.osmWay({tags: {area: 'yes'}, nodes: [a.id, b.id, c.id, a.id]}),
                graph = new iD.coreGraph([a, b, c, w]),
                json = w.asGeoJSON(graph);

            expect(json.type).to.equal('Polygon');
            expect(json.coordinates).to.eql([[a.loc, b.loc, c.loc, a.loc]]);
        });

        it('converts an unclosed area to a GeoJSON LineString geometry', function () {
            var a = new iD.osmNode({loc: [1, 2]}),
                b = new iD.osmNode({loc: [5, 6]}),
                c = new iD.osmNode({loc: [3, 4]}),
                w = new iD.osmWay({tags: {area: 'yes'}, nodes: [a.id, b.id, c.id]}),
                graph = new iD.coreGraph([a, b, c, w]),
                json = w.asGeoJSON(graph);

            expect(json.type).to.equal('LineString');
            expect(json.coordinates).to.eql([a.loc, b.loc, c.loc]);
        });
    });

    describe('#area', function() {
        it('returns a relative measure of area', function () {
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [-0.0002,  0.0001]}),
                new iD.osmNode({id: 'b', loc: [ 0.0002,  0.0001]}),
                new iD.osmNode({id: 'c', loc: [ 0.0002, -0.0001]}),
                new iD.osmNode({id: 'd', loc: [-0.0002, -0.0001]}),
                new iD.osmNode({id: 'e', loc: [-0.0004,  0.0002]}),
                new iD.osmNode({id: 'f', loc: [ 0.0004,  0.0002]}),
                new iD.osmNode({id: 'g', loc: [ 0.0004, -0.0002]}),
                new iD.osmNode({id: 'h', loc: [-0.0004, -0.0002]}),
                new iD.osmWay({id: 's', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']}),
                new iD.osmWay({id: 'l', tags: {area: 'yes'}, nodes: ['e', 'f', 'g', 'h', 'e']})
            ]);

            var s = Math.abs(graph.entity('s').area(graph)),
                l = Math.abs(graph.entity('l').area(graph));

            expect(s).to.be.lt(l);
        });

        it('treats unclosed areas as if they were closed', function () {
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [-0.0002,  0.0001]}),
                new iD.osmNode({id: 'b', loc: [ 0.0002,  0.0001]}),
                new iD.osmNode({id: 'c', loc: [ 0.0002, -0.0001]}),
                new iD.osmNode({id: 'd', loc: [-0.0002, -0.0001]}),
                new iD.osmWay({id: 's', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']}),
                new iD.osmWay({id: 'l', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'd']})
            ]);

            var s = graph.entity('s').area(graph),
                l = graph.entity('l').area(graph);

            expect(s).to.equal(l);
        });

        it('returns 0 for degenerate areas', function () {
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [-0.0002,  0.0001]}),
                new iD.osmNode({id: 'b', loc: [ 0.0002,  0.0001]}),
                new iD.osmWay({id: '0', tags: {area: 'yes'}, nodes: []}),
                new iD.osmWay({id: '1', tags: {area: 'yes'}, nodes: ['a']}),
                new iD.osmWay({id: '2', tags: {area: 'yes'}, nodes: ['a', 'b']})
            ]);

            expect(graph.entity('0').area(graph)).to.equal(0);
            expect(graph.entity('1').area(graph)).to.equal(0);
            expect(graph.entity('2').area(graph)).to.equal(0);
        });
    });

});
