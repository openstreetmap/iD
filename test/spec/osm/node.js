describe('iD.osmNode', function () {
    it('returns a node', function () {
        expect(iD.osmNode()).to.be.an.instanceOf(iD.osmNode);
        expect(iD.osmNode().type).to.equal('node');
    });

    it('defaults tags to an empty object', function () {
        expect(iD.osmNode().tags).to.eql({});
    });

    it('sets tags as specified', function () {
        expect(iD.osmNode({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });

    describe('#extent', function() {
        it('returns a point extent', function() {
            expect(iD.osmNode({loc: [5, 10]}).extent().equals([[5, 10], [5, 10]])).to.be.ok;
        });
    });

    describe('#intersects', function () {
        it('returns true for a node within the given extent', function () {
            expect(iD.osmNode({loc: [0, 0]}).intersects([[-5, -5], [5, 5]])).to.equal(true);
        });

        it('returns false for a node outside the given extend', function () {
            expect(iD.osmNode({loc: [6, 6]}).intersects([[-5, -5], [5, 5]])).to.equal(false);
        });
    });

    describe('#geometry', function () {
        it('returns \'vertex\' if the node is a member of any way', function () {
            var node = iD.osmNode(),
                way  = iD.osmWay({nodes: [node.id]}),
                graph = iD.coreGraph([node, way]);
            expect(node.geometry(graph)).to.equal('vertex');
        });

        it('returns \'point\' if the node is not a member of any way', function () {
            var node = iD.osmNode(),
                graph = iD.coreGraph([node]);
            expect(node.geometry(graph)).to.equal('point');
        });
    });

    describe('#isEndpoint', function () {
        it('returns true for a node at an endpoint along a linear way', function () {
            var a = iD.osmNode({id: 'a'}),
                b = iD.osmNode({id: 'b'}),
                c = iD.osmNode({id: 'c'}),
                w = iD.osmWay({nodes: ['a', 'b', 'c']}),
                graph = iD.coreGraph([a, b, c, w]);
            expect(a.isEndpoint(graph)).to.equal(true, 'linear way, beginning node');
            expect(b.isEndpoint(graph)).to.equal(false, 'linear way, middle node');
            expect(c.isEndpoint(graph)).to.equal(true, 'linear way, ending node');
        });

        it('returns false for nodes along a circular way', function () {
            var a = iD.osmNode({id: 'a'}),
                b = iD.osmNode({id: 'b'}),
                c = iD.osmNode({id: 'c'}),
                w = iD.osmWay({nodes: ['a', 'b', 'c', 'a']}),
                graph = iD.coreGraph([a, b, c, w]);
            expect(a.isEndpoint(graph)).to.equal(false, 'circular way, connector node');
            expect(b.isEndpoint(graph)).to.equal(false, 'circular way, middle node');
            expect(c.isEndpoint(graph)).to.equal(false, 'circular way, ending node');
        });
    });

    describe('#isConnected', function () {
        it('returns true for a node with multiple parent ways, at least one interesting', function () {
            var node = iD.osmNode(),
                w1 = iD.osmWay({nodes: [node.id]}),
                w2 = iD.osmWay({nodes: [node.id], tags: { highway: 'residential' }}),
                graph = iD.coreGraph([node, w1, w2]);
            expect(node.isConnected(graph)).to.equal(true);
        });

        it('returns false for a node with only area parent ways', function () {
            var node = iD.osmNode(),
                w1 = iD.osmWay({nodes: [node.id], tags: { area: 'yes' }}),
                w2 = iD.osmWay({nodes: [node.id], tags: { area: 'yes' }}),
                graph = iD.coreGraph([node, w1, w2]);
            expect(node.isConnected(graph)).to.equal(false);
        });

        it('returns false for a node with only uninteresting parent ways', function () {
            var node = iD.osmNode(),
                w1 = iD.osmWay({nodes: [node.id]}),
                w2 = iD.osmWay({nodes: [node.id]}),
                graph = iD.coreGraph([node, w1, w2]);
            expect(node.isConnected(graph)).to.equal(false);
        });

        it('returns false for a standalone node on a single parent way', function () {
            var node = iD.osmNode(),
                way = iD.osmWay({nodes: [node.id]}),
                graph = iD.coreGraph([node, way]);
            expect(node.isConnected(graph)).to.equal(false);
        });

        it('returns true for a self-intersecting node on a single parent way', function () {
            var a = iD.osmNode({id: 'a'}),
                b = iD.osmNode({id: 'b'}),
                c = iD.osmNode({id: 'c'}),
                w = iD.osmWay({nodes: ['a', 'b', 'c', 'b']}),
                graph = iD.coreGraph([a, b, c, w]);
            expect(b.isConnected(graph)).to.equal(true);
        });

        it('returns false for the connecting node of a closed way', function () {
            var a = iD.osmNode({id: 'a'}),
                b = iD.osmNode({id: 'b'}),
                c = iD.osmNode({id: 'c'}),
                w = iD.osmWay({nodes: ['a', 'b', 'c', 'a']}),
                graph = iD.coreGraph([a, b, c, w]);
            expect(a.isConnected(graph)).to.equal(false);
        });
    });

    describe('#isIntersection', function () {
        it('returns true for a node shared by more than one highway', function () {
            var node = iD.osmNode(),
                w1 = iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                w2 = iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                graph = iD.coreGraph([node, w1, w2]);
            expect(node.isIntersection(graph)).to.equal(true);
        });

        it('returns true for a node shared by more than one waterway', function () {
            var node = iD.osmNode(),
                w1 = iD.osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                w2 = iD.osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                graph = iD.coreGraph([node, w1, w2]);
            expect(node.isIntersection(graph)).to.equal(true);
        });
    });

    describe('#isHighwayIntersection', function () {
        it('returns true for a node shared by more than one highway', function () {
            var node = iD.osmNode(),
                w1 = iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                w2 = iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                graph = iD.coreGraph([node, w1, w2]);
            expect(node.isHighwayIntersection(graph)).to.equal(true);
        });

        it('returns false for a node shared by more than one waterway', function () {
            var node = iD.osmNode(),
                w1 = iD.osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                w2 = iD.osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                graph = iD.coreGraph([node, w1, w2]);
            expect(node.isHighwayIntersection(graph)).to.equal(false);
        });
    });

    describe('#isDegenerate', function () {
        it('returns true if node has invalid loc', function () {
            expect(iD.osmNode().isDegenerate()).to.be.equal(true, 'no loc');
            expect(iD.osmNode({loc: ''}).isDegenerate()).to.be.equal(true, 'empty string loc');
            expect(iD.osmNode({loc: []}).isDegenerate()).to.be.equal(true, 'empty array loc');
            expect(iD.osmNode({loc: [0]}).isDegenerate()).to.be.equal(true, '1-array loc');
            expect(iD.osmNode({loc: [0, 0, 0]}).isDegenerate()).to.be.equal(true, '3-array loc');
            expect(iD.osmNode({loc: [-181, 0]}).isDegenerate()).to.be.equal(true, '< min lon');
            expect(iD.osmNode({loc: [181, 0]}).isDegenerate()).to.be.equal(true, '> max lon');
            expect(iD.osmNode({loc: [0, -91]}).isDegenerate()).to.be.equal(true, '< min lat');
            expect(iD.osmNode({loc: [0, 91]}).isDegenerate()).to.be.equal(true, '> max lat');
            expect(iD.osmNode({loc: [Infinity, 0]}).isDegenerate()).to.be.equal(true, 'Infinity lon');
            expect(iD.osmNode({loc: [0, Infinity]}).isDegenerate()).to.be.equal(true, 'Infinity lat');
            expect(iD.osmNode({loc: [NaN, 0]}).isDegenerate()).to.be.equal(true, 'NaN lon');
            expect(iD.osmNode({loc: [0, NaN]}).isDegenerate()).to.be.equal(true, 'NaN lat');
        });

        it('returns false if node has valid loc', function () {
            expect(iD.osmNode({loc: [0, 0]}).isDegenerate()).to.be.equal(false, '2-array loc');
            expect(iD.osmNode({loc: [-180, 0]}).isDegenerate()).to.be.equal(false, 'min lon');
            expect(iD.osmNode({loc: [180, 0]}).isDegenerate()).to.be.equal(false, 'max lon');
            expect(iD.osmNode({loc: [0, -90]}).isDegenerate()).to.be.equal(false, 'min lat');
            expect(iD.osmNode({loc: [0, 90]}).isDegenerate()).to.be.equal(false, 'max lat');
        });
    });

    describe('#directions', function () {
        var projection = function (_) { return _; };
        it('returns empty array if no direction tag', function () {
            var node1 = iD.osmNode({ loc: [0, 0], tags: {}});
            var graph = iD.coreGraph([node1]);
            expect(node1.directions(graph, projection)).to.eql([], 'no direction tag');
        });

        it('returns empty array if nonsense direction tag', function () {
            var node1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'blah' }});
            var node2 = iD.osmNode({ loc: [0, 0], tags: { direction: '' }});
            var node3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'NaN' }});
            var node4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'eastwest' }});
            var graph = iD.coreGraph([node1, node2, node3, node4]);

            expect(node1.directions(graph, projection)).to.eql([], 'nonsense direction tag');
            expect(node2.directions(graph, projection)).to.eql([], 'empty string direction tag');
            expect(node3.directions(graph, projection)).to.eql([], 'NaN direction tag');
            expect(node4.directions(graph, projection)).to.eql([], 'eastwest direction tag');
        });

        it('supports numeric direction tag', function () {
            var node1 = iD.osmNode({ loc: [0, 0], tags: { direction: '0' }});
            var node2 = iD.osmNode({ loc: [0, 0], tags: { direction: '45' }});
            var node3 = iD.osmNode({ loc: [0, 0], tags: { direction: '-45' }});
            var node4 = iD.osmNode({ loc: [0, 0], tags: { direction: '360' }});
            var node5 = iD.osmNode({ loc: [0, 0], tags: { direction: '1000' }});
            var graph = iD.coreGraph([node1, node2, node3, node4, node5]);

            expect(node1.directions(graph, projection)).to.eql([0], 'numeric 0');
            expect(node2.directions(graph, projection)).to.eql([45], 'numeric 45');
            expect(node3.directions(graph, projection)).to.eql([-45], 'numeric -45');
            expect(node4.directions(graph, projection)).to.eql([360], 'numeric 360');
            expect(node5.directions(graph, projection)).to.eql([1000], 'numeric 1000');
        });

        it('supports cardinal direction tags (test abbreviated and mixed case)', function () {
            var nodeN1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'n' }});
            var nodeN2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'N' }});
            var nodeN3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'north' }});
            var nodeN4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'NOrth' }});

            var nodeNNE1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'nne' }});
            var nodeNNE2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'NnE' }});
            var nodeNNE3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'northnortheast' }});
            var nodeNNE4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'NOrthnorTHEast' }});

            var nodeNE1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'ne' }});
            var nodeNE2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'nE' }});
            var nodeNE3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'northeast' }});
            var nodeNE4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'norTHEast' }});

            var nodeENE1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'ene' }});
            var nodeENE2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'EnE' }});
            var nodeENE3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'eastnortheast' }});
            var nodeENE4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'EAstnorTHEast' }});

            var nodeE1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'e' }});
            var nodeE2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'E' }});
            var nodeE3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'east' }});
            var nodeE4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'EAst' }});

            var nodeESE1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'ese' }});
            var nodeESE2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'EsE' }});
            var nodeESE3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'eastsoutheast' }});
            var nodeESE4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'EAstsouTHEast' }});

            var nodeSE1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'se' }});
            var nodeSE2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'sE' }});
            var nodeSE3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'southeast' }});
            var nodeSE4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'souTHEast' }});

            var nodeSSE1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'sse' }});
            var nodeSSE2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'SsE' }});
            var nodeSSE3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'southsoutheast' }});
            var nodeSSE4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'SOuthsouTHEast' }});

            var nodeS1 = iD.osmNode({ loc: [0, 0], tags: { direction: 's' }});
            var nodeS2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'S' }});
            var nodeS3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'south' }});
            var nodeS4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'SOuth' }});

            var nodeSSW1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'ssw' }});
            var nodeSSW2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'SsW' }});
            var nodeSSW3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'southsouthwest' }});
            var nodeSSW4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'SOuthsouTHWest' }});

            var nodeSW1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'sw' }});
            var nodeSW2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'sW' }});
            var nodeSW3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'southwest' }});
            var nodeSW4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'souTHWest' }});

            var nodeWSW1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'wsw' }});
            var nodeWSW2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'WsW' }});
            var nodeWSW3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'westsouthwest' }});
            var nodeWSW4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'WEstsouTHWest' }});

            var nodeW1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'w' }});
            var nodeW2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'W' }});
            var nodeW3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'west' }});
            var nodeW4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'WEst' }});

            var nodeWNW1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'wnw' }});
            var nodeWNW2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'WnW' }});
            var nodeWNW3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'westnorthwest' }});
            var nodeWNW4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'WEstnorTHWest' }});

            var nodeNW1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'nw' }});
            var nodeNW2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'nW' }});
            var nodeNW3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'northwest' }});
            var nodeNW4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'norTHWest' }});

            var nodeNNW1 = iD.osmNode({ loc: [0, 0], tags: { direction: 'nnw' }});
            var nodeNNW2 = iD.osmNode({ loc: [0, 0], tags: { direction: 'NnW' }});
            var nodeNNW3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'northnorthwest' }});
            var nodeNNW4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'NOrthnorTHWest' }});

            var graph = iD.coreGraph([
                nodeN1, nodeN2, nodeN3, nodeN4,
                nodeNNE1, nodeNNE2, nodeNNE3, nodeNNE4,
                nodeNE1, nodeNE2, nodeNE3, nodeNE4,
                nodeENE1, nodeENE2, nodeENE3, nodeENE4,
                nodeE1, nodeE2, nodeE3, nodeE4,
                nodeESE1, nodeESE2, nodeESE3, nodeESE4,
                nodeSE1, nodeSE2, nodeSE3, nodeSE4,
                nodeSSE1, nodeSSE2, nodeSSE3, nodeSSE4,
                nodeS1, nodeS2, nodeS3, nodeS4,
                nodeSSW1, nodeSSW2, nodeSSW3, nodeSSW4,
                nodeSW1, nodeSW2, nodeSW3, nodeSW4,
                nodeWSW1, nodeWSW2, nodeWSW3, nodeWSW4,
                nodeW1, nodeW2, nodeW3, nodeW4,
                nodeWNW1, nodeWNW2, nodeWNW3, nodeWNW4,
                nodeNW1, nodeNW2, nodeNW3, nodeNW4,
                nodeNNW1, nodeNNW2, nodeNNW3, nodeNNW4
            ]);

            expect(nodeN1.directions(graph, projection)).to.eql([0], 'cardinal n');
            expect(nodeN2.directions(graph, projection)).to.eql([0], 'cardinal N');
            expect(nodeN3.directions(graph, projection)).to.eql([0], 'cardinal north');
            expect(nodeN4.directions(graph, projection)).to.eql([0], 'cardinal NOrth');

            expect(nodeNNE1.directions(graph, projection)).to.eql([22], 'cardinal nne');
            expect(nodeNNE2.directions(graph, projection)).to.eql([22], 'cardinal NnE');
            expect(nodeNNE3.directions(graph, projection)).to.eql([22], 'cardinal northnortheast');
            expect(nodeNNE4.directions(graph, projection)).to.eql([22], 'cardinal NOrthnorTHEast');

            expect(nodeNE1.directions(graph, projection)).to.eql([45], 'cardinal ne');
            expect(nodeNE2.directions(graph, projection)).to.eql([45], 'cardinal nE');
            expect(nodeNE3.directions(graph, projection)).to.eql([45], 'cardinal northeast');
            expect(nodeNE4.directions(graph, projection)).to.eql([45], 'cardinal norTHEast');

            expect(nodeENE1.directions(graph, projection)).to.eql([67], 'cardinal ene');
            expect(nodeENE2.directions(graph, projection)).to.eql([67], 'cardinal EnE');
            expect(nodeENE3.directions(graph, projection)).to.eql([67], 'cardinal eastnortheast');
            expect(nodeENE4.directions(graph, projection)).to.eql([67], 'cardinal EAstnorTHEast');

            expect(nodeE1.directions(graph, projection)).to.eql([90], 'cardinal e');
            expect(nodeE2.directions(graph, projection)).to.eql([90], 'cardinal E');
            expect(nodeE3.directions(graph, projection)).to.eql([90], 'cardinal east');
            expect(nodeE4.directions(graph, projection)).to.eql([90], 'cardinal EAst');

            expect(nodeESE1.directions(graph, projection)).to.eql([112], 'cardinal ese');
            expect(nodeESE2.directions(graph, projection)).to.eql([112], 'cardinal EsE');
            expect(nodeESE3.directions(graph, projection)).to.eql([112], 'cardinal eastsoutheast');
            expect(nodeESE4.directions(graph, projection)).to.eql([112], 'cardinal EAstsouTHEast');

            expect(nodeSE1.directions(graph, projection)).to.eql([135], 'cardinal se');
            expect(nodeSE2.directions(graph, projection)).to.eql([135], 'cardinal sE');
            expect(nodeSE3.directions(graph, projection)).to.eql([135], 'cardinal southeast');
            expect(nodeSE4.directions(graph, projection)).to.eql([135], 'cardinal souTHEast');

            expect(nodeSSE1.directions(graph, projection)).to.eql([157], 'cardinal sse');
            expect(nodeSSE2.directions(graph, projection)).to.eql([157], 'cardinal SsE');
            expect(nodeSSE3.directions(graph, projection)).to.eql([157], 'cardinal southsoutheast');
            expect(nodeSSE4.directions(graph, projection)).to.eql([157], 'cardinal SouthsouTHEast');

            expect(nodeS1.directions(graph, projection)).to.eql([180], 'cardinal s');
            expect(nodeS2.directions(graph, projection)).to.eql([180], 'cardinal S');
            expect(nodeS3.directions(graph, projection)).to.eql([180], 'cardinal south');
            expect(nodeS4.directions(graph, projection)).to.eql([180], 'cardinal SOuth');

            expect(nodeSSW1.directions(graph, projection)).to.eql([202], 'cardinal ssw');
            expect(nodeSSW2.directions(graph, projection)).to.eql([202], 'cardinal SsW');
            expect(nodeSSW3.directions(graph, projection)).to.eql([202], 'cardinal southsouthwest');
            expect(nodeSSW4.directions(graph, projection)).to.eql([202], 'cardinal SouthsouTHWest');

            expect(nodeSW1.directions(graph, projection)).to.eql([225], 'cardinal sw');
            expect(nodeSW2.directions(graph, projection)).to.eql([225], 'cardinal sW');
            expect(nodeSW3.directions(graph, projection)).to.eql([225], 'cardinal southwest');
            expect(nodeSW4.directions(graph, projection)).to.eql([225], 'cardinal souTHWest');

            expect(nodeWSW1.directions(graph, projection)).to.eql([247], 'cardinal wsw');
            expect(nodeWSW2.directions(graph, projection)).to.eql([247], 'cardinal WsW');
            expect(nodeWSW3.directions(graph, projection)).to.eql([247], 'cardinal westsouthwest');
            expect(nodeWSW4.directions(graph, projection)).to.eql([247], 'cardinal WEstsouTHWest');

            expect(nodeW1.directions(graph, projection)).to.eql([270], 'cardinal w');
            expect(nodeW2.directions(graph, projection)).to.eql([270], 'cardinal W');
            expect(nodeW3.directions(graph, projection)).to.eql([270], 'cardinal west');
            expect(nodeW4.directions(graph, projection)).to.eql([270], 'cardinal WEst');

            expect(nodeWNW1.directions(graph, projection)).to.eql([292], 'cardinal wnw');
            expect(nodeWNW2.directions(graph, projection)).to.eql([292], 'cardinal WnW');
            expect(nodeWNW3.directions(graph, projection)).to.eql([292], 'cardinal westnorthwest');
            expect(nodeWNW4.directions(graph, projection)).to.eql([292], 'cardinal WEstnorTHWest');

            expect(nodeNW1.directions(graph, projection)).to.eql([315], 'cardinal nw');
            expect(nodeNW2.directions(graph, projection)).to.eql([315], 'cardinal nW');
            expect(nodeNW3.directions(graph, projection)).to.eql([315], 'cardinal northwest');
            expect(nodeNW4.directions(graph, projection)).to.eql([315], 'cardinal norTHWest');

            expect(nodeNNW1.directions(graph, projection)).to.eql([337], 'cardinal nnw');
            expect(nodeNNW2.directions(graph, projection)).to.eql([337], 'cardinal NnW');
            expect(nodeNNW3.directions(graph, projection)).to.eql([337], 'cardinal northnorthwest');
            expect(nodeNNW4.directions(graph, projection)).to.eql([337], 'cardinal NOrthnorTHWest');
        });

        it('supports direction=forward', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'direction': 'forward' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.eql([270]);
        });

        it('supports direction=backward', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'direction': 'backward' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.eql([90]);
        });

        it('supports direction=both', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'direction': 'both' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.have.members([90, 270]);
        });

        it('supports direction=all', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'direction': 'all' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.have.members([90, 270]);
        });

        it('supports traffic_signals:direction=forward', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'traffic_signals:direction': 'forward' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.eql([270]);
        });

        it('supports traffic_signals:direction=backward', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'traffic_signals:direction': 'backward' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.eql([90]);
        });

        it('supports traffic_signals:direction=both', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'traffic_signals:direction': 'both' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.have.members([90, 270]);
        });

        it('supports traffic_signals:direction=all', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'traffic_signals:direction': 'all' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.have.members([90, 270]);
        });

        it('supports railway:signal:direction=forward', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'railway:signal:direction': 'forward' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.eql([270]);
        });

        it('supports railway:signal:direction=backward', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'railway:signal:direction': 'backward' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.eql([90]);
        });

        it('supports railway:signal:direction=both', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'railway:signal:direction': 'both' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.have.members([90, 270]);
        });

        it('supports railway:signal:direction=all', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'railway:signal:direction': 'all' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.have.members([90, 270]);
        });

        it('supports camera:direction=forward', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'camera:direction': 'forward' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.eql([270]);
        });

        it('supports camera:direction=backward', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'camera:direction': 'backward' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.eql([90]);
        });

        it('supports camera:direction=both', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'camera:direction': 'both' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.have.members([90, 270]);
        });

        it('supports camera:direction=all', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'camera:direction': 'all' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.have.members([90, 270]);
        });

        it('returns directions for an all-way stop at a highway interstction', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'highway': 'stop', 'stop': 'all' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var node4 = iD.osmNode({ id: 'n4', loc: [0, -1] });
            var node5 = iD.osmNode({ id: 'n5', loc: [0, 1] });
            var way1 = iD.osmWay({ id: 'w1', nodes: ['n1','n2','n3'], tags: { 'highway': 'residential' } });
            var way2 = iD.osmWay({ id: 'w2', nodes: ['n4','n2','n5'], tags: { 'highway': 'residential' } });
            var graph = iD.coreGraph([node1, node2, node3, node4, node5, way1, way2]);
            expect(node2.directions(graph, projection)).to.have.members([0, 90, 180, 270]);
        });

        it('does not return directions for an all-way stop not at a highway interstction', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0], tags: { 'highway': 'stop', 'stop': 'all' } });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0] });
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0], tags: { 'highway': 'stop', 'stop': 'all' } });
            var node4 = iD.osmNode({ id: 'n4', loc: [0, -1], tags: { 'highway': 'stop', 'stop': 'all' } });
            var node5 = iD.osmNode({ id: 'n5', loc: [0, 1], tags: { 'highway': 'stop', 'stop': 'all' } });
            var way1 = iD.osmWay({ id: 'w1', nodes: ['n1','n2','n3'], tags: { 'highway': 'residential' } });
            var way2 = iD.osmWay({ id: 'w2', nodes: ['n4','n2','n5'], tags: { 'highway': 'residential' } });
            var graph = iD.coreGraph([node1, node2, node3, node4, node5, way1, way2]);
            expect(node2.directions(graph, projection)).to.eql([]);
        });

        it('supports multiple directions delimited by ;', function () {
            var node1 = iD.osmNode({ loc: [0, 0], tags: { direction: '0;45' }});
            var node2 = iD.osmNode({ loc: [0, 0], tags: { direction: '45;north' }});
            var node3 = iD.osmNode({ loc: [0, 0], tags: { direction: 'north;east' }});
            var node4 = iD.osmNode({ loc: [0, 0], tags: { direction: 'n;s;e;w' }});
            var node5 = iD.osmNode({ loc: [0, 0], tags: { direction: 's;wat' }});
            var graph = iD.coreGraph([node1, node2, node3, node4, node5]);

            expect(node1.directions(graph, projection)).to.eql([0, 45], 'numeric 0, numeric 45');
            expect(node2.directions(graph, projection)).to.eql([45, 0], 'numeric 45, cardinal north');
            expect(node3.directions(graph, projection)).to.eql([0, 90], 'cardinal north and east');
            expect(node4.directions(graph, projection)).to.eql([0, 180, 90, 270], 'cardinal n,s,e,w');
            expect(node5.directions(graph, projection)).to.eql([180], 'cardinal 180 and nonsense');
        });

        it('supports mixing textual, cardinal, numeric directions, delimited by ;', function () {
            var node1 = iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'camera:direction': 'both;ne;60' }});
            var node3 = iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).to.have.members([90, 270, 45, 60]);
        });

    });

    describe('#asJXON', function () {
        it('converts a node to jxon', function() {
            var node = iD.osmNode({id: 'n-1', loc: [-77, 38], tags: {amenity: 'cafe'}});
            expect(node.asJXON()).to.eql({node: {
                '@id': '-1',
                '@lon': -77,
                '@lat': 38,
                '@version': 0,
                tag: [{keyAttributes: {k: 'amenity', v: 'cafe'}}]}});
        });

        it('includes changeset if provided', function() {
            expect(iD.osmNode({loc: [0, 0]}).asJXON('1234').node['@changeset']).to.equal('1234');
        });
    });

    describe('#asGeoJSON', function () {
        it('converts to a GeoJSON Point geometry', function () {
            var node = iD.osmNode({tags: {amenity: 'cafe'}, loc: [1, 2]}),
                json = node.asGeoJSON();

            expect(json.type).to.equal('Point');
            expect(json.coordinates).to.eql([1, 2]);
        });
    });
});
