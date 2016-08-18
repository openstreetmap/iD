describe('iD.Way', function() {
    if (iD.debug) {
        it('freezes nodes', function () {
            expect(Object.isFrozen(iD.Way().nodes)).to.be.true;
        });
    }

    it('returns a way', function () {
        expect(iD.Way()).to.be.an.instanceOf(iD.Way);
        expect(iD.Way().type).to.equal('way');
    });

    it('defaults nodes to an empty array', function () {
        expect(iD.Way().nodes).to.eql([]);
    });

    it('sets nodes as specified', function () {
        expect(iD.Way({nodes: ['n-1']}).nodes).to.eql(['n-1']);
    });

    it('defaults tags to an empty object', function () {
        expect(iD.Way().tags).to.eql({});
    });

    it('sets tags as specified', function () {
        expect(iD.Way({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });

    describe('#copy', function () {
        it('returns a new Way', function () {
            var w = iD.Way({id: 'w'}),
                result = w.copy(null, {});

            expect(result).to.be.an.instanceof(iD.Way);
            expect(result).not.to.equal(w);
        });

        it('adds the new Way to input object', function () {
            var w = iD.Way({id: 'w'}),
                copies = {},
                result = w.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(copies.w).to.equal(result);
        });

        it('returns an existing copy in input object', function () {
            var w = iD.Way({id: 'w'}),
                copies = {},
                result1 = w.copy(null, copies),
                result2 = w.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(result1).to.equal(result2);
        });

        it('deep copies nodes', function () {
            var a = iD.Node({id: 'a'}),
                b = iD.Node({id: 'b'}),
                w = iD.Way({id: 'w', nodes: ['a', 'b']}),
                graph = iD.Graph([a, b, w]),
                copies = {},
                result = w.copy(graph, copies);

            expect(Object.keys(copies)).to.have.length(3);
            expect(copies.a).to.be.an.instanceof(iD.Node);
            expect(copies.b).to.be.an.instanceof(iD.Node);
            expect(copies.a).not.to.equal(w.nodes[0]);
            expect(copies.b).not.to.equal(w.nodes[1]);
            expect(result.nodes).to.deep.eql([copies.a.id, copies.b.id]);
        });

        it('creates only one copy of shared nodes', function () {
            var a = iD.Node({id: 'a'}),
                w = iD.Way({id: 'w', nodes: ['a', 'a']}),
                graph = iD.Graph([a, w]),
                copies = {},
                result = w.copy(graph, copies);

            expect(result.nodes[0]).to.equal(result.nodes[1]);
        });
    });

    describe('#first', function () {
        it('returns the first node', function () {
            expect(iD.Way({nodes: ['a', 'b', 'c']}).first()).to.equal('a');
        });
    });

    describe('#last', function () {
        it('returns the last node', function () {
            expect(iD.Way({nodes: ['a', 'b', 'c']}).last()).to.equal('c');
        });
    });

    describe('#contains', function () {
        it('returns true if the way contains the given node', function () {
            expect(iD.Way({nodes: ['a', 'b', 'c']}).contains('b')).to.be.true;
        });

        it('returns false if the way does not contain the given node', function () {
            expect(iD.Way({nodes: ['a', 'b', 'c']}).contains('d')).to.be.false;
        });
    });

    describe('#affix', function () {
        it('returns \'prefix\' if the way starts with the given node', function () {
            expect(iD.Way({nodes: ['a', 'b', 'c']}).affix('a')).to.equal('prefix');
        });

        it('returns \'suffix\' if the way ends with the given node', function () {
            expect(iD.Way({nodes: ['a', 'b', 'c']}).affix('c')).to.equal('suffix');
        });

        it('returns falsy if the way does not start or end with the given node', function () {
            expect(iD.Way({nodes: ['a', 'b', 'c']}).affix('b')).not.to.be.ok;
            expect(iD.Way({nodes: []}).affix('b')).not.to.be.ok;
        });
    });

    describe('#extent', function () {
        it('returns the minimal extent containing all member nodes', function () {
            var node1 = iD.Node({loc: [0, 0]}),
                node2 = iD.Node({loc: [5, 10]}),
                way   = iD.Way({nodes: [node1.id, node2.id]}),
                graph = iD.Graph([node1, node2, way]);
            expect(way.extent(graph).equals([[0, 0], [5, 10]])).to.be.ok;
        });
    });

    describe('#isClosed', function() {
        it('returns false when the way has no nodes', function() {
            expect(iD.Way().isClosed()).to.equal(false);
        });

        it('returns false when the way ends are not equal', function() {
            expect(iD.Way({nodes: ['n1', 'n2']}).isClosed()).to.equal(false);
        });

        it('returns true when the way ends are equal', function() {
            expect(iD.Way({nodes: ['n1', 'n2', 'n1']}).isClosed()).to.equal(true);
        });
    });

    describe('#isConvex', function() {
        it('returns true for convex ways', function() {
            //    d -- e
            //    |     \
            //    |      a
            //    |     /
            //    c -- b
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [ 0.0003,  0.0000]}),
                iD.Node({id: 'b', loc: [ 0.0002, -0.0002]}),
                iD.Node({id: 'c', loc: [-0.0002, -0.0002]}),
                iD.Node({id: 'd', loc: [-0.0002,  0.0002]}),
                iD.Node({id: 'e', loc: [ 0.0002,  0.0002]}),
                iD.Way({id: 'w', nodes: ['a','b','c','d','e','a']})
            ]);
            expect(graph.entity('w').isConvex(graph)).to.be.true;
        });

        it('returns false for concave ways', function() {
            //    d -- e
            //    |   /
            //    |  a
            //    |   \
            //    c -- b
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [ 0.0000,  0.0000]}),
                iD.Node({id: 'b', loc: [ 0.0002, -0.0002]}),
                iD.Node({id: 'c', loc: [-0.0002, -0.0002]}),
                iD.Node({id: 'd', loc: [-0.0002,  0.0002]}),
                iD.Node({id: 'e', loc: [ 0.0002,  0.0002]}),
                iD.Way({id: 'w', nodes: ['a','b','c','d','e','a']})
            ]);
            expect(graph.entity('w').isConvex(graph)).to.be.false;
        });

        it('returns null for non-closed ways', function() {
            //    d -- e
            //    |
            //    |  a
            //    |   \
            //    c -- b
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [ 0.0000,  0.0000]}),
                iD.Node({id: 'b', loc: [ 0.0002, -0.0002]}),
                iD.Node({id: 'c', loc: [-0.0002, -0.0002]}),
                iD.Node({id: 'd', loc: [-0.0002,  0.0002]}),
                iD.Node({id: 'e', loc: [ 0.0002,  0.0002]}),
                iD.Way({id: 'w', nodes: ['a','b','c','d','e']})
            ]);
            expect(graph.entity('w').isConvex(graph)).to.be.null;
        });

        it('returns null for degenerate ways', function() {
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0.0000,  0.0000]}),
                iD.Way({id: 'w', nodes: ['a','a']})
            ]);
            expect(graph.entity('w').isConvex(graph)).to.be.null;
        });
    });

    describe('#layer', function() {
        it('returns 0 when the way has no tags', function() {
            expect(iD.Way().layer()).to.equal(0);
        });

        it('returns the layer when the way has an explicit layer tag', function() {
            expect(iD.Way({tags: { layer: '2' }}).layer()).to.equal(2);
            expect(iD.Way({tags: { layer: '-5' }}).layer()).to.equal(-5);
        });

        it('clamps the layer to within -10, 10', function() {
            expect(iD.Way({tags: { layer: '12' }}).layer()).to.equal(10);
            expect(iD.Way({tags: { layer: '-15' }}).layer()).to.equal(-10);
        });

        it('returns 1 for location=overground', function() {
            expect(iD.Way({tags: { location: 'overground' }}).layer()).to.equal(1);
        });

        it('returns -1 for location=underground', function() {
            expect(iD.Way({tags: { location: 'underground' }}).layer()).to.equal(-1);
        });

        it('returns -10 for location=underwater', function() {
            expect(iD.Way({tags: { location: 'underwater' }}).layer()).to.equal(-10);
        });

        it('returns 10 for power lines', function() {
            expect(iD.Way({tags: { power: 'line' }}).layer()).to.equal(10);
            expect(iD.Way({tags: { power: 'minor_line' }}).layer()).to.equal(10);
        });

        it('returns 10 for aerialways', function() {
            expect(iD.Way({tags: { aerialway: 'cable_car' }}).layer()).to.equal(10);
        });

        it('returns 1 for bridges', function() {
            expect(iD.Way({tags: { bridge: 'yes' }}).layer()).to.equal(1);
        });

        it('returns -1 for cuttings', function() {
            expect(iD.Way({tags: { cutting: 'yes' }}).layer()).to.equal(-1);
        });

        it('returns -1 for tunnels', function() {
            expect(iD.Way({tags: { tunnel: 'yes' }}).layer()).to.equal(-1);
        });

        it('returns -1 for waterways', function() {
            expect(iD.Way({tags: { waterway: 'stream' }}).layer()).to.equal(-1);
        });

        it('returns -10 for pipelines', function() {
            expect(iD.Way({tags: { man_made: 'pipeline' }}).layer()).to.equal(-10);
        });

        it('returns -10 for boundaries', function() {
            expect(iD.Way({tags: { boundary: 'administrative' }}).layer()).to.equal(-10);
        });

    });

    describe('#isOneWay', function() {
        it('returns false when the way has no tags', function() {
            expect(iD.Way().isOneWay()).to.be.false;
        });

        it('returns false when the way has tag oneway=no', function() {
            expect(iD.Way({tags: { oneway: 'no' }}).isOneWay(), 'oneway no').to.be.false;
            expect(iD.Way({tags: { oneway: '0' }}).isOneWay(), 'oneway 0').to.be.false;
        });

        it('returns true when the way has tag oneway=yes', function() {
            expect(iD.Way({tags: { oneway: 'yes' }}).isOneWay(), 'oneway yes').to.be.true;
            expect(iD.Way({tags: { oneway: '1' }}).isOneWay(), 'oneway 1').to.be.true;
            expect(iD.Way({tags: { oneway: '-1' }}).isOneWay(), 'oneway -1').to.be.true;
        });

        it('returns true when the way has implied oneway tag (waterway=river, waterway=stream, etc)', function() {
            expect(iD.Way({tags: { waterway: 'river' }}).isOneWay(), 'river').to.be.true;
            expect(iD.Way({tags: { waterway: 'stream' }}).isOneWay(), 'stream').to.be.true;
            expect(iD.Way({tags: { highway: 'motorway' }}).isOneWay(), 'motorway').to.be.true;
            expect(iD.Way({tags: { highway: 'motorway_link' }}).isOneWay(), 'motorway_link').to.be.true;
            expect(iD.Way({tags: { junction: 'roundabout' }}).isOneWay(), 'roundabout').to.be.true;
        });

        it('returns false when the way does not have implied oneway tag', function() {
            expect(iD.Way({tags: { highway: 'trunk' }}).isOneWay(), 'trunk').to.be.false;
            expect(iD.Way({tags: { highway: 'trunk_link' }}).isOneWay(), 'trunk_link').to.be.false;
            expect(iD.Way({tags: { highway: 'primary' }}).isOneWay(), 'primary').to.be.false;
            expect(iD.Way({tags: { highway: 'primary_link' }}).isOneWay(), 'primary_link').to.be.false;
            expect(iD.Way({tags: { highway: 'secondary' }}).isOneWay(), 'secondary').to.be.false;
            expect(iD.Way({tags: { highway: 'secondary_link' }}).isOneWay(), 'secondary_link').to.be.false;
            expect(iD.Way({tags: { highway: 'tertiary' }}).isOneWay(), 'tertiary').to.be.false;
            expect(iD.Way({tags: { highway: 'tertiary_link' }}).isOneWay(), 'tertiary_link').to.be.false;
            expect(iD.Way({tags: { highway: 'unclassified' }}).isOneWay(), 'unclassified').to.be.false;
            expect(iD.Way({tags: { highway: 'residential' }}).isOneWay(), 'residential').to.be.false;
            expect(iD.Way({tags: { highway: 'living_street' }}).isOneWay(), 'living_street').to.be.false;
            expect(iD.Way({tags: { highway: 'service' }}).isOneWay(), 'service').to.be.false;
            expect(iD.Way({tags: { highway: 'track' }}).isOneWay(), 'track').to.be.false;
            expect(iD.Way({tags: { highway: 'path' }}).isOneWay(), 'path').to.be.false;
        });

        it('returns false when oneway=no overrides implied oneway tag', function() {
            expect(iD.Way({tags: { junction: 'roundabout', oneway: 'no' }}).isOneWay(), 'roundabout').to.be.false;
            expect(iD.Way({tags: { highway: 'motorway', oneway: 'no' }}).isOneWay(), 'motorway').to.be.false;
        });
    });

    describe('#isArea', function() {
        it('returns false when the way has no tags', function() {
            expect(iD.Way().isArea()).to.equal(false);
        });

        it('returns true if the way has tag area=yes', function() {
            expect(iD.Way({tags: { area: 'yes' }}).isArea()).to.equal(true);
        });

        it('returns false if the way is closed and has no tags', function() {
            expect(iD.Way({nodes: ['n1', 'n1']}).isArea()).to.equal(false);
        });

        it('returns true if the way is closed and has a key in iD.areaKeys', function() {
            expect(iD.Way({nodes: ['n1', 'n1'], tags: {building: 'yes'}}).isArea()).to.equal(true);
        });

        it('returns false if the way is closed and has no keys in iD.areaKeys', function() {
            expect(iD.Way({nodes: ['n1', 'n1'], tags: {a: 'b'}}).isArea()).to.equal(false);
        });

        it('returns false if the way is closed and has tag area=no', function() {
            expect(iD.Way({nodes: ['n1', 'n1'], tags: {area: 'no', building: 'yes'}}).isArea()).to.equal(false);
        });

        it('returns false for coastline', function() {
            expect(iD.Way({nodes: ['n1', 'n1'], tags: {natural: 'coastline'}}).isArea()).to.equal(false);
        });
    });

    describe('#isDegenerate', function() {
       it('returns true for a linear way with zero or one nodes', function () {
           expect(iD.Way({nodes: []}).isDegenerate()).to.equal(true);
           expect(iD.Way({nodes: ['a']}).isDegenerate()).to.equal(true);
       });

        it('returns true for a circular way with only one unique node', function () {
            expect(iD.Way({nodes: ['a', 'a']}).isDegenerate()).to.equal(true);
        });

        it('returns false for a linear way with two or more nodes', function () {
            expect(iD.Way({nodes: ['a', 'b']}).isDegenerate()).to.equal(false);
        });

        it('returns true for an area with zero, one, or two unique nodes', function () {
            expect(iD.Way({tags: {area: 'yes'}, nodes: []}).isDegenerate()).to.equal(true);
            expect(iD.Way({tags: {area: 'yes'}, nodes: ['a', 'a']}).isDegenerate()).to.equal(true);
            expect(iD.Way({tags: {area: 'yes'}, nodes: ['a', 'b', 'a']}).isDegenerate()).to.equal(true);
        });

        it('returns false for an area with three or more unique nodes', function () {
            expect(iD.Way({tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'a']}).isDegenerate()).to.equal(false);
        });
    });

    describe('#areAdjacent', function() {
        it('returns false for nodes not in the way', function() {
            expect(iD.Way().areAdjacent('a', 'b')).to.equal(false);
        });

        it('returns false for non-adjacent nodes in the way', function() {
            expect(iD.Way({nodes: ['a', 'b', 'c']}).areAdjacent('a', 'c')).to.equal(false);
        });

        it('returns true for adjacent nodes in the way (forward)', function() {
            var way = iD.Way({nodes: ['a', 'b', 'c', 'd']});
            expect(way.areAdjacent('a', 'b')).to.equal(true);
            expect(way.areAdjacent('b', 'c')).to.equal(true);
            expect(way.areAdjacent('c', 'd')).to.equal(true);
        });

        it('returns true for adjacent nodes in the way (reverse)', function() {
            var way = iD.Way({nodes: ['a', 'b', 'c', 'd']});
            expect(way.areAdjacent('b', 'a')).to.equal(true);
            expect(way.areAdjacent('c', 'b')).to.equal(true);
            expect(way.areAdjacent('d', 'c')).to.equal(true);
        });
    });

    describe('#geometry', function() {
        it('returns \'line\' when the way is not an area', function () {
            expect(iD.Way().geometry(iD.Graph())).to.equal('line');
        });

        it('returns \'area\' when the way is an area', function () {
            expect(iD.Way({tags: { area: 'yes' }}).geometry(iD.Graph())).to.equal('area');
        });
    });

    describe('#addNode', function () {
        it('adds a node to the end of a way', function () {
            var w = iD.Way();
            expect(w.addNode('a').nodes).to.eql(['a']);
        });

        it('adds a node to a way at index 0', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(w.addNode('c', 0).nodes).to.eql(['c', 'a', 'b']);
        });

        it('adds a node to a way at a positive index', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(w.addNode('c', 1).nodes).to.eql(['a', 'c', 'b']);
        });

        it('adds a node to a way at a negative index', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(w.addNode('c', -1).nodes).to.eql(['a', 'c', 'b']);
        });
    });

    describe('#updateNode', function () {
        it('updates the node id at the specified index', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c']});
            expect(w.updateNode('d', 1).nodes).to.eql(['a', 'd', 'c']);
        });
    });

    describe('#removeNode', function () {
        it('removes the node', function () {
            var w = iD.Way({nodes: ['a']});
            expect(w.removeNode('a').nodes).to.eql([]);
        });

        it('prevents duplicate consecutive nodes', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c', 'b']});
            expect(w.removeNode('c').nodes).to.eql(['a', 'b']);
        });

        it('preserves circularity', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c', 'd', 'a']});
            expect(w.removeNode('a').nodes).to.eql(['b', 'c', 'd', 'b']);
        });

        it('prevents duplicate consecutive nodes when preserving circularity', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c', 'd', 'b', 'a']});
            expect(w.removeNode('a').nodes).to.eql(['b', 'c', 'd', 'b']);
        });
    });

    describe('#asJXON', function () {
        it('converts a way to jxon', function() {
            var node = iD.Way({id: 'w-1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}});
            expect(node.asJXON()).to.eql({way: {
                '@id': '-1',
                '@version': 0,
                nd: [{keyAttributes: {ref: '1'}}, {keyAttributes: {ref: '2'}}],
                tag: [{keyAttributes: {k: 'highway', v: 'residential'}}]}});
        });

        it('includes changeset if provided', function() {
            expect(iD.Way().asJXON('1234').way['@changeset']).to.equal('1234');
        });
    });

    describe('#asGeoJSON', function () {
        it('converts a line to a GeoJSON LineString geometry', function () {
            var a = iD.Node({loc: [1, 2]}),
                b = iD.Node({loc: [3, 4]}),
                w = iD.Way({tags: {highway: 'residential'}, nodes: [a.id, b.id]}),
                graph = iD.Graph([a, b, w]),
                json = w.asGeoJSON(graph);

            expect(json.type).to.equal('LineString');
            expect(json.coordinates).to.eql([a.loc, b.loc]);
        });

        it('converts an area to a GeoJSON Polygon geometry', function () {
            var a = iD.Node({loc: [1, 2]}),
                b = iD.Node({loc: [5, 6]}),
                c = iD.Node({loc: [3, 4]}),
                w = iD.Way({tags: {area: 'yes'}, nodes: [a.id, b.id, c.id, a.id]}),
                graph = iD.Graph([a, b, c, w]),
                json = w.asGeoJSON(graph, true);

            expect(json.type).to.equal('Polygon');
            expect(json.coordinates).to.eql([[a.loc, b.loc, c.loc, a.loc]]);
        });

        it('converts an unclosed area to a GeoJSON LineString geometry', function () {
            var a = iD.Node({loc: [1, 2]}),
                b = iD.Node({loc: [5, 6]}),
                c = iD.Node({loc: [3, 4]}),
                w = iD.Way({tags: {area: 'yes'}, nodes: [a.id, b.id, c.id]}),
                graph = iD.Graph([a, b, c, w]),
                json = w.asGeoJSON(graph, true);

            expect(json.type).to.equal('LineString');
            expect(json.coordinates).to.eql([a.loc, b.loc, c.loc]);
        });
    });

    describe('#area', function() {
        it('returns a relative measure of area', function () {
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [-0.0002,  0.0001]}),
                iD.Node({id: 'b', loc: [ 0.0002,  0.0001]}),
                iD.Node({id: 'c', loc: [ 0.0002, -0.0001]}),
                iD.Node({id: 'd', loc: [-0.0002, -0.0001]}),
                iD.Node({id: 'e', loc: [-0.0004,  0.0002]}),
                iD.Node({id: 'f', loc: [ 0.0004,  0.0002]}),
                iD.Node({id: 'g', loc: [ 0.0004, -0.0002]}),
                iD.Node({id: 'h', loc: [-0.0004, -0.0002]}),
                iD.Way({id: 's', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']}),
                iD.Way({id: 'l', tags: {area: 'yes'}, nodes: ['e', 'f', 'g', 'h', 'e']})
            ]);

            var s = Math.abs(graph.entity('s').area(graph)),
                l = Math.abs(graph.entity('l').area(graph));

            expect(s).to.be.lt(l);
        });

        it('treats unclosed areas as if they were closed', function () {
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [-0.0002,  0.0001]}),
                iD.Node({id: 'b', loc: [ 0.0002,  0.0001]}),
                iD.Node({id: 'c', loc: [ 0.0002, -0.0001]}),
                iD.Node({id: 'd', loc: [-0.0002, -0.0001]}),
                iD.Way({id: 's', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']}),
                iD.Way({id: 'l', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'd']})
            ]);

            var s = graph.entity('s').area(graph),
                l = graph.entity('l').area(graph);

            expect(s).to.equal(l);
        });

        it('returns 0 for degenerate areas', function () {
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [-0.0002,  0.0001]}),
                iD.Node({id: 'b', loc: [ 0.0002,  0.0001]}),
                iD.Way({id: '0', tags: {area: 'yes'}, nodes: []}),
                iD.Way({id: '1', tags: {area: 'yes'}, nodes: ['a']}),
                iD.Way({id: '2', tags: {area: 'yes'}, nodes: ['a', 'b']})
            ]);

            expect(graph.entity('0').area(graph)).to.equal(0);
            expect(graph.entity('1').area(graph)).to.equal(0);
            expect(graph.entity('2').area(graph)).to.equal(0);
        });
    });

    describe('iD.Lanes', function() {

        describe('default lane tags', function() {

            describe('motorway', function() {

                it('returns 2 lanes for highway=motorway', function() {
                    expect(iD.Way({tags: { highway: 'motorway' }}).lanes().metadata.count, 'motorway lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'motorway', oneway: 'yes' }}).lanes().metadata.count, 'motorway lanes')
                        .to.eql(2);
                });

                it('returns 4 lanes for highway=motorway and oneway=no', function() {
                    expect(iD.Way({tags: { highway: 'motorway', oneway: 'no' }}).lanes().metadata.count, 'motorway lanes')
                        .to.eql(4);
                });

                it('returns 1 lane for highway=motorway_link', function() {
                    expect(iD.Way({tags: { highway: 'motorway_link' }}).lanes().metadata.count, 'motorway_link lanes')
                        .to.eql(1);
                    expect(iD.Way({tags: { highway: 'motorway_link', oneway: 'yes' }}).lanes().metadata.count, 'motorway_link lanes')
                        .to.eql(1);
                });

                it('returns 2 lanes for highway=motorway_link and oneway=no', function() {
                    expect(iD.Way({tags: { highway: 'motorway_link', oneway: 'no' }}).lanes().metadata.count, 'motorway_link lanes')
                        .to.eql(2);
                });

            });

            describe('trunk', function() {

                it('returns 4 lanes for highway=trunk', function() {
                    expect(iD.Way({tags: { highway: 'trunk' }}).lanes().metadata.count, 'trunk lanes')
                        .to.eql(4);
                    expect(iD.Way({tags: { highway: 'trunk', oneway: 'no' }}).lanes().metadata.count, 'trunk lanes')
                        .to.eql(4);
                });

                it('returns 2 lanes for highway=trunk and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'trunk', oneway: 'yes' }}).lanes().metadata.count, 'trunk lanes')
                        .to.eql(2);
                });

                it('returns 2 lanes for highway=trunk_link', function() {
                    expect(iD.Way({tags: { highway: 'trunk_link' }}).lanes().metadata.count, 'trunk_link lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'trunk_link', oneway: 'no' }}).lanes().metadata.count, 'trunk_link lanes')
                        .to.eql(2);
                });

                it('returns 1 lane for highway=trunk_link and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'trunk_link', oneway: 'yes' }}).lanes().metadata.count, 'trunk_link lanes')
                        .to.eql(1);
                });
            });

            describe('primary', function() {

                it('returns 2 lanes for highway=primary', function() {
                    expect(iD.Way({tags: { highway: 'primary' }}).lanes().metadata.count, 'primary lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'primary', oneway: 'no' }}).lanes().metadata.count, 'primary lanes')
                        .to.eql(2);
                });

                it('returns 1 lane for highway=primary and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'primary', oneway: 'yes' }}).lanes().metadata.count, 'primary lanes')
                        .to.eql(1);
                });

                it('returns 2 lanes for highway=primary_link', function() {
                    expect(iD.Way({tags: { highway: 'primary_link' }}).lanes().metadata.count, 'primary lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'primary_link', oneway: 'no' }}).lanes().metadata.count, 'primary lanes')
                        .to.eql(2);
                });

                it('returns 1 lane for highway=primary_link and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'primary_link', oneway: 'yes' }}).lanes().metadata.count, 'primary lanes')
                        .to.eql(1);
                });
            });

            describe('seconday', function() {

                it('returns 2 lanes for highway=secondary', function() {
                    expect(iD.Way({tags: { highway: 'secondary' }}).lanes().metadata.count, 'secondary lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'secondary', oneway: 'no' }}).lanes().metadata.count, 'secondary lanes')
                        .to.eql(2);
                });

                it('returns 1 lane for highway=secondary and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'secondary', oneway: 'yes' }}).lanes().metadata.count, 'secondary lanes')
                        .to.eql(1);
                });

                it('returns 2 lane for highway=secondary_link', function() {
                    expect(iD.Way({tags: { highway: 'secondary_link' }}).lanes().metadata.count, 'secondary_link lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'secondary_link', oneway: 'no' }}).lanes().metadata.count, 'secondary_link lanes')
                        .to.eql(2);
                });

                it('returns 1 lane for highway=secondary_link and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'secondary_link', oneway: 'yes' }}).lanes().metadata.count, 'secondary_link lanes')
                        .to.eql(1);
                });
            });

            describe('tertiary', function() {

                it('returns 2 lanes for highway=tertiary', function() {
                    expect(iD.Way({tags: { highway: 'tertiary' }}).lanes().metadata.count, 'tertiary lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'tertiary', oneway: 'no' }}).lanes().metadata.count, 'tertiary lanes')
                        .to.eql(2);
                });

                it('returns 1 lane for highway=tertiary and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'tertiary', oneway: 'yes' }}).lanes().metadata.count, 'tertiary lanes')
                        .to.eql(1);
                });

                it('returns 2 lane for highway=tertiary_link', function() {
                    expect(iD.Way({tags: { highway: 'tertiary_link' }}).lanes().metadata.count, 'tertiary_link lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'tertiary_link', oneway: 'no' }}).lanes().metadata.count, 'tertiary_link lanes')
                        .to.eql(2);
                });

                it('returns 1 lane for highway=tertiary_link and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'tertiary_link', oneway: 'yes' }}).lanes().metadata.count, 'tertiary_link lanes')
                        .to.eql(1);
                });
            });

            describe('residential', function() {

                it('returns 2 lanes for highway=residential', function() {
                    expect(iD.Way({tags: { highway: 'residential' }}).lanes().metadata.count, 'residential lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'residential', oneway: 'no' }}).lanes().metadata.count, 'residential lanes')
                        .to.eql(2);
                });

                it('returns 1 lane for highway=residential and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'residential', oneway: 'yes' }}).lanes().metadata.count, 'residential lanes')
                        .to.eql(1);
                });
            });

            describe('service', function() {

                it('returns 2 lanes for highway=service', function() {
                    expect(iD.Way({tags: { highway: 'service' }}).lanes().metadata.count, 'service lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'service', oneway: 'no' }}).lanes().metadata.count, 'service lanes')
                        .to.eql(2);
                });

                it('returns 1 lane for highway=service and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'service', oneway: 'yes' }}).lanes().metadata.count, 'service lanes')
                        .to.eql(1);
                });
            });

            describe('track', function() {

                it('returns 2 lanes for highway=track', function() {
                    expect(iD.Way({tags: { highway: 'track' }}).lanes().metadata.count, 'track lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'track', oneway: 'no' }}).lanes().metadata.count, 'track lanes')
                        .to.eql(2);
                });

                it('returns 1 lane for highway=track and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'track', oneway: 'yes' }}).lanes().metadata.count, 'track lanes')
                        .to.eql(1);
                });
            });

            describe('path', function() {

                it('returns 2 lanes for highway=path', function() {
                    expect(iD.Way({tags: { highway: 'path' }}).lanes().metadata.count, 'path lanes')
                        .to.eql(2);
                    expect(iD.Way({tags: { highway: 'path', oneway: 'no' }}).lanes().metadata.count, 'path lanes')
                        .to.eql(2);
                });

                it('returns 1 lane for highway=path and oneway=yes', function() {
                    expect(iD.Way({tags: { highway: 'path', oneway: 'yes' }}).lanes().metadata.count, 'path lanes')
                        .to.eql(1);
                });
            });
        });

        describe('oneway tags', function() {
            it('returns correctlys oneway when tagged as oneway', function() {
                expect(iD.Way({tags: { highway: 'residential', oneway: 'yes' }}).lanes().metadata.oneway, 'residential lanes')
                    .to.be.true;
                expect(iD.Way({tags: { highway: 'residential', oneway: 'no' }}).lanes().metadata.oneway, 'residential lanes')
                    .to.be.false;
            });
        });

        describe('lane direction', function() {
            it('returns correctlys the lane:forward and lane:backward count', function() {
                expect(iD.Way({tags: { highway: 'residential', lanes: 2, 'lanes:forward': 1, 'lanes:backward': 1 }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 2,
                        oneway: false,
                        forward: 1,
                        backward: 1,
                        bothways: 0
                    });
                expect(iD.Way({tags: { highway: 'residential', lanes: 4, 'lanes:forward': 3, 'lanes:backward': 1 }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 4,
                        oneway: false,
                        forward: 3,
                        backward: 1,
                        bothways: 0
                    });
            });
            it('returns correctlys count under total count if erroneous values are supplied', function() {
                expect(iD.Way({tags: { highway: 'trunk', lanes: 2, 'lanes:forward': 3 }}).lanes().metadata, 'trunk lanes')
                    .to.include({
                        count: 2,
                        oneway: false,
                        forward: 2,
                        backward: 0,
                        bothways: 0
                    });
            });
            it('returns correctlys forward count when oneway=yes', function() {
                expect(iD.Way({tags: { highway: 'trunk', lanes: 2, oneway: 'yes' }}).lanes().metadata, 'trunk lanes')
                    .to.include({
                        count: 2,
                        oneway: true,
                        forward: 2,
                        backward: 0,
                        bothways: 0
                    });
            });
            it('returns correctlys backward count the when oneway=-1', function() {
                expect(iD.Way({tags: { highway: 'primary', lanes: 4, oneway: '-1' }}).lanes().metadata, 'primary lanes')
                    .to.include({
                        count: 4,
                        oneway: true,
                        backward: 4,
                        forward: 0,
                        bothways: 0
                    });
            });
            it('skips provided lanes:forward value when oneway=yes', function() {
                expect(iD.Way({tags: { highway: 'trunk', lanes: 2, oneway: 'yes', 'lanes:forward': 1 }}).lanes().metadata, 'trunk lanes')
                    .to.include({
                        count: 2,
                        oneway: true,
                        forward: 2,
                        backward: 0,
                        bothways: 0
                    });
            });
            it('skips provided lanes:backward value when oneway=yes', function() {
                expect(iD.Way({tags: { highway: 'trunk', lanes: 2, oneway: 'yes', 'lanes:backward': 1 }}).lanes().metadata, 'trunk lanes')
                    .to.include({
                        count: 2,
                        oneway: true,
                        forward: 2,
                        backward: 0,
                        bothways: 0
                    });
            });
            it('returns correctlys forward count if only backward is supplied', function() {
                expect(iD.Way({tags: { highway: 'residential', lanes: 3, 'lanes:backward': 1, }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 3,
                        oneway: false,
                        forward: 2,
                        backward: 1,
                        bothways: 0
                    });
                expect(iD.Way({tags: { highway: 'residential', lanes: 4, 'lanes:backward': 3, }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 4,
                        oneway: false,
                        forward: 1,
                        backward: 3,
                        bothways: 0
                    });
            });
            it('returns correctlys backward count if only forward is supplied', function() {
                expect(iD.Way({tags: { highway: 'residential', lanes: 3, 'lanes:forward': 1, }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 3,
                        oneway: false,
                        forward: 1,
                        backward: 2,
                        bothways: 0
                    });
                expect(iD.Way({tags: { highway: 'residential', lanes: 2, 'lanes:forward': 1, }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 2,
                        oneway: false,
                        forward: 1,
                        backward: 1,
                        bothways: 0
                    });
            });
            it('returns correctlys backward count if forward and both_ways are supplied', function() {
                expect(iD.Way({tags: { highway: 'residential', lanes: 3, 'lanes:forward': 1, 'lanes:both_ways': 1 }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 3,
                        oneway: false,
                        forward: 1,
                        backward: 1,
                        bothways: 1
                    });
                expect(iD.Way({tags: { highway: 'residential', lanes: 5, 'lanes:forward': 1, 'lanes:both_ways': 1 }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 5,
                        oneway: false,
                        forward: 1,
                        backward: 3,
                        bothways: 1
                    });
            });
            it('returns correctlys forward count if backward and both_ways are supplied', function() {
                expect(iD.Way({tags: { highway: 'residential', lanes: 3, 'lanes:backward': 1, 'lanes:both_ways': 1 }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 3,
                        oneway: false,
                        forward: 1,
                        backward: 1,
                        bothways: 1
                    });
                expect(iD.Way({tags: { highway: 'residential', lanes: 5, 'lanes:backward': 1, 'lanes:both_ways': 1 }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 5,
                        oneway: false,
                        forward: 3,
                        backward: 1,
                        bothways: 1
                    });
            });

            it('returns correctlys the lane:both_ways count as 1', function() {
                expect(iD.Way({tags: { highway: 'residential', lanes: 2, 'lanes:forward': 1, 'lanes:both_ways': 1 }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 2,
                        oneway: false,
                        forward: 1,
                        backward: 0,
                        bothways: 1
                    });
            });
            it('returns correctlys when lane:both_ways>1', function() {
                expect(iD.Way({tags: { highway: 'residential', lanes: 5, 'lanes:forward': 2, 'lanes:both_ways': 2, 'lanes:backward': 2 }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 5,
                        oneway: false,
                        forward: 2,
                        backward: 2,
                        bothways: 1
                    });
            });
            it('returns correctlys when lane:both_ways is 0 or Not a Number', function() {
                expect(iD.Way({tags: { highway: 'residential', lanes: 5, 'lanes:forward': 2, 'lanes:both_ways': 0, 'lanes:backward': 3 }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 5,
                        oneway: false,
                        forward: 2,
                        backward: 3,
                        bothways: 0
                    });
                expect(iD.Way({tags: { highway: 'residential', lanes: 2, 'lanes:forward': 1, 'lanes:both_ways': 'none' }}).lanes().metadata, 'residential lanes')
                    .to.include({
                        count: 2,
                        oneway: false,
                        forward: 1,
                        backward: 1,
                        bothways: 0
                    });
            });
        });

        describe('lanes array', function() {
          it('should have correct number of direction elements', function() {
            var lanes = iD.Way({tags: { highway: 'residential', lanes: 5, 'lanes:forward': 2, 'lanes:both_ways': 0, 'lanes:backward': 3 }}).lanes().lanes;
            var forward = lanes.filter(function(l) {
              return l.direction === 'forward';
            });
            var backward = lanes.filter(function(l) {
              return l.direction === 'backward';
            });
            var bothways = lanes.filter(function(l) {
              return l.direction === 'bothways';
            });
            expect(forward.length).to.eql(2);
            expect(backward.length).to.eql(3);
            expect(bothways.length).to.eql(0);

          });
          it('should have corrent number of direction elements', function() {
            var lanes = iD.Way({tags: { highway: 'residential', lanes: 5, 'lanes:backward': 1, 'lanes:both_ways': 1 }}).lanes().lanes;
            var forward = lanes.filter(function(l) {
              return l.direction === 'forward';
            });
            var backward = lanes.filter(function(l) {
              return l.direction === 'backward';
            });
            var bothways = lanes.filter(function(l) {
              return l.direction === 'bothways';
            });
            expect(forward.length).to.eql(3);
            expect(backward.length).to.eql(1);
            expect(bothways.length).to.eql(1);
          });
        });

        describe('turn lanes', function() {
            it('returns correctly when oneway=yes', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'trunk',
                        oneway: 'yes',
                        'turn:lanes': 'none|slight_right'
                    }
                }).lanes().metadata;
                expect(metadata.turnLanes)
                    .to.deep.equal([
                        ['none'], ['slight_right']
                    ]);
            });

            it('returns correctly when oneway=yes and lanes=2', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        oneway: 'yes',
                        lanes: '2',
                        'turn:lanes': 'none|slight_right'
                    }
                }).lanes().metadata;

                expect(metadata.turnLanes)
                    .to.deep.equal([
                        ['none'], ['slight_right']
                    ]);
            });

            it('returns correctly when lanes=5 and both_ways=1', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'residential',
                        lanes: 5,
                        'lanes:forward': 1,
                        'lanes:both_ways': 1,
                        'turn:lanes:forward': 'slight_left',
                        'turn:lanes:backward': 'none|through|through;slight_right',
                    }
                }).lanes().metadata;
                expect(metadata.turnLanesForward)
                    .to.deep.equal([
                        ['slight_left']
                    ]);
                expect(metadata.turnLanesBackward)
                    .to.deep.equal([
                        ['none'], ['through'], ['through', 'slight_right']
                    ]);
            });

            it('returns correctly when multiple values are present in a lane and oneway=yes', function() {
                var lanesData = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 5,
                        oneway: 'yes',
                        'turn:lanes': 'slight_left;reverse;left|slight_left;left;through|through|none|through;right',
                    }
                }).lanes();

                expect(lanesData.metadata.turnLanes)
                    .to.deep.equal([
                        ['slight_left', 'reverse', 'left'],
                        ['slight_left', 'left', 'through'],
                        ['through'],
                        ['none'],
                        ['through', 'right']
                    ]);

                expect(lanesData.lanes.map(function(l) { return l.turnLane; }))
                    .to.deep.equal([
                        ['slight_left', 'reverse', 'left'],
                        ['slight_left', 'left', 'through'],
                        ['through'],
                        ['none'],
                        ['through', 'right']
                    ]);
            });

            it('returns correctly when multiple values are present in a lane and oneway=no', function() {
                var lanesData = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 5,
                        oneway: 'no',
                        'lanes:forward': 3,
                        'lanes:backward': 2,
                        'turn:lanes:forward': 'slight_left;reverse;left|slight_left;left;through|through',
                        'turn:lanes:backward': 'none|through;left'
                    }
                }).lanes();
                expect(lanesData.metadata.turnLanesForward)
                    .to.deep.equal([
                        ['slight_left', 'reverse', 'left'],
                        ['slight_left', 'left', 'through'],
                        ['through']
                    ]);
                expect(lanesData.metadata.turnLanesBackward)
                    .to.deep.equal([
                        ['none'],
                        ['through', 'left']
                    ]);
                expect(lanesData.lanes.map(function(l) { return l.turnLane; }))
                    .to.deep.equal([
                        ['slight_left', 'reverse', 'left'],
                        ['slight_left', 'left', 'through'],
                        ['through'],
                        ['none'],
                        ['through', 'left']
                    ]);
            });

            it('fills with [\'none\'] when given turn:lanes are less than lanes count', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 5,
                        oneway: 'yes',
                        'turn:lanes': 'slight_left',
                    }
                }).lanes().metadata;

                expect(metadata.turnLanes)
                    .to.deep.equal([
                        ['slight_left'], ['none'], ['none'], ['none'], ['none']
                    ]);
            });

            it('fills with [\'none\'] when given turn:lanes:forward are less than lanes forward count', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 5,
                        oneway: 'no',
                        'lanes:forward': 3,
                        'turn:lanes:forward': 'slight_left',
                        'turn:lanes:backward': 'through',
                    }
                }).lanes().metadata;

                expect(metadata.turnLanesForward)
                    .to.deep.equal([
                        ['slight_left'], ['none'], ['none']
                    ]);
                expect(metadata.turnLanesBackward)
                    .to.deep.equal([
                        ['through'], ['none']
                    ]);
            });

            it('clips when turn lane information is more than lane count', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 2,
                        oneway: 'yes',
                        'turn:lanes': 'through|through;slight_right|slight_right',
                    }
                }).lanes().metadata;

                expect(metadata.turnLanes)
                    .to.deep.equal([
                        ['through'], ['through', 'slight_right']
                    ]);
            });

            it('turnLanes is undefined when not present', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 2,
                        oneway: 'yes'
                    }
                }).lanes().metadata;

                expect(metadata.turnLanes)
                    .to.equal(undefined);
                expect(metadata.turnLanesForward)
                    .to.equal(undefined);
                expect(metadata.turnLanesBackward)
                    .to.equal(undefined);
            });

            it('turnLanesForward and turnLanesBackward are both undefined when both are not provided', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 2,
                        oneway: 'yes',
                        'turn:lanes': 'through|through;slight_right',
                    }
                }).lanes().metadata;

                expect(metadata.turnLanes)
                    .to.deep.equal([['through'], ['through', 'slight_right']]);
                expect(metadata.turnLanesForward)
                    .to.equal(undefined);
                expect(metadata.turnLanesBackward)
                    .to.equal(undefined);
            });

            it('parses turnLane correctly when lanes:both_ways=1', function() {
                var lanes = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 5,
                        oneway: 'no',
                        'lanes:forward': 3,
                        'lanes:both_ways': 1,
                        'lanes:backward': 1,
                        'turn:lanes:backward': 'slight_right',
                        'turn:lanes:forward': 'slight_left||',
                    }
                }).lanes().lanes;
                var turnLanes = lanes.map(function(l) { return l.turnLane; });
                expect(turnLanes).to.deep.equal([
                    ['slight_left'], ['none'], ['none'], null, ['slight_right']
                ]);

            });

            it('parses turnLane correctly when lanes:both_ways=1 & lanes:forward < lanes:backward', function() {
                var lanes = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 5,
                        oneway: 'no',
                        'lanes:forward': 1,
                        'lanes:both_ways': 1,
                        'lanes:backward': 3,
                        'turn:lanes:forward': 'through',
                        'turn:lanes:backward': 'slight_left||',
                    }
                }).lanes().lanes;

                var turnLanes = lanes.map(function(l) { return l.turnLane; });
                expect(turnLanes).to.deep.equal([
                    ['through'], null, ['slight_left'], ['none'], ['none']
                ]);

            });



            it('parses correctly when turn:lanes= ||x', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 3,
                        oneway: 'yes',
                        'turn:lanes': '||through;slight_right',
                    }
                }).lanes().metadata;

                expect(metadata.turnLanes)
                    .to.deep.equal([['none'], ['none'], ['through', 'slight_right']]);
            });

            it('parses correctly when turn:lanes= |x|', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 5,
                        'turn:lanes': '|through|',
                    }
                }).lanes().metadata;

                expect(metadata.turnLanes)
                    .to.deep.equal([['none'], ['through'], ['none'], ['none'], ['none']]);
            });

            it('parses correctly when turn:lanes:forward= ||x', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 4,
                        oneway: 'no',
                        'lanes:forward': 3,
                        'lanes:backward': 1,
                        'turn:lanes:forward': '||through;slight_right',
                        'turn:lanes:backward': 'none',
                    }
                }).lanes().metadata;

                expect(metadata.turnLanesForward)
                    .to.deep.equal([['none'], ['none'], ['through', 'slight_right']]);
                expect(metadata.turnLanesBackward)
                    .to.deep.equal([['none']]);
            });

            it('parses correctly when turn:lanes:backward= |', function() {
                var metadata = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 5,
                        oneway: 'no',
                        'lanes:forward': 3,
                        'lanes:backward': 2,
                        'turn:lanes:backward': '|',
                        'turn:lanes:forward': 'slight_left||',
                    }
                }).lanes().metadata;

                expect(metadata.turnLanesForward)
                    .to.deep.equal([['slight_left'], ['none'], ['none']]);
                expect(metadata.turnLanesBackward)
                    .to.deep.equal([['none'], ['none']]);
            });

            it('fills turnLane correctly in lanes', function() {
                var lanes = iD.Way({
                    tags: {
                        highway: 'tertiary',
                        lanes: 5,
                        'lanes:forward': 3,
                        'lanes:backward': 2,
                        'turn:lanes:backward': 'none|slight_right',
                        'turn:lanes:forward': 'slight_left||',
                    }
                }).lanes().lanes;

                var turnLanes = lanes.map(function(l) { return l.turnLane; });
                expect(turnLanes).to.deep.equal([
                    ['slight_left'], ['none'], ['none'], ['none'], ['slight_right']
                ]);
            });

        });

        describe.only('maxspeed', function() {
            it('should parse maxspeed correctly', function() {
                var maxspeedLanes = iD.Way({
                    tags: {
                        highway: 'residential',
                        lanes: 5,
                        'maxspeed:lanes': '30|40|40|40|40'
                    }
                }).lanes().metadata.maxspeedLanes;

                expect(maxspeedLanes).to.deep.equal([
                    30, 40, 40, 40, 40
                ]);

            });
        });
    });
});
