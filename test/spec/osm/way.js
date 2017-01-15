describe('iD.osmWay', function() {
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

        it('returns 0 when the way has a non numeric layer tag', function() {
            expect(iD.Way({tags: { layer: 'NaN' }}).layer()).to.equal(0);
            expect(iD.Way({tags: { layer: 'Infinity' }}).layer()).to.equal(0);
            expect(iD.Way({tags: { layer: 'Foo' }}).layer()).to.equal(0);
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
        before(function() {
            iD.Context();
        });

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
        it('adds a node to the end of a way when index is undefined', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(w.addNode('c').nodes).to.eql(['a', 'b', 'c']);
        });

        it('adds a node to an empty way', function () {
            var w = iD.Way();
            expect(w.addNode('a').nodes).to.eql(['a']);
        });

        it('throws when using a index greater than length', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(function() { w.addNode('c',3); }).to.throw;
        });

        it('adds a node to a way at index 0', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(w.addNode('c', 0).nodes).to.eql(['c', 'a', 'b']);
        });

        it('adds a node to a way at a positive index', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(w.addNode('c', 1).nodes).to.eql(['a', 'c', 'b']);
        });

        it('throws when using a negative index', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(function() { w.addNode('c', -1); }).to.throw;
        });
        
        it('prevents duplicate consecutive nodes when adding in front of', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(w.addNode('b', 1).nodes).to.eql(['a', 'b']);
        });

        it('prevents duplicate consecutive nodes when adding behind', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(w.addNode('a', 1).nodes).to.eql(['a', 'b']);
        });
        
        it('prevents duplicate consecutive nodes at index 0', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(w.addNode('a', 0).nodes).to.eql(['a', 'b']);
        });
        
        it('prevents duplicate consecutive nodes at a index equal to length', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(w.addNode('b', 2).nodes).to.eql(['a', 'b']);
        });

        it('prevents duplicate consecutive nodes when index is undefined', function () {
            var w = iD.Way({nodes: ['a', 'b']});
            expect(w.addNode('b').nodes).to.eql(['a', 'b']);
        });
    });

    describe('#updateNode', function () {
        it('updates the node id at the specified index', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c']});
            expect(w.updateNode('d', 1).nodes).to.eql(['a', 'd', 'c']);
        });
        it('throws at an invalid index', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c']});
            expect(function() { w.updateNode('d', -1); }).to.throw;
            expect(function() { w.updateNode('d'); }).to.throw;
            expect(function() { w.updateNode('d', 5); }).to.throw;
            expect(function() { w.updateNode('d', 3); }).to.throw;
        });
        
        it('prevents duplicate consecutive nodes', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c', 'd','e']});
            expect(w.updateNode('b',2).nodes).to.eql(['a', 'b', 'd','e']);
            w = iD.Way({nodes: ['a', 'b', 'c', 'd','e']});
            expect(w.updateNode('d',2).nodes).to.eql(['a', 'b', 'd','e']);
            w = iD.Way({nodes: ['a', 'b', 'c', 'b','e']});
            expect(w.updateNode('b',2).nodes).to.eql(['a', 'b','e']);
        });

        it('preserves duplicate non-consecutive nodes', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c', 'b','e']});
            expect(w.updateNode('d',2).nodes).to.eql(['a', 'b', 'd', 'b','e']);
        });

        it('replaces a single one of duplicate nodes', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c', 'b','e']});
            expect(w.updateNode('d',1).nodes).to.eql(['a', 'd', 'c', 'b','e']);
            w = iD.Way({nodes: ['a', 'b', 'b', 'c','e']});
            expect(w.updateNode('d',2).nodes).to.eql(['a', 'b', 'd', 'c','e']);
        });

        it('removes existing duplicate consecutive nodes', function () {
            var w = iD.Way({nodes: ['a', 'b', 'b', 'd', 'b', 'e']});
            expect(w.updateNode('c',5).nodes).to.eql(['a', 'b', 'd', 'b','c']);
            w = iD.Way({nodes: ['a', 'b', 'b', 'd', 'b', 'e']});
            expect(w.updateNode('c',3).nodes).to.eql(['a', 'b', 'c', 'b', 'e']);
        });
    });

    describe('#replaceNode', function () {
        it('replaces the node', function () {
            var w = iD.Way({nodes: ['a']});
            expect(w.replaceNode('a','b').nodes).to.eql(['b']);
            w = iD.Way({nodes: ['a', 'b', 'c']});
            expect(w.replaceNode('b', 'd').nodes).to.eql(['a', 'd', 'c']);
        });
        
        it('prevents duplicate consecutive nodes', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c', 'd','e']});
            expect(w.replaceNode('c','b').nodes).to.eql(['a', 'b', 'd','e']);
            w = iD.Way({nodes: ['a', 'b', 'c', 'd','e']});
            expect(w.replaceNode('c','d').nodes).to.eql(['a', 'b', 'd','e']);
            w = iD.Way({nodes: ['a', 'b', 'c', 'b','e']});
            expect(w.replaceNode('c','b').nodes).to.eql(['a', 'b','e']);
        });

        it('preserves duplicate non-consecutive nodes', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c', 'b','e']});
            expect(w.replaceNode('c','d').nodes).to.eql(['a', 'b', 'd', 'b','e']);
        });

        it('replaces duplicate non-consecutive nodes', function () {
            var w = iD.Way({nodes: ['a', 'b', 'c', 'b','e']});
            expect(w.replaceNode('b','d').nodes).to.eql(['a', 'd', 'c', 'd','e']);
        });

        it('removes existing duplicate consecutive nodes', function () {
            var w = iD.Way({nodes: ['a', 'b', 'b', 'd', 'b', 'e']});
            expect(w.replaceNode('e','c').nodes).to.eql(['a', 'b', 'd', 'b','c']);
            w = iD.Way({nodes: ['a', 'b', 'b', 'd', 'b', 'e']});
            expect(w.replaceNode('d','c').nodes).to.eql(['a', 'b', 'c', 'b', 'e']);
            w = iD.Way({nodes: ['a', 'b', 'b', 'c', 'b', 'e']});
            expect(w.replaceNode('b','d').nodes).to.eql(['a', 'd', 'c', 'd', 'e']);
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
            w = iD.Way({nodes: ['a', 'b', 'a']});
            expect(w.removeNode('b').nodes).to.eql(['a']);
        });
        it('removes existing duplicate consecutive nodes', function () {
            var w = iD.Way({nodes: ['a', 'b', 'b', 'd', 'b', 'e']});
            expect(w.removeNode('e').nodes).to.eql(['a', 'b', 'd', 'b']);
            w = iD.Way({nodes: ['a', 'b', 'b', 'd', 'b', 'e']});
            expect(w.removeNode('b').nodes).to.eql(['a', 'd', 'e']);
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

});
