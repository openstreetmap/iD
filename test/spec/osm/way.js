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
            expect(Object.isFrozen(iD.osmWay().nodes)).to.be.true;
        });
    }

    it('returns a way', function () {
        expect(iD.osmWay()).to.be.an.instanceOf(iD.osmWay);
        expect(iD.osmWay().type).to.equal('way');
    });

    it('defaults nodes to an empty array', function () {
        expect(iD.osmWay().nodes).to.eql([]);
    });

    it('sets nodes as specified', function () {
        expect(iD.osmWay({nodes: ['n-1']}).nodes).to.eql(['n-1']);
    });

    it('defaults tags to an empty object', function () {
        expect(iD.osmWay().tags).to.eql({});
    });

    it('sets tags as specified', function () {
        expect(iD.osmWay({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });

    describe('#copy', function () {
        it('returns a new Way', function () {
            var w = iD.osmWay({id: 'w'}),
                result = w.copy(null, {});

            expect(result).to.be.an.instanceof(iD.osmWay);
            expect(result).not.to.equal(w);
        });

        it('adds the new Way to input object', function () {
            var w = iD.osmWay({id: 'w'}),
                copies = {},
                result = w.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(copies.w).to.equal(result);
        });

        it('returns an existing copy in input object', function () {
            var w = iD.osmWay({id: 'w'}),
                copies = {},
                result1 = w.copy(null, copies),
                result2 = w.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(result1).to.equal(result2);
        });

        it('deep copies nodes', function () {
            var a = iD.osmNode({id: 'a'}),
                b = iD.osmNode({id: 'b'}),
                w = iD.osmWay({id: 'w', nodes: ['a', 'b']}),
                graph = iD.coreGraph([a, b, w]),
                copies = {},
                result = w.copy(graph, copies);

            expect(Object.keys(copies)).to.have.length(3);
            expect(copies.a).to.be.an.instanceof(iD.osmNode);
            expect(copies.b).to.be.an.instanceof(iD.osmNode);
            expect(copies.a).not.to.equal(w.nodes[0]);
            expect(copies.b).not.to.equal(w.nodes[1]);
            expect(result.nodes).to.deep.eql([copies.a.id, copies.b.id]);
        });

        it('creates only one copy of shared nodes', function () {
            var a = iD.osmNode({id: 'a'}),
                w = iD.osmWay({id: 'w', nodes: ['a', 'a']}),
                graph = iD.coreGraph([a, w]),
                copies = {},
                result = w.copy(graph, copies);

            expect(result.nodes[0]).to.equal(result.nodes[1]);
        });
    });

    describe('#first', function () {
        it('returns the first node', function () {
            expect(iD.osmWay({nodes: ['a', 'b', 'c']}).first()).to.equal('a');
        });
    });

    describe('#last', function () {
        it('returns the last node', function () {
            expect(iD.osmWay({nodes: ['a', 'b', 'c']}).last()).to.equal('c');
        });
    });

    describe('#contains', function () {
        it('returns true if the way contains the given node', function () {
            expect(iD.osmWay({nodes: ['a', 'b', 'c']}).contains('b')).to.be.true;
        });

        it('returns false if the way does not contain the given node', function () {
            expect(iD.osmWay({nodes: ['a', 'b', 'c']}).contains('d')).to.be.false;
        });
    });

    describe('#affix', function () {
        it('returns \'prefix\' if the way starts with the given node', function () {
            expect(iD.osmWay({nodes: ['a', 'b', 'c']}).affix('a')).to.equal('prefix');
        });

        it('returns \'suffix\' if the way ends with the given node', function () {
            expect(iD.osmWay({nodes: ['a', 'b', 'c']}).affix('c')).to.equal('suffix');
        });

        it('returns falsy if the way does not start or end with the given node', function () {
            expect(iD.osmWay({nodes: ['a', 'b', 'c']}).affix('b')).not.to.be.ok;
            expect(iD.osmWay({nodes: []}).affix('b')).not.to.be.ok;
        });
    });

    describe('#extent', function () {
        it('returns the minimal extent containing all member nodes', function () {
            var node1 = iD.osmNode({loc: [0, 0]}),
                node2 = iD.osmNode({loc: [5, 10]}),
                way   = iD.osmWay({nodes: [node1.id, node2.id]}),
                graph = iD.coreGraph([node1, node2, way]);
            expect(way.extent(graph).equals([[0, 0], [5, 10]])).to.be.ok;
        });
    });

    describe('#isClosed', function() {
        it('returns false when the way contains no nodes', function() {
            expect(iD.osmWay().isClosed()).to.be.false;
        });

        it('returns false when the way contains a single node', function() {
            expect(iD.osmWay({ nodes: 'a'.split('') }).isClosed()).to.be.false;
        });

        it('returns false when the way ends are not equal', function() {
            expect(iD.osmWay({ nodes: 'abc'.split('') }).isClosed()).to.be.false;
        });

        it('returns true when the way ends are equal', function() {
            expect(iD.osmWay({ nodes: 'aba'.split('') }).isClosed()).to.be.true;
        });

        it('returns true when the way contains two of the same node', function() {
            expect(iD.osmWay({ nodes: 'aa'.split('') }).isClosed()).to.be.true;
        });
    });

    describe('#isConvex', function() {
        it('returns true for convex ways', function() {
            //    d -- e
            //    |     \
            //    |      a
            //    |     /
            //    c -- b
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [ 0.0003,  0.0000]}),
                iD.osmNode({id: 'b', loc: [ 0.0002, -0.0002]}),
                iD.osmNode({id: 'c', loc: [-0.0002, -0.0002]}),
                iD.osmNode({id: 'd', loc: [-0.0002,  0.0002]}),
                iD.osmNode({id: 'e', loc: [ 0.0002,  0.0002]}),
                iD.osmWay({id: 'w', nodes: ['a','b','c','d','e','a']})
            ]);
            expect(graph.entity('w').isConvex(graph)).to.be.true;
        });

        it('returns false for concave ways', function() {
            //    d -- e
            //    |   /
            //    |  a
            //    |   \
            //    c -- b
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [ 0.0000,  0.0000]}),
                iD.osmNode({id: 'b', loc: [ 0.0002, -0.0002]}),
                iD.osmNode({id: 'c', loc: [-0.0002, -0.0002]}),
                iD.osmNode({id: 'd', loc: [-0.0002,  0.0002]}),
                iD.osmNode({id: 'e', loc: [ 0.0002,  0.0002]}),
                iD.osmWay({id: 'w', nodes: ['a','b','c','d','e','a']})
            ]);
            expect(graph.entity('w').isConvex(graph)).to.be.false;
        });

        it('returns null for non-closed ways', function() {
            //    d -- e
            //    |
            //    |  a
            //    |   \
            //    c -- b
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [ 0.0000,  0.0000]}),
                iD.osmNode({id: 'b', loc: [ 0.0002, -0.0002]}),
                iD.osmNode({id: 'c', loc: [-0.0002, -0.0002]}),
                iD.osmNode({id: 'd', loc: [-0.0002,  0.0002]}),
                iD.osmNode({id: 'e', loc: [ 0.0002,  0.0002]}),
                iD.osmWay({id: 'w', nodes: ['a','b','c','d','e']})
            ]);
            expect(graph.entity('w').isConvex(graph)).to.be.null;
        });

        it('returns null for degenerate ways', function() {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0.0000,  0.0000]}),
                iD.osmWay({id: 'w', nodes: ['a','a']})
            ]);
            expect(graph.entity('w').isConvex(graph)).to.be.null;
        });
    });

    describe('#layer', function() {
        it('returns 0 when the way has no tags', function() {
            expect(iD.osmWay().layer()).to.equal(0);
        });

        it('returns 0 when the way has a non numeric layer tag', function() {
            expect(iD.osmWay({tags: { layer: 'NaN' }}).layer()).to.equal(0);
            expect(iD.osmWay({tags: { layer: 'Infinity' }}).layer()).to.equal(0);
            expect(iD.osmWay({tags: { layer: 'Foo' }}).layer()).to.equal(0);
        });

        it('returns the layer when the way has an explicit layer tag', function() {
            expect(iD.osmWay({tags: { layer: '2' }}).layer()).to.equal(2);
            expect(iD.osmWay({tags: { layer: '-5' }}).layer()).to.equal(-5);
        });

        it('clamps the layer to within -10, 10', function() {
            expect(iD.osmWay({tags: { layer: '12' }}).layer()).to.equal(10);
            expect(iD.osmWay({tags: { layer: '-15' }}).layer()).to.equal(-10);
        });

        it('returns 1 for location=overground', function() {
            expect(iD.osmWay({tags: { location: 'overground' }}).layer()).to.equal(1);
        });

        it('returns -1 for covered=yes', function() {
            expect(iD.osmWay({tags: { covered: 'yes' }}).layer()).to.equal(-1);
        });

        it('returns -1 for location=underground', function() {
            expect(iD.osmWay({tags: { location: 'underground' }}).layer()).to.equal(-1);
        });

        it('returns -10 for location=underwater', function() {
            expect(iD.osmWay({tags: { location: 'underwater' }}).layer()).to.equal(-10);
        });

        it('returns 10 for power lines', function() {
            expect(iD.osmWay({tags: { power: 'line' }}).layer()).to.equal(10);
            expect(iD.osmWay({tags: { power: 'minor_line' }}).layer()).to.equal(10);
        });

        it('returns 10 for aerialways', function() {
            expect(iD.osmWay({tags: { aerialway: 'cable_car' }}).layer()).to.equal(10);
        });

        it('returns 1 for bridges', function() {
            expect(iD.osmWay({tags: { bridge: 'yes' }}).layer()).to.equal(1);
        });

        it('returns -1 for cuttings', function() {
            expect(iD.osmWay({tags: { cutting: 'yes' }}).layer()).to.equal(-1);
        });

        it('returns -1 for tunnels', function() {
            expect(iD.osmWay({tags: { tunnel: 'yes' }}).layer()).to.equal(-1);
        });

        it('returns -1 for waterways', function() {
            expect(iD.osmWay({tags: { waterway: 'stream' }}).layer()).to.equal(-1);
        });

        it('returns -10 for pipelines', function() {
            expect(iD.osmWay({tags: { man_made: 'pipeline' }}).layer()).to.equal(-10);
        });

        it('returns -10 for boundaries', function() {
            expect(iD.osmWay({tags: { boundary: 'administrative' }}).layer()).to.equal(-10);
        });

    });

    describe('#isOneWay', function() {
        it('returns false when the way has no tags', function() {
            expect(iD.osmWay().isOneWay()).to.be.false;
        });

        it('returns false when the way has tag oneway=no', function() {
            expect(iD.osmWay({tags: { oneway: 'no' }}).isOneWay(), 'oneway no').to.be.false;
            expect(iD.osmWay({tags: { oneway: '0' }}).isOneWay(), 'oneway 0').to.be.false;
        });

        it('returns true when the way has tag oneway=yes', function() {
            expect(iD.osmWay({tags: { oneway: 'yes' }}).isOneWay(), 'oneway yes').to.be.true;
            expect(iD.osmWay({tags: { oneway: '1' }}).isOneWay(), 'oneway 1').to.be.true;
            expect(iD.osmWay({tags: { oneway: '-1' }}).isOneWay(), 'oneway -1').to.be.true;
        });

        it('returns true when the way has tag oneway=reversible', function() {
            expect(iD.osmWay({tags: { oneway: 'reversible' }}).isOneWay(), 'oneway reversible').to.be.true;
        });

        it('returns true when the way has tag oneway=alternating', function() {
            expect(iD.osmWay({tags: { oneway: 'alternating' }}).isOneWay(), 'oneway alternating').to.be.true;
        });

        it('returns true when the way has implied oneway tag (waterway=river, waterway=stream, etc)', function() {
            expect(iD.osmWay({tags: { waterway: 'river' }}).isOneWay(), 'river').to.be.true;
            expect(iD.osmWay({tags: { waterway: 'stream' }}).isOneWay(), 'stream').to.be.true;
            expect(iD.osmWay({tags: { highway: 'motorway' }}).isOneWay(), 'motorway').to.be.true;
            expect(iD.osmWay({tags: { junction: 'roundabout' }}).isOneWay(), 'roundabout').to.be.true;
            expect(iD.osmWay({tags: { junction: 'circular' }}).isOneWay(), 'circular').to.be.true;
        });

        it('returns false when the way does not have implied oneway tag', function() {
            expect(iD.osmWay({tags: { highway: 'motorway_link' }}).isOneWay(), 'motorway_link').to.be.false;
            expect(iD.osmWay({tags: { highway: 'trunk' }}).isOneWay(), 'trunk').to.be.false;
            expect(iD.osmWay({tags: { highway: 'trunk_link' }}).isOneWay(), 'trunk_link').to.be.false;
            expect(iD.osmWay({tags: { highway: 'primary' }}).isOneWay(), 'primary').to.be.false;
            expect(iD.osmWay({tags: { highway: 'primary_link' }}).isOneWay(), 'primary_link').to.be.false;
            expect(iD.osmWay({tags: { highway: 'secondary' }}).isOneWay(), 'secondary').to.be.false;
            expect(iD.osmWay({tags: { highway: 'secondary_link' }}).isOneWay(), 'secondary_link').to.be.false;
            expect(iD.osmWay({tags: { highway: 'tertiary' }}).isOneWay(), 'tertiary').to.be.false;
            expect(iD.osmWay({tags: { highway: 'tertiary_link' }}).isOneWay(), 'tertiary_link').to.be.false;
            expect(iD.osmWay({tags: { highway: 'unclassified' }}).isOneWay(), 'unclassified').to.be.false;
            expect(iD.osmWay({tags: { highway: 'residential' }}).isOneWay(), 'residential').to.be.false;
            expect(iD.osmWay({tags: { highway: 'living_street' }}).isOneWay(), 'living_street').to.be.false;
            expect(iD.osmWay({tags: { highway: 'service' }}).isOneWay(), 'service').to.be.false;
            expect(iD.osmWay({tags: { highway: 'track' }}).isOneWay(), 'track').to.be.false;
            expect(iD.osmWay({tags: { highway: 'path' }}).isOneWay(), 'path').to.be.false;
        });

        it('returns false when oneway=no overrides implied oneway tag', function() {
            expect(iD.osmWay({tags: { junction: 'roundabout', oneway: 'no' }}).isOneWay(), 'roundabout').to.be.false;
            expect(iD.osmWay({tags: { junction: 'circular', oneway: 'no' }}).isOneWay(), 'circular').to.be.false;
            expect(iD.osmWay({tags: { highway: 'motorway', oneway: 'no' }}).isOneWay(), 'motorway').to.be.false;
        });
    });

    describe('#sidednessIdentifier', function() {
        it('returns tag when the tag has implied sidedness', function() {
            expect(iD.osmWay({tags: { natural: 'cliff' }}).sidednessIdentifier()).to.eql('natural');
            expect(iD.osmWay({tags: { natural: 'coastline' }}).sidednessIdentifier()).to.eql('coastline');
            expect(iD.osmWay({tags: { barrier: 'retaining_wall' }}).sidednessIdentifier()).to.eql('barrier');
            expect(iD.osmWay({tags: { barrier: 'kerb' }}).sidednessIdentifier()).to.eql('barrier');
            expect(iD.osmWay({tags: { barrier: 'guard_rail' }}).sidednessIdentifier()).to.eql('barrier');
            expect(iD.osmWay({tags: { barrier: 'city_wall' }}).sidednessIdentifier()).to.eql('barrier');
            expect(iD.osmWay({tags: { man_made: 'embankment' }}).sidednessIdentifier()).to.eql('man_made');
        });

        it('returns null when tag does not have implied sidedness', function() {
            expect(iD.osmWay({tags: { natural: 'ridge' }}).sidednessIdentifier()).to.be.null;
            expect(iD.osmWay({tags: { barrier: 'fence' }}).sidednessIdentifier()).to.be.null;
            expect(iD.osmWay({tags: { man_made: 'dyke' }}).sidednessIdentifier()).to.be.null;
            expect(iD.osmWay({tags: { highway: 'motorway' }}).sidednessIdentifier()).to.be.null;
        });
    });

    describe('#isSided', function() {
        it('returns false when the way has no tags', function() {
            expect(iD.osmWay().isSided()).to.be.false;
        });

        it('returns false when the way has two_sided=yes', function() {
            expect(iD.osmWay({tags: { two_sided: 'yes' }}).isSided()).to.be.false;
        });

        it('returns true when the tag has implied sidedness', function() {
            expect(iD.osmWay({tags: { natural: 'cliff' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { natural: 'coastline' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { barrier: 'retaining_wall' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { barrier: 'kerb' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { barrier: 'guard_rail' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { barrier: 'city_wall' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { man_made: 'embankment' }}).isSided()).to.be.true;
        });

        it('returns false when two_sided=yes overrides tag with implied sidedness', function() {
            expect(iD.osmWay({tags: { natural: 'cliff', two_sided: 'yes' }}).isSided()).to.be.false;
            expect(iD.osmWay({tags: { natural: 'coastline', two_sided: 'yes' }}).isSided()).to.be.false;
            expect(iD.osmWay({tags: { barrier: 'retaining_wall', two_sided: 'yes' }}).isSided()).to.be.false;
            expect(iD.osmWay({tags: { barrier: 'kerb', two_sided: 'yes' }}).isSided()).to.be.false;
            expect(iD.osmWay({tags: { barrier: 'guard_rail', two_sided: 'yes' }}).isSided()).to.be.false;
            expect(iD.osmWay({tags: { barrier: 'city_wall', two_sided: 'yes' }}).isSided()).to.be.false;
            expect(iD.osmWay({tags: { man_made: 'embankment', two_sided: 'yes' }}).isSided()).to.be.false;
        });

        it('returns true when two_sided=no is on tag with implied sidedness', function() {
            expect(iD.osmWay({tags: { natural: 'cliff', two_sided: 'no' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { natural: 'coastline', two_sided: 'no' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { barrier: 'retaining_wall', two_sided: 'no' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { barrier: 'kerb', two_sided: 'no' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { barrier: 'guard_rail', two_sided: 'no' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { barrier: 'city_wall', two_sided: 'no' }}).isSided()).to.be.true;
            expect(iD.osmWay({tags: { man_made: 'embankment', two_sided: 'no' }}).isSided()).to.be.true;
        });

        it('returns false when the tag does not have implied sidedness', function() {
            expect(iD.osmWay({tags: { natural: 'ridge' }}).isSided()).to.be.false;
            expect(iD.osmWay({tags: { barrier: 'fence' }}).isSided()).to.be.false;
            expect(iD.osmWay({tags: { man_made: 'dyke' }}).isSided()).to.be.false;
            expect(iD.osmWay({tags: { highway: 'motorway' }}).isSided()).to.be.false;
        });
    });

    describe('#isArea', function() {
        it('returns false when the way has no tags', function() {
            expect(iD.osmWay().isArea()).to.equal(false);
        });

        it('returns true if the way has tag area=yes', function() {
            expect(iD.osmWay({tags: { area: 'yes' }}).isArea()).to.equal(true);
        });

        it('returns false if the way is closed and has no tags', function() {
            expect(iD.osmWay({nodes: ['n1', 'n1']}).isArea()).to.equal(false);
        });

        it('returns true if the way is closed and has a key in iD.osmAreaKeys', function() {
            expect(iD.osmWay({nodes: ['n1', 'n1'], tags: {building: 'yes'}}).isArea()).to.equal(true);
        });

        it('returns true for some highway and railway exceptions', function() {
            expect(iD.osmWay({nodes: ['n1', 'n1'], tags: { highway: 'services' }}).isArea(), 'highway=services').to.equal(true);
            expect(iD.osmWay({nodes: ['n1', 'n1'], tags: { highway: 'rest_area' }}).isArea(), 'highway=rest_area').to.equal(true);
            expect(iD.osmWay({nodes: ['n1', 'n1'], tags: { railway: 'roundhouse' }}).isArea(), 'railway=roundhouse').to.equal(true);
            expect(iD.osmWay({nodes: ['n1', 'n1'], tags: { railway: 'station' }}).isArea(), 'railway=station').to.equal(true);
            expect(iD.osmWay({nodes: ['n1', 'n1'], tags: { railway: 'traverser' }}).isArea(), 'railway=traverser').to.equal(true);
            expect(iD.osmWay({nodes: ['n1', 'n1'], tags: { railway: 'turntable' }}).isArea(), 'railway=turntable').to.equal(true);
            expect(iD.osmWay({nodes: ['n1', 'n1'], tags: { railway: 'wash' }}).isArea(), 'railway=wash').to.equal(true);
        });

        it('returns false if the way is closed and has no keys in iD.osmAreaKeys', function() {
            expect(iD.osmWay({nodes: ['n1', 'n1'], tags: {a: 'b'}}).isArea()).to.equal(false);
        });

        it('returns false if the way is closed and has tag area=no', function() {
            expect(iD.osmWay({nodes: ['n1', 'n1'], tags: {area: 'no', building: 'yes'}}).isArea()).to.equal(false);
        });

        it('returns false for coastline', function() {
            expect(iD.osmWay({nodes: ['n1', 'n1'], tags: {natural: 'coastline'}}).isArea()).to.equal(false);
        });
    });

    describe('#isDegenerate', function() {
       it('returns true for a linear way with zero or one nodes', function () {
           expect(iD.osmWay({nodes: []}).isDegenerate()).to.equal(true);
           expect(iD.osmWay({nodes: ['a']}).isDegenerate()).to.equal(true);
       });

        it('returns true for a circular way with only one unique node', function () {
            expect(iD.osmWay({nodes: ['a', 'a']}).isDegenerate()).to.equal(true);
        });

        it('returns false for a linear way with two or more nodes', function () {
            expect(iD.osmWay({nodes: ['a', 'b']}).isDegenerate()).to.equal(false);
        });

        it('returns true for an area with zero, one, or two unique nodes', function () {
            expect(iD.osmWay({tags: {area: 'yes'}, nodes: []}).isDegenerate()).to.equal(true);
            expect(iD.osmWay({tags: {area: 'yes'}, nodes: ['a', 'a']}).isDegenerate()).to.equal(true);
            expect(iD.osmWay({tags: {area: 'yes'}, nodes: ['a', 'b', 'a']}).isDegenerate()).to.equal(true);
        });

        it('returns false for an area with three or more unique nodes', function () {
            expect(iD.osmWay({tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'a']}).isDegenerate()).to.equal(false);
        });
    });

    describe('#areAdjacent', function() {
        it('returns false for nodes not in the way', function() {
            expect(iD.osmWay().areAdjacent('a', 'b')).to.equal(false);
        });

        it('returns false for non-adjacent nodes in the way', function() {
            expect(iD.osmWay({nodes: ['a', 'b', 'c']}).areAdjacent('a', 'c')).to.equal(false);
        });

        it('returns true for adjacent nodes in the way (forward)', function() {
            var way = iD.osmWay({nodes: ['a', 'b', 'c', 'd']});
            expect(way.areAdjacent('a', 'b')).to.equal(true);
            expect(way.areAdjacent('b', 'c')).to.equal(true);
            expect(way.areAdjacent('c', 'd')).to.equal(true);
        });

        it('returns true for adjacent nodes in the way (reverse)', function() {
            var way = iD.osmWay({nodes: ['a', 'b', 'c', 'd']});
            expect(way.areAdjacent('b', 'a')).to.equal(true);
            expect(way.areAdjacent('c', 'b')).to.equal(true);
            expect(way.areAdjacent('d', 'c')).to.equal(true);
        });
    });

    describe('#geometry', function() {
        it('returns \'line\' when the way is not an area', function () {
            expect(iD.osmWay().geometry(iD.coreGraph())).to.equal('line');
        });

        it('returns \'area\' when the way is an area', function () {
            expect(iD.osmWay({tags: { area: 'yes' }}).geometry(iD.coreGraph())).to.equal('area');
        });
    });

    describe('#close', function () {
        it('returns self for empty way', function () {
            var w = iD.osmWay();
            expect(w.close()).to.deep.equal(w);
        });

        it('returns self for already closed way', function () {
            var w1 = iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.close()).to.deep.equal(w1);
            var w2 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.close()).to.deep.equal(w2);
        });

        it('closes a way', function () {
            var w1 = iD.osmWay({ nodes: 'ab'.split('') });
            expect(w1.close().nodes.join('')).to.eql('aba', 'multiple');
            var w2 = iD.osmWay({ nodes: 'a'.split('') });
            expect(w2.close().nodes.join('')).to.eql('aa', 'single');
        });

        it('eliminates duplicate consecutive nodes when closing a linear way', function () {
            var w1 = iD.osmWay({ nodes: 'abb'.split('') });
            expect(w1.close().nodes.join('')).to.eql('aba', 'duplicate at end');
            var w2 = iD.osmWay({ nodes: 'abbc'.split('') });
            expect(w2.close().nodes.join('')).to.eql('abca', 'duplicate in middle');
            var w3 = iD.osmWay({ nodes: 'aabc'.split('') });
            expect(w3.close().nodes.join('')).to.eql('abca', 'duplicate at beginning');
            var w4 = iD.osmWay({ nodes: 'abbbcbb'.split('') });
            expect(w4.close().nodes.join('')).to.eql('abcba', 'duplicates multiple places');
        });
    });

    describe('#unclose', function () {
        it('returns self for empty way', function () {
            var w = iD.osmWay();
            expect(w.unclose()).to.deep.equal(w);
        });

        it('returns self for already unclosed way', function () {
            var w1 = iD.osmWay({ nodes: 'a'.split('') });
            expect(w1.unclose()).to.deep.equal(w1);
            var w2 = iD.osmWay({ nodes: 'ab'.split('') });
            expect(w2.unclose()).to.deep.equal(w2);
        });

        it('uncloses a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.unclose().nodes.join('')).to.eql('ab', 'multiple');
            var w2 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.unclose().nodes.join('')).to.eql('a', 'single');
        });

        it('eliminates duplicate consecutive nodes when unclosing a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.unclose().nodes.join('')).to.eql('abc', 'duplicate internal node at end');
            var w2 = iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.unclose().nodes.join('')).to.eql('abc', 'duplicate internal node in middle');
            var w3 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.unclose().nodes.join('')).to.eql('abc', 'duplicate connector node at beginning');
            var w4 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.unclose().nodes.join('')).to.eql('abc', 'duplicate connector node at end');
            var w5 = iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.unclose().nodes.join('')).to.eql('abcb', 'duplicates multiple places');
            var w6 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.unclose().nodes.join('')).to.eql('a', 'single node circular');
            var w7 = iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.unclose().nodes.join('')).to.eql('a', 'single node circular with duplicates');
        });
    });

    describe('#addNode', function () {
        it('adds a node to an empty way', function () {
            var w = iD.osmWay();
            expect(w.addNode('a').nodes).to.eql(['a']);
        });

        it('adds a node to the end of a linear way when index is undefined', function () {
            var w = iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.addNode('c').nodes.join('')).to.eql('abc');
        });

        it('adds a node before the end connector of a circular way when index is undefined', function () {
            var w1 = iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.addNode('c').nodes.join('')).to.eql('abca', 'circular');
            var w2 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.addNode('c').nodes.join('')).to.eql('aca', 'single node circular');
        });

        it('adds an internal node to a linear way at a positive index', function () {
            var w = iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.addNode('c', 1).nodes.join('')).to.eql('acb');
        });

        it('adds an internal node to a circular way at a positive index', function () {
            var w1 = iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.addNode('c', 1).nodes.join('')).to.eql('acba', 'circular');
            var w2 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.addNode('c', 1).nodes.join('')).to.eql('aca', 'single node circular');
        });

        it('adds a leading node to a linear way at index 0', function () {
            var w = iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.addNode('c', 0).nodes.join('')).to.eql('cab');
        });

        it('adds a leading node to a circular way at index 0, preserving circularity', function () {
            var w1 = iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.addNode('c', 0).nodes.join('')).to.eql('cabc', 'circular');
            var w2 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.addNode('c', 0).nodes.join('')).to.eql('cac', 'single node circular');
        });

        it('throws RangeError if index outside of array range for linear way', function () {
            var w = iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.addNode.bind(w, 'c', 3)).to.throw(RangeError, /out of range 0\.\.2/, 'over range');
            expect(w.addNode.bind(w, 'c', -1)).to.throw(RangeError, /out of range 0\.\.2/, 'under range');
        });

        it('throws RangeError if index outside of array range for circular way', function () {
            var w = iD.osmWay({ nodes: 'aba'.split('') });
            expect(w.addNode.bind(w, 'c', 3)).to.throw(RangeError, /out of range 0\.\.2/, 'over range');
            expect(w.addNode.bind(w, 'c', -1)).to.throw(RangeError, /out of range 0\.\.2/, 'under range');
        });

        it('eliminates duplicate consecutive nodes when adding to the end of a linear way', function () {
            var w1 = iD.osmWay({ nodes: 'abb'.split('') });
            expect(w1.addNode('b').nodes.join('')).to.eql('ab', 'duplicate at end');
            var w2 = iD.osmWay({ nodes: 'abbc'.split('') });
            expect(w2.addNode('c').nodes.join('')).to.eql('abc', 'duplicate in middle');
            var w3 = iD.osmWay({ nodes: 'aabc'.split('') });
            expect(w3.addNode('c').nodes.join('')).to.eql('abc', 'duplicate at beginning');
            var w4 = iD.osmWay({ nodes: 'abbbcbb'.split('') });
            expect(w4.addNode('b').nodes.join('')).to.eql('abcb', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when adding same node before the end connector of a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.addNode('c').nodes.join('')).to.eql('abca', 'duplicate internal node at end');
            var w2 = iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.addNode('c').nodes.join('')).to.eql('abca', 'duplicate internal node in middle');
            var w3 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.addNode('c').nodes.join('')).to.eql('abca', 'duplicate connector node at beginning');
            var w4 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.addNode('a').nodes.join('')).to.eql('abca', 'duplicate connector node at end');
            var w5 = iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.addNode('b').nodes.join('')).to.eql('abcba', 'duplicates multiple places');
            var w6 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.addNode('a').nodes.join('')).to.eql('aa', 'single node circular');
            var w7 = iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.addNode('a').nodes.join('')).to.eql('aa', 'single node circular with duplicates');
        });

        it('eliminates duplicate consecutive nodes when adding different node before the end connector of a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.addNode('d').nodes.join('')).to.eql('abcda', 'duplicate internal node at end');
            var w2 = iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.addNode('d').nodes.join('')).to.eql('abcda', 'duplicate internal node in middle');
            var w3 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.addNode('d').nodes.join('')).to.eql('abcda', 'duplicate connector node at beginning');
            var w4 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.addNode('d').nodes.join('')).to.eql('abcda', 'duplicate connector node at end');
            var w5 = iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.addNode('d').nodes.join('')).to.eql('abcbda', 'duplicates multiple places');
            var w6 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.addNode('d').nodes.join('')).to.eql('ada', 'single node circular');
            var w7 = iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.addNode('d').nodes.join('')).to.eql('ada', 'single node circular with duplicates');
        });

        it('eliminates duplicate consecutive nodes when adding to the beginning of a linear way', function () {
            var w1 = iD.osmWay({ nodes: 'abb'.split('') });
            expect(w1.addNode('a', 0).nodes.join('')).to.eql('ab', 'duplicate at end');
            var w2 = iD.osmWay({ nodes: 'abbc'.split('') });
            expect(w2.addNode('a', 0).nodes.join('')).to.eql('abc', 'duplicate in middle');
            var w3 = iD.osmWay({ nodes: 'aabc'.split('') });
            expect(w3.addNode('a', 0).nodes.join('')).to.eql('abc', 'duplicate at beginning');
            var w4 = iD.osmWay({ nodes: 'abbbcbb'.split('') });
            expect(w4.addNode('a', 0).nodes.join('')).to.eql('abcb', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when adding same node as beginning connector a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.addNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate internal node at end');
            var w2 = iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.addNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate internal node in middle');
            var w3 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.addNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate connector node at beginning');
            var w4 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.addNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate connector node at end');
            var w5 = iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.addNode('a', 0).nodes.join('')).to.eql('abcba', 'duplicates multiple places');
            var w6 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.addNode('a', 0).nodes.join('')).to.eql('aa', 'single node circular');
            var w7 = iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.addNode('a', 0).nodes.join('')).to.eql('aa', 'single node circular with duplicates');
        });

        it('eliminates duplicate consecutive nodes when adding different node as beginning connector of a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.addNode('d', 0).nodes.join('')).to.eql('dabcd', 'duplicate internal node at end');
            var w2 = iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.addNode('d', 0).nodes.join('')).to.eql('dabcd', 'duplicate internal node in middle');
            var w3 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.addNode('d', 0).nodes.join('')).to.eql('dabcd', 'duplicate connector node at beginning');
            var w4 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.addNode('d', 0).nodes.join('')).to.eql('dabcd', 'duplicate connector node at end');
            var w5 = iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.addNode('d', 0).nodes.join('')).to.eql('dabcbd', 'duplicates multiple places');
            var w6 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.addNode('d', 0).nodes.join('')).to.eql('dad', 'single node circular');
            var w7 = iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.addNode('d', 0).nodes.join('')).to.eql('dad', 'single node circular with duplicates');
        });
    });

    describe('#updateNode', function () {
        it('throws RangeError if empty way', function () {
            var w = iD.osmWay();
            expect(w.updateNode.bind(w, 'd', 0)).to.throw(RangeError, /out of range 0\.\.-1/);
        });

        it('updates an internal node on a linear way at a positive index', function () {
            var w = iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.updateNode('d', 1).nodes.join('')).to.eql('ad');
        });

        it('updates an internal node on a circular way at a positive index', function () {
            var w = iD.osmWay({ nodes: 'aba'.split('') });
            expect(w.updateNode('d', 1).nodes.join('')).to.eql('ada', 'circular');
        });

        it('updates a leading node on a linear way at index 0', function () {
            var w = iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.updateNode('d', 0).nodes.join('')).to.eql('db');
        });

        it('updates a leading node on a circular way at index 0, preserving circularity', function () {
            var w1 = iD.osmWay({ nodes: 'aba'.split('') });
            expect(w1.updateNode('d', 0).nodes.join('')).to.eql('dbd', 'circular');
            var w2 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w2.updateNode('d', 0).nodes.join('')).to.eql('dd', 'single node circular');
        });

        it('throws RangeError if index outside of array range for linear way', function () {
            var w = iD.osmWay({ nodes: 'ab'.split('') });
            expect(w.updateNode.bind(w, 'd', 2)).to.throw(RangeError, /out of range 0\.\.1/, 'over range');
            expect(w.updateNode.bind(w, 'd', -1)).to.throw(RangeError, /out of range 0\.\.1/, 'under range');
        });

        it('throws RangeError if index outside of array range for circular way', function () {
            var w = iD.osmWay({ nodes: 'aba'.split('') });
            expect(w.updateNode.bind(w, 'd', 3)).to.throw(RangeError, /out of range 0\.\.2/, 'over range');
            expect(w.updateNode.bind(w, 'd', -1)).to.throw(RangeError, /out of range 0\.\.2/, 'under range');
        });

        it('eliminates duplicate consecutive nodes when updating the end of a linear way', function () {
            var w1 = iD.osmWay({ nodes: 'abcc'.split('') });
            expect(w1.updateNode('c', 3).nodes.join('')).to.eql('abc', 'duplicate at end');
            var w2 = iD.osmWay({ nodes: 'abbc'.split('') });
            expect(w2.updateNode('c', 3).nodes.join('')).to.eql('abc', 'duplicate in middle');
            var w3 = iD.osmWay({ nodes: 'aabc'.split('') });
            expect(w3.updateNode('c', 3).nodes.join('')).to.eql('abc', 'duplicate at beginning');
            var w4 = iD.osmWay({ nodes: 'abbbcbb'.split('') });
            expect(w4.updateNode('b', 6).nodes.join('')).to.eql('abcb', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when updating same node before the end connector of a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.updateNode('c', 3).nodes.join('')).to.eql('abca', 'duplicate internal node at end');
            var w2 = iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.updateNode('c', 3).nodes.join('')).to.eql('abca', 'duplicate internal node in middle');
            var w3 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.updateNode('c', 3).nodes.join('')).to.eql('abca', 'duplicate connector node at beginning');
            var w4 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.updateNode('a', 3).nodes.join('')).to.eql('abca', 'duplicate connector node at end');
            var w5 = iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.updateNode('b', 6).nodes.join('')).to.eql('abcba', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when updating different node before the end connector of a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.updateNode('d', 3).nodes.join('')).to.eql('abcda', 'duplicate internal node at end');
            var w2 = iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.updateNode('d', 3).nodes.join('')).to.eql('abda', 'duplicate internal node in middle');
            var w3 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.updateNode('d', 3).nodes.join('')).to.eql('abda', 'duplicate connector node at beginning');
            var w4 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.updateNode('d', 3).nodes.join('')).to.eql('dbcd', 'duplicate connector node at end');
            var w5 = iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.updateNode('d', 6).nodes.join('')).to.eql('abcbda', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when updating the beginning of a linear way', function () {
            var w1 = iD.osmWay({ nodes: 'abb'.split('') });
            expect(w1.updateNode('b', 0).nodes.join('')).to.eql('b', 'duplicate at end');
            var w2 = iD.osmWay({ nodes: 'abbc'.split('') });
            expect(w2.updateNode('b', 0).nodes.join('')).to.eql('bc', 'duplicate in middle');
            var w3 = iD.osmWay({ nodes: 'aabc'.split('') });
            expect(w3.updateNode('a', 0).nodes.join('')).to.eql('abc', 'duplicate at beginning');
            var w4 = iD.osmWay({ nodes: 'abbbcbb'.split('') });
            expect(w4.updateNode('a', 0).nodes.join('')).to.eql('abcb', 'duplicates multiple places');
        });

        it('eliminates duplicate consecutive nodes when updating same node as beginning connector a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.updateNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate internal node at end');
            var w2 = iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.updateNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate internal node in middle');
            var w3 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.updateNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate connector node at beginning');
            var w4 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.updateNode('a', 0).nodes.join('')).to.eql('abca', 'duplicate connector node at end');
            var w5 = iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.updateNode('a', 0).nodes.join('')).to.eql('abcba', 'duplicates multiple places');
            var w6 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.updateNode('a', 0).nodes.join('')).to.eql('aa', 'single node circular');
            var w7 = iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.updateNode('a', 0).nodes.join('')).to.eql('aa', 'single node circular with duplicates');
        });

        it('eliminates duplicate consecutive nodes when updating different node as beginning connector of a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.updateNode('d', 0).nodes.join('')).to.eql('dbcd', 'duplicate internal node at end');
            var w2 = iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.updateNode('d', 0).nodes.join('')).to.eql('dbcd', 'duplicate internal node in middle');
            var w3 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.updateNode('d', 0).nodes.join('')).to.eql('dbcd', 'duplicate connector node at beginning');
            var w4 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.updateNode('d', 0).nodes.join('')).to.eql('dbcd', 'duplicate connector node at end');
            var w5 = iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.updateNode('d', 0).nodes.join('')).to.eql('dbcbd', 'duplicates multiple places');
            var w6 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.updateNode('d', 0).nodes.join('')).to.eql('dd', 'single node circular');
            var w7 = iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.updateNode('d', 0).nodes.join('')).to.eql('dd', 'single node circular with duplicates');
        });

        it('eliminates duplicate consecutive nodes when updating different node as ending connector of a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcca'.split('') });
            expect(w1.updateNode('d', 4).nodes.join('')).to.eql('dbcd', 'duplicate internal node at end');
            var w2 = iD.osmWay({ nodes: 'abbca'.split('') });
            expect(w2.updateNode('d', 4).nodes.join('')).to.eql('dbcd', 'duplicate internal node in middle');
            var w3 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w3.updateNode('d', 4).nodes.join('')).to.eql('dbcd', 'duplicate connector node at beginning');
            var w4 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w4.updateNode('d', 4).nodes.join('')).to.eql('dbcd', 'duplicate connector node at end');
            var w5 = iD.osmWay({ nodes: 'abbbcbba'.split('') });
            expect(w5.updateNode('d', 7).nodes.join('')).to.eql('dbcbd', 'duplicates multiple places');
            var w6 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w6.updateNode('d', 1).nodes.join('')).to.eql('dd', 'single node circular');
            var w7 = iD.osmWay({ nodes: 'aaa'.split('') });
            expect(w7.updateNode('d', 2).nodes.join('')).to.eql('dd', 'single node circular with duplicates');
        });
    });

    describe('#replaceNode', function () {
        it('replaces a node', function () {
            var w1 = iD.osmWay({ nodes: 'a'.split('') });
            expect(w1.replaceNode('a','b').nodes.join('')).to.eql('b', 'single replace, single node');
            var w2 = iD.osmWay({ nodes: 'abc'.split('') });
            expect(w2.replaceNode('b','d').nodes.join('')).to.eql('adc', 'single replace, linear');
            var w4 = iD.osmWay({ nodes: 'abca'.split('') });
            expect(w4.replaceNode('b','d').nodes.join('')).to.eql('adca', 'single replace, circular');
        });

        it('replaces multiply occurring nodes', function () {
            var w1 = iD.osmWay({ nodes: 'abcb'.split('') });
            expect(w1.replaceNode('b','d').nodes.join('')).to.eql('adcd', 'multiple replace, linear');
            var w2 = iD.osmWay({ nodes: 'abca'.split('') });
            expect(w2.replaceNode('a','d').nodes.join('')).to.eql('dbcd', 'multiple replace, circular');
            var w3 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w3.replaceNode('a','d').nodes.join('')).to.eql('dd', 'multiple replace, single node circular');
        });

        it('eliminates duplicate consecutive nodes when replacing along a linear way', function () {
            var w1 = iD.osmWay({ nodes: 'abbcd'.split('') });
            expect(w1.replaceNode('c','b').nodes.join('')).to.eql('abd', 'duplicate before');
            var w2 = iD.osmWay({ nodes: 'abcdd'.split('') });
            expect(w2.replaceNode('c','d').nodes.join('')).to.eql('abd', 'duplicate after');
            var w3 = iD.osmWay({ nodes: 'abbcbb'.split('')});
            expect(w3.replaceNode('c','b').nodes.join('')).to.eql('ab', 'duplicate before and after');
        });

        it('eliminates duplicate consecutive nodes when replacing internal nodes along a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abbcda'.split('') });
            expect(w1.replaceNode('c','b').nodes.join('')).to.eql('abda', 'duplicate before');
            var w2 = iD.osmWay({ nodes: 'abcdda'.split('') });
            expect(w2.replaceNode('c','d').nodes.join('')).to.eql('abda', 'duplicate after');
            var w3 = iD.osmWay({ nodes: 'abbcbba'.split('')});
            expect(w3.replaceNode('c','b').nodes.join('')).to.eql('aba', 'duplicate before and after');
        });

        it('eliminates duplicate consecutive nodes when replacing adjacent to connecting nodes along a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcda'.split('') });
            expect(w1.replaceNode('d','a').nodes.join('')).to.eql('abca', 'before single end connector');
            var w2 = iD.osmWay({ nodes: 'abcda'.split('') });
            expect(w2.replaceNode('b','a').nodes.join('')).to.eql('acda', 'after single beginning connector');
            var w3 = iD.osmWay({ nodes: 'abcdaa'.split('') });
            expect(w3.replaceNode('d','a').nodes.join('')).to.eql('abca', 'before duplicate end connector');
            var w4 = iD.osmWay({ nodes: 'aabcda'.split('') });
            expect(w4.replaceNode('b','a').nodes.join('')).to.eql('acda', 'after duplicate beginning connector');
        });

        it('eliminates duplicate consecutive nodes when replacing connecting nodes along a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w1.replaceNode('a','d').nodes.join('')).to.eql('dbcd', 'duplicate end connector');
            var w2 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w2.replaceNode('a','d').nodes.join('')).to.eql('dbcd', 'duplicate beginning connector');
            var w3 = iD.osmWay({ nodes: 'aabcaa'.split('') });
            expect(w3.replaceNode('a','d').nodes.join('')).to.eql('dbcd', 'duplicate beginning and end connectors');
            var w4 = iD.osmWay({ nodes: 'aabaacaa'.split('') });
            expect(w4.replaceNode('a','d').nodes.join('')).to.eql('dbdcd', 'duplicates multiple places');
        });
    });

    describe('#removeNode', function () {
        it('removes a node', function () {
            var w1 = iD.osmWay({ nodes: 'a'.split('') });
            expect(w1.removeNode('a').nodes.join('')).to.eql('', 'single remove, single node');
            var w2 = iD.osmWay({ nodes: 'abc'.split('') });
            expect(w2.removeNode('b').nodes.join('')).to.eql('ac', 'single remove, linear');
            var w3 = iD.osmWay({ nodes: 'abca'.split('') });
            expect(w3.removeNode('b').nodes.join('')).to.eql('aca', 'single remove, circular');
            var w4 = iD.osmWay({ nodes: 'aa'.split('') });
            expect(w4.removeNode('a').nodes.join('')).to.eql('', 'multiple remove, single node circular');
        });

        it('removes multiply occurring nodes', function () {
            var w1 = iD.osmWay({ nodes: 'abcb'.split('') });
            expect(w1.removeNode('b').nodes.join('')).to.eql('ac', 'multiple remove, linear');
            var w2 = iD.osmWay({ nodes: 'abcba'.split('') });
            expect(w2.removeNode('b').nodes.join('')).to.eql('aca', 'multiple remove, circular');
        });

        it('eliminates duplicate consecutive nodes when removing along a linear way', function () {
            var w1 = iD.osmWay({ nodes: 'abbcd'.split('') });
            expect(w1.removeNode('c').nodes.join('')).to.eql('abd', 'duplicate before');
            var w2 = iD.osmWay({ nodes: 'abcdd'.split('') });
            expect(w2.removeNode('c').nodes.join('')).to.eql('abd', 'duplicate after');
            var w3 = iD.osmWay({ nodes: 'abbcbb'.split('')});
            expect(w3.removeNode('c').nodes.join('')).to.eql('ab', 'duplicate before and after');
        });

        it('eliminates duplicate consecutive nodes when removing internal nodes along a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abbcda'.split('') });
            expect(w1.removeNode('c').nodes.join('')).to.eql('abda', 'duplicate before');
            var w2 = iD.osmWay({ nodes: 'abcdda'.split('') });
            expect(w2.removeNode('c').nodes.join('')).to.eql('abda', 'duplicate after');
            var w3 = iD.osmWay({ nodes: 'abbcbba'.split('')});
            expect(w3.removeNode('c').nodes.join('')).to.eql('aba', 'duplicate before and after');
        });

        it('eliminates duplicate consecutive nodes when removing adjacent to connecting nodes along a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcdaa'.split('') });
            expect(w1.removeNode('d').nodes.join('')).to.eql('abca', 'duplicate end connector');
            var w2 = iD.osmWay({ nodes: 'aabcda'.split('') });
            expect(w2.removeNode('b').nodes.join('')).to.eql('acda', 'duplicate beginning connector');
        });

        it('eliminates duplicate consecutive nodes when removing connecting nodes along a circular way', function () {
            var w1 = iD.osmWay({ nodes: 'abcaa'.split('') });
            expect(w1.removeNode('a').nodes.join('')).to.eql('bcb', 'duplicate end connector');
            var w2 = iD.osmWay({ nodes: 'aabca'.split('') });
            expect(w2.removeNode('a').nodes.join('')).to.eql('bcb', 'duplicate beginning connector');
            var w3 = iD.osmWay({ nodes: 'aabcaa'.split('') });
            expect(w3.removeNode('a').nodes.join('')).to.eql('bcb', 'duplicate beginning and end connectors');
            var w4 = iD.osmWay({ nodes: 'aabaacaa'.split('') });
            expect(w4.removeNode('a').nodes.join('')).to.eql('bcb', 'duplicates multiple places');
        });
    });

    describe('#asJXON', function () {
        it('converts a way to jxon', function() {
            var node = iD.osmWay({id: 'w-1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}});
            expect(node.asJXON()).to.eql({way: {
                '@id': '-1',
                '@version': 0,
                nd: [{keyAttributes: {ref: '1'}}, {keyAttributes: {ref: '2'}}],
                tag: [{keyAttributes: {k: 'highway', v: 'residential'}}]}});
        });

        it('includes changeset if provided', function() {
            expect(iD.osmWay().asJXON('1234').way['@changeset']).to.equal('1234');
        });
    });

    describe('#asGeoJSON', function () {
        it('converts a line to a GeoJSON LineString geometry', function () {
            var a = iD.osmNode({loc: [1, 2]}),
                b = iD.osmNode({loc: [3, 4]}),
                w = iD.osmWay({tags: {highway: 'residential'}, nodes: [a.id, b.id]}),
                graph = iD.coreGraph([a, b, w]),
                json = w.asGeoJSON(graph);

            expect(json.type).to.equal('LineString');
            expect(json.coordinates).to.eql([a.loc, b.loc]);
        });

        it('converts an area to a GeoJSON Polygon geometry', function () {
            var a = iD.osmNode({loc: [1, 2]}),
                b = iD.osmNode({loc: [5, 6]}),
                c = iD.osmNode({loc: [3, 4]}),
                w = iD.osmWay({tags: {area: 'yes'}, nodes: [a.id, b.id, c.id, a.id]}),
                graph = iD.coreGraph([a, b, c, w]),
                json = w.asGeoJSON(graph, true);

            expect(json.type).to.equal('Polygon');
            expect(json.coordinates).to.eql([[a.loc, b.loc, c.loc, a.loc]]);
        });

        it('converts an unclosed area to a GeoJSON LineString geometry', function () {
            var a = iD.osmNode({loc: [1, 2]}),
                b = iD.osmNode({loc: [5, 6]}),
                c = iD.osmNode({loc: [3, 4]}),
                w = iD.osmWay({tags: {area: 'yes'}, nodes: [a.id, b.id, c.id]}),
                graph = iD.coreGraph([a, b, c, w]),
                json = w.asGeoJSON(graph, true);

            expect(json.type).to.equal('LineString');
            expect(json.coordinates).to.eql([a.loc, b.loc, c.loc]);
        });
    });

    describe('#area', function() {
        it('returns a relative measure of area', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [-0.0002,  0.0001]}),
                iD.osmNode({id: 'b', loc: [ 0.0002,  0.0001]}),
                iD.osmNode({id: 'c', loc: [ 0.0002, -0.0001]}),
                iD.osmNode({id: 'd', loc: [-0.0002, -0.0001]}),
                iD.osmNode({id: 'e', loc: [-0.0004,  0.0002]}),
                iD.osmNode({id: 'f', loc: [ 0.0004,  0.0002]}),
                iD.osmNode({id: 'g', loc: [ 0.0004, -0.0002]}),
                iD.osmNode({id: 'h', loc: [-0.0004, -0.0002]}),
                iD.osmWay({id: 's', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']}),
                iD.osmWay({id: 'l', tags: {area: 'yes'}, nodes: ['e', 'f', 'g', 'h', 'e']})
            ]);

            var s = Math.abs(graph.entity('s').area(graph)),
                l = Math.abs(graph.entity('l').area(graph));

            expect(s).to.be.lt(l);
        });

        it('treats unclosed areas as if they were closed', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [-0.0002,  0.0001]}),
                iD.osmNode({id: 'b', loc: [ 0.0002,  0.0001]}),
                iD.osmNode({id: 'c', loc: [ 0.0002, -0.0001]}),
                iD.osmNode({id: 'd', loc: [-0.0002, -0.0001]}),
                iD.osmWay({id: 's', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']}),
                iD.osmWay({id: 'l', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'd']})
            ]);

            var s = graph.entity('s').area(graph),
                l = graph.entity('l').area(graph);

            expect(s).to.equal(l);
        });

        it('returns 0 for degenerate areas', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [-0.0002,  0.0001]}),
                iD.osmNode({id: 'b', loc: [ 0.0002,  0.0001]}),
                iD.osmWay({id: '0', tags: {area: 'yes'}, nodes: []}),
                iD.osmWay({id: '1', tags: {area: 'yes'}, nodes: ['a']}),
                iD.osmWay({id: '2', tags: {area: 'yes'}, nodes: ['a', 'b']})
            ]);

            expect(graph.entity('0').area(graph)).to.equal(0);
            expect(graph.entity('1').area(graph)).to.equal(0);
            expect(graph.entity('2').area(graph)).to.equal(0);
        });
    });

});
