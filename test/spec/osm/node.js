describe('iD.osmNode', function () {
    it('returns a node', function () {
        expect(new iD.osmNode()).toBeInstanceOf(iD.osmNode);
        expect(new iD.osmNode().type).toEqual('node');
    });

    it('defaults tags to an empty object', function () {
        expect(new iD.osmNode().tags).toEqual({});
    });

    it('sets tags as specified', function () {
        expect(new iD.osmNode({tags: {foo: 'bar'}}).tags).toEqual({foo: 'bar'});
    });

    describe('#extent', function() {
        it('returns a point extent', function() {
            expect(new iD.osmNode({loc: [5, 10]}).extent().equals([[5, 10], [5, 10]])).toBeTruthy();
        });
    });

    describe('#intersects', function () {
        it('returns true for a node within the given extent', function () {
            expect(new iD.osmNode({loc: [0, 0]}).intersects([[-5, -5], [5, 5]])).toEqual(true);
        });

        it('returns false for a node outside the given extend', function () {
            expect(new iD.osmNode({loc: [6, 6]}).intersects([[-5, -5], [5, 5]])).toEqual(false);
        });
    });

    describe('#geometry', function () {
        it('returns \'vertex\' if the node is a member of any way', function () {
            var node = new iD.osmNode(),
                way  = new iD.osmWay({nodes: [node.id]}),
                graph = new iD.coreGraph([node, way]);
            expect(node.geometry(graph)).toEqual('vertex');
        });

        it('returns \'point\' if the node is not a member of any way', function () {
            var node = new iD.osmNode(),
                graph = new iD.coreGraph([node]);
            expect(node.geometry(graph)).toEqual('point');
        });
    });

    describe('#isEndpoint', function () {
        it('returns true for a node at an endpoint along a linear way', function () {
            var a = new iD.osmNode({id: 'a'}),
                b = new iD.osmNode({id: 'b'}),
                c = new iD.osmNode({id: 'c'}),
                w = new iD.osmWay({nodes: ['a', 'b', 'c']}),
                graph = new iD.coreGraph([a, b, c, w]);
            expect(a.isEndpoint(graph)).toEqual(true, 'linear way, beginning node');
            expect(b.isEndpoint(graph)).toEqual(false, 'linear way, middle node');
            expect(c.isEndpoint(graph)).toEqual(true, 'linear way, ending node');
        });

        it('returns false for nodes along a circular way', function () {
            var a = new iD.osmNode({id: 'a'}),
                b = new iD.osmNode({id: 'b'}),
                c = new iD.osmNode({id: 'c'}),
                w = new iD.osmWay({nodes: ['a', 'b', 'c', 'a']}),
                graph = new iD.coreGraph([a, b, c, w]);
            expect(a.isEndpoint(graph)).toEqual(false, 'circular way, connector node');
            expect(b.isEndpoint(graph)).toEqual(false, 'circular way, middle node');
            expect(c.isEndpoint(graph)).toEqual(false, 'circular way, ending node');
        });
    });

    describe('#isConnected', function () {
        it('returns true for a node with multiple parent ways, at least one interesting', function () {
            var node = new iD.osmNode(),
                w1 = new iD.osmWay({nodes: [node.id]}),
                w2 = new iD.osmWay({nodes: [node.id], tags: { highway: 'residential' }}),
                graph = new iD.coreGraph([node, w1, w2]);
            expect(node.isConnected(graph)).toEqual(true);
        });

        it('returns false for a node with only area parent ways', function () {
            var node = new iD.osmNode(),
                w1 = new iD.osmWay({nodes: [node.id], tags: { area: 'yes' }}),
                w2 = new iD.osmWay({nodes: [node.id], tags: { area: 'yes' }}),
                graph = new iD.coreGraph([node, w1, w2]);
            expect(node.isConnected(graph)).toEqual(false);
        });

        it('returns false for a node with only uninteresting parent ways', function () {
            var node = new iD.osmNode(),
                w1 = new iD.osmWay({nodes: [node.id]}),
                w2 = new iD.osmWay({nodes: [node.id]}),
                graph = new iD.coreGraph([node, w1, w2]);
            expect(node.isConnected(graph)).toEqual(false);
        });

        it('returns false for a standalone node on a single parent way', function () {
            var node = new iD.osmNode(),
                way = new iD.osmWay({nodes: [node.id]}),
                graph = new iD.coreGraph([node, way]);
            expect(node.isConnected(graph)).toEqual(false);
        });

        it('returns true for a self-intersecting node on a single parent way', function () {
            var a = new iD.osmNode({id: 'a'}),
                b = new iD.osmNode({id: 'b'}),
                c = new iD.osmNode({id: 'c'}),
                w = new iD.osmWay({nodes: ['a', 'b', 'c', 'b']}),
                graph = new iD.coreGraph([a, b, c, w]);
            expect(b.isConnected(graph)).toEqual(true);
        });

        it('returns false for the connecting node of a closed way', function () {
            var a = new iD.osmNode({id: 'a'}),
                b = new iD.osmNode({id: 'b'}),
                c = new iD.osmNode({id: 'c'}),
                w = new iD.osmWay({nodes: ['a', 'b', 'c', 'a']}),
                graph = new iD.coreGraph([a, b, c, w]);
            expect(a.isConnected(graph)).toEqual(false);
        });
    });

    describe('#isIntersection', function () {
        it('returns true for a node shared by more than one highway', function () {
            var node = new iD.osmNode(),
                w1 = new iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                w2 = new iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                graph = new iD.coreGraph([node, w1, w2]);
            expect(node.isIntersection(graph)).toEqual(true);
        });

        it('returns true for a node shared by more than one waterway', function () {
            var node = new iD.osmNode(),
                w1 = new iD.osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                w2 = new iD.osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                graph = new iD.coreGraph([node, w1, w2]);
            expect(node.isIntersection(graph)).toEqual(true);
        });
    });

    describe('#isHighwayIntersection', function () {
        it('returns true for a node shared by more than one highway', function () {
            var node = new iD.osmNode(),
                w1 = new iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                w2 = new iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                graph = new iD.coreGraph([node, w1, w2]);
            expect(node.isHighwayIntersection(graph)).toEqual(true);
        });

        it('returns false for a node shared by more than one waterway', function () {
            var node = new iD.osmNode(),
                w1 = new iD.osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                w2 = new iD.osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                graph = new iD.coreGraph([node, w1, w2]);
            expect(node.isHighwayIntersection(graph)).toEqual(false);
        });
    });

    describe('#isDegenerate', function () {
        it('returns true if node has invalid loc', function () {
            expect(new iD.osmNode().isDegenerate(), 'no loc').toBe(true);
            expect(new iD.osmNode({loc: ''}).isDegenerate(), 'empty string loc').toBe(true);
            expect(new iD.osmNode({loc: []}).isDegenerate(), 'empty array loc').toBe(true);
            expect(new iD.osmNode({loc: [0]}).isDegenerate(), '1-array loc').toBe(true);
            expect(new iD.osmNode({loc: [0, 0, 0]}).isDegenerate(), '3-array loc').toBe(true);
            expect(new iD.osmNode({loc: [-181, 0]}).isDegenerate(), '< min lon').toBe(true);
            expect(new iD.osmNode({loc: [181, 0]}).isDegenerate(), '> max lon').toBe(true);
            expect(new iD.osmNode({loc: [0, -91]}).isDegenerate(), '< min lat').toBe(true);
            expect(new iD.osmNode({loc: [0, 91]}).isDegenerate(), '> max lat').toBe(true);
            expect(new iD.osmNode({loc: [Infinity, 0]}).isDegenerate(), 'Infinity lon').toBe(true);
            expect(new iD.osmNode({loc: [0, Infinity]}).isDegenerate(), 'Infinity lat').toBe(true);
            expect(new iD.osmNode({loc: [NaN, 0]}).isDegenerate(), 'NaN lon').toBe(true);
            expect(new iD.osmNode({loc: [0, NaN]}).isDegenerate(), 'NaN lat').toBe(true);
        });

        it('returns false if node has valid loc', function () {
            expect(new iD.osmNode({loc: [0, 0]}).isDegenerate(), '2-array loc').toBe(false);
            expect(new iD.osmNode({loc: [-180, 0]}).isDegenerate(), 'min lon').toBe(false);
            expect(new iD.osmNode({loc: [180, 0]}).isDegenerate(), 'max lon').toBe(false);
            expect(new iD.osmNode({loc: [0, -90]}).isDegenerate(), 'min lat').toBe(false);
            expect(new iD.osmNode({loc: [0, 90]}).isDegenerate(), 'max lat').toBe(false);
        });
    });

    describe('#directions', function () {
        var projection = function (_) { return _; };
        it('returns empty array if no direction tag', function () {
            var node1 = new iD.osmNode({ loc: [0, 0], tags: {}});
            var graph = new iD.coreGraph([node1]);
            expect(node1.directions(graph, projection)).toEqual([], 'no direction tag');
        });

        it('returns empty array if nonsense direction tag', function () {
            var node1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'blah' }});
            var node2 = new iD.osmNode({ loc: [0, 0], tags: { direction: '' }});
            var node3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'NaN' }});
            var node4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'eastwest' }});
            var graph = new iD.coreGraph([node1, node2, node3, node4]);

            expect(node1.directions(graph, projection)).toEqual([], 'nonsense direction tag');
            expect(node2.directions(graph, projection)).toEqual([], 'empty string direction tag');
            expect(node3.directions(graph, projection)).toEqual([], 'NaN direction tag');
            expect(node4.directions(graph, projection)).toEqual([], 'eastwest direction tag');
        });

        it('supports numeric direction tag', function () {
            var node1 = new iD.osmNode({ loc: [0, 0], tags: { direction: '0' }});
            var node2 = new iD.osmNode({ loc: [0, 0], tags: { direction: '45' }});
            var node3 = new iD.osmNode({ loc: [0, 0], tags: { direction: '-45' }});
            var node4 = new iD.osmNode({ loc: [0, 0], tags: { direction: '360' }});
            var node5 = new iD.osmNode({ loc: [0, 0], tags: { direction: '1000' }});
            var graph = new iD.coreGraph([node1, node2, node3, node4, node5]);

            expect(node1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 0 }], 'numeric 0');
            expect(node2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 45 }], 'numeric 45');
            expect(node3.directions(graph, projection)).toEqual([{ type: 'direction', angle: -45 }], 'numeric -45');
            expect(node4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 360 }], 'numeric 360');
            expect(node5.directions(graph, projection)).toEqual([{ type: 'direction', angle: 1000 }], 'numeric 1000');
        });

        it('supports cardinal direction tags (test abbreviated and mixed case)', function () {
            var nodeN1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'n' }});
            var nodeN2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'N' }});
            var nodeN3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'north' }});
            var nodeN4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'NOrth' }});

            var nodeNNE1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'nne' }});
            var nodeNNE2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'NnE' }});
            var nodeNNE3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'northnortheast' }});
            var nodeNNE4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'NOrthnorTHEast' }});

            var nodeNE1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'ne' }});
            var nodeNE2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'nE' }});
            var nodeNE3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'northeast' }});
            var nodeNE4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'norTHEast' }});

            var nodeENE1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'ene' }});
            var nodeENE2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'EnE' }});
            var nodeENE3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'eastnortheast' }});
            var nodeENE4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'EAstnorTHEast' }});

            var nodeE1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'e' }});
            var nodeE2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'E' }});
            var nodeE3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'east' }});
            var nodeE4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'EAst' }});

            var nodeESE1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'ese' }});
            var nodeESE2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'EsE' }});
            var nodeESE3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'eastsoutheast' }});
            var nodeESE4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'EAstsouTHEast' }});

            var nodeSE1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'se' }});
            var nodeSE2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'sE' }});
            var nodeSE3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'southeast' }});
            var nodeSE4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'souTHEast' }});

            var nodeSSE1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'sse' }});
            var nodeSSE2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'SsE' }});
            var nodeSSE3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'southsoutheast' }});
            var nodeSSE4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'SOuthsouTHEast' }});

            var nodeS1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 's' }});
            var nodeS2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'S' }});
            var nodeS3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'south' }});
            var nodeS4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'SOuth' }});

            var nodeSSW1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'ssw' }});
            var nodeSSW2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'SsW' }});
            var nodeSSW3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'southsouthwest' }});
            var nodeSSW4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'SOuthsouTHWest' }});

            var nodeSW1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'sw' }});
            var nodeSW2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'sW' }});
            var nodeSW3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'southwest' }});
            var nodeSW4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'souTHWest' }});

            var nodeWSW1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'wsw' }});
            var nodeWSW2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'WsW' }});
            var nodeWSW3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'westsouthwest' }});
            var nodeWSW4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'WEstsouTHWest' }});

            var nodeW1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'w' }});
            var nodeW2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'W' }});
            var nodeW3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'west' }});
            var nodeW4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'WEst' }});

            var nodeWNW1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'wnw' }});
            var nodeWNW2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'WnW' }});
            var nodeWNW3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'westnorthwest' }});
            var nodeWNW4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'WEstnorTHWest' }});

            var nodeNW1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'nw' }});
            var nodeNW2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'nW' }});
            var nodeNW3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'northwest' }});
            var nodeNW4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'norTHWest' }});

            var nodeNNW1 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'nnw' }});
            var nodeNNW2 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'NnW' }});
            var nodeNNW3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'northnorthwest' }});
            var nodeNNW4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'NOrthnorTHWest' }});

            var graph = new iD.coreGraph([
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

            expect(nodeN1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 0 }], 'cardinal n');
            expect(nodeN2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 0 }], 'cardinal N');
            expect(nodeN3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 0 }], 'cardinal north');
            expect(nodeN4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 0 }], 'cardinal NOrth');

            expect(nodeNNE1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 22 }], 'cardinal nne');
            expect(nodeNNE2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 22 }], 'cardinal NnE');
            expect(nodeNNE3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 22 }], 'cardinal northnortheast');
            expect(nodeNNE4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 22 }], 'cardinal NOrthnorTHEast');

            expect(nodeNE1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 45 }], 'cardinal ne');
            expect(nodeNE2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 45 }], 'cardinal nE');
            expect(nodeNE3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 45 }], 'cardinal northeast');
            expect(nodeNE4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 45 }], 'cardinal norTHEast');

            expect(nodeENE1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 67 }], 'cardinal ene');
            expect(nodeENE2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 67 }], 'cardinal EnE');
            expect(nodeENE3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 67 }], 'cardinal eastnortheast');
            expect(nodeENE4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 67 }], 'cardinal EAstnorTHEast');

            expect(nodeE1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 90 }], 'cardinal e');
            expect(nodeE2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 90 }], 'cardinal E');
            expect(nodeE3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 90 }], 'cardinal east');
            expect(nodeE4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 90 }], 'cardinal EAst');

            expect(nodeESE1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 112 }], 'cardinal ese');
            expect(nodeESE2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 112 }], 'cardinal EsE');
            expect(nodeESE3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 112 }], 'cardinal eastsoutheast');
            expect(nodeESE4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 112 }], 'cardinal EAstsouTHEast');

            expect(nodeSE1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 135 }], 'cardinal se');
            expect(nodeSE2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 135 }], 'cardinal sE');
            expect(nodeSE3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 135 }], 'cardinal southeast');
            expect(nodeSE4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 135 }], 'cardinal souTHEast');

            expect(nodeSSE1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 157 }], 'cardinal sse');
            expect(nodeSSE2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 157 }], 'cardinal SsE');
            expect(nodeSSE3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 157 }], 'cardinal southsoutheast');
            expect(nodeSSE4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 157 }], 'cardinal SouthsouTHEast');

            expect(nodeS1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 180 }], 'cardinal s');
            expect(nodeS2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 180 }], 'cardinal S');
            expect(nodeS3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 180 }], 'cardinal south');
            expect(nodeS4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 180 }], 'cardinal SOuth');

            expect(nodeSSW1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 202 }], 'cardinal ssw');
            expect(nodeSSW2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 202 }], 'cardinal SsW');
            expect(nodeSSW3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 202 }], 'cardinal southsouthwest');
            expect(nodeSSW4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 202 }], 'cardinal SouthsouTHWest');

            expect(nodeSW1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 225 }], 'cardinal sw');
            expect(nodeSW2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 225 }], 'cardinal sW');
            expect(nodeSW3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 225 }], 'cardinal southwest');
            expect(nodeSW4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 225 }], 'cardinal souTHWest');

            expect(nodeWSW1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 247 }], 'cardinal wsw');
            expect(nodeWSW2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 247 }], 'cardinal WsW');
            expect(nodeWSW3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 247 }], 'cardinal westsouthwest');
            expect(nodeWSW4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 247 }], 'cardinal WEstsouTHWest');

            expect(nodeW1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 270 }], 'cardinal w');
            expect(nodeW2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 270 }], 'cardinal W');
            expect(nodeW3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 270 }], 'cardinal west');
            expect(nodeW4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 270 }], 'cardinal WEst');

            expect(nodeWNW1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 292 }], 'cardinal wnw');
            expect(nodeWNW2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 292 }], 'cardinal WnW');
            expect(nodeWNW3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 292 }], 'cardinal westnorthwest');
            expect(nodeWNW4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 292 }], 'cardinal WEstnorTHWest');

            expect(nodeNW1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 315 }], 'cardinal nw');
            expect(nodeNW2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 315 }], 'cardinal nW');
            expect(nodeNW3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 315 }], 'cardinal northwest');
            expect(nodeNW4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 315 }], 'cardinal norTHWest');

            expect(nodeNNW1.directions(graph, projection)).toEqual([{ type: 'direction', angle: 337 }], 'cardinal nnw');
            expect(nodeNNW2.directions(graph, projection)).toEqual([{ type: 'direction', angle: 337 }], 'cardinal NnW');
            expect(nodeNNW3.directions(graph, projection)).toEqual([{ type: 'direction', angle: 337 }], 'cardinal northnorthwest');
            expect(nodeNNW4.directions(graph, projection)).toEqual([{ type: 'direction', angle: 337 }], 'cardinal NOrthnorTHWest');
        });

        it('supports direction=forward', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'direction': 'forward' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 }
            ]);
        });

        it('supports direction=backward', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'direction': 'backward' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 90 }
            ]);
        });

        it('supports direction=both', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'direction': 'both' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
                { type: 'direction', angle: 90 },
            ]);
        });

        it('supports direction=all', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'direction': 'all' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
                { type: 'direction', angle: 90 },
            ]);
        });

        it('supports traffic_signals:direction=forward', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'traffic_signals:direction': 'forward' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
            ]);
        });

        it('supports traffic_signals:direction=backward', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'traffic_signals:direction': 'backward' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 90 },
            ]);
        });

        it('supports traffic_signals:direction=both', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'traffic_signals:direction': 'both' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
                { type: 'direction', angle: 90 },
            ]);
        });

        it('supports traffic_signals:direction=all', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'traffic_signals:direction': 'all' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
                { type: 'direction', angle: 90 },
            ]);
        });

        it('supports railway:signal:direction=forward', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'railway:signal:direction': 'forward' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
            ]);
        });

        it('supports railway:signal:direction=backward', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'railway:signal:direction': 'backward' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 90 },
            ]);
        });

        it('supports railway:signal:direction=both', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'railway:signal:direction': 'both' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
                { type: 'direction', angle: 90 },
            ]);
        });

        it('supports railway:signal:direction=all', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'railway:signal:direction': 'all' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
                { type: 'direction', angle: 90 },
            ]);
        });

        it('supports camera:direction=forward', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'camera:direction': 'forward' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
            ]);
        });

        it('supports camera:direction=backward', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'camera:direction': 'backward' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 90 },
            ]);
        });

        it('supports camera:direction=both', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'camera:direction': 'both' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
                { type: 'direction', angle: 90 },
            ]);
        });

        it('supports camera:direction=all', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'camera:direction': 'all' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
                { type: 'direction', angle: 90 },
            ]);
        });

        it('returns directions for an all-way stop at a highway intersection', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'highway': 'stop', 'stop': 'all' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var node4 = new iD.osmNode({ id: 'n4', loc: [0, -1] });
            var node5 = new iD.osmNode({ id: 'n5', loc: [0, 1] });
            var way1 = new iD.osmWay({ id: 'w1', nodes: ['n1','n2','n3'], tags: { 'highway': 'residential' } });
            var way2 = new iD.osmWay({ id: 'w2', nodes: ['n4','n2','n5'], tags: { 'highway': 'residential' } });
            var graph = new iD.coreGraph([node1, node2, node3, node4, node5, way1, way2]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
                { type: 'direction', angle: 90 },
                { type: 'direction', angle: 0 },
                { type: 'direction', angle: 180 },
            ]);
        });

        it('does not return directions for an all-way stop not at a highway intersection', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0], tags: { 'highway': 'stop', 'stop': 'all' } });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0] });
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0], tags: { 'highway': 'stop', 'stop': 'all' } });
            var node4 = new iD.osmNode({ id: 'n4', loc: [0, -1], tags: { 'highway': 'stop', 'stop': 'all' } });
            var node5 = new iD.osmNode({ id: 'n5', loc: [0, 1], tags: { 'highway': 'stop', 'stop': 'all' } });
            var way1 = new iD.osmWay({ id: 'w1', nodes: ['n1','n2','n3'], tags: { 'highway': 'residential' } });
            var way2 = new iD.osmWay({ id: 'w2', nodes: ['n4','n2','n5'], tags: { 'highway': 'residential' } });
            var graph = new iD.coreGraph([node1, node2, node3, node4, node5, way1, way2]);
            expect(node2.directions(graph, projection)).toEqual([]);
        });

        it('supports multiple directions delimited by ;', function () {
            var node1 = new iD.osmNode({ loc: [0, 0], tags: { direction: '0;45' }});
            var node2 = new iD.osmNode({ loc: [0, 0], tags: { direction: '45;north' }});
            var node3 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'north;east' }});
            var node4 = new iD.osmNode({ loc: [0, 0], tags: { direction: 'n;s;e;w' }});
            var node5 = new iD.osmNode({ loc: [0, 0], tags: { direction: 's;wat' }});
            var graph = new iD.coreGraph([node1, node2, node3, node4, node5]);

            expect(node1.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 0 },
                { type: 'direction', angle: 45 },
            ], 'numeric 0, numeric 45');
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 45 },
                { type: 'direction', angle: 0 },
            ], 'numeric 45, cardinal north');
            expect(node3.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 0 },
                { type: 'direction', angle: 90 },
            ], 'cardinal north and east');
            expect(node4.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 0 },
                { type: 'direction', angle: 180 },
                { type: 'direction', angle: 90 },
                { type: 'direction', angle: 270 },
            ], 'cardinal n,s,e,w');
            expect(node5.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 180 },
            ], 'cardinal 180 and nonsense');
        });

        it('supports mixing textual, cardinal, numeric directions, delimited by ;', function () {
            var node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
            var node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { 'camera:direction': 'both;ne;60' }});
            var node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
            var way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
            var graph = new iD.coreGraph([node1, node2, node3, way]);
            expect(node2.directions(graph, projection)).toEqual([
                { type: 'direction', angle: 270 },
                { type: 'direction', angle: 90 },
                { type: 'direction', angle: 45 },
                { type: 'direction', angle: 60 },
            ]);
        });

        describe('side', () => {
            it('supports side=left', () => {
                const node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
                const node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { side: 'left' } });
                const node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
                const way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
                var graph = new iD.coreGraph([node1, node2, node3, way]);
                expect(node2.directions(graph, projection)).toEqual([
                    { type: 'side', angle: 0 },
                ]);
            });

            it('supports side=rigHt', () => {
                const node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
                const node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { side: 'rigHt' } });
                const node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
                const way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
                const graph = new iD.coreGraph([node1, node2, node3, way]);
                expect(node2.directions(graph, projection)).toEqual([
                    { type: 'side', angle: 180 },
                ]);
            });

            it('supports side=both', () => {
                const node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
                const node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { side: 'both' } });
                const node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
                const way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
                const graph = new iD.coreGraph([node1, node2, node3, way]);
                expect(node2.directions(graph, projection)).toEqual([
                    { type: 'side', angle: 180 },
                    { type: 'side', angle: 0 },
                ]);
            });

            const invalidPairs = [
                ['direction', 'left'],
                ['direction', 'right'],
                ['side', 'forward'],
                ['side', 'backward'],
                ['side', 'northwest'],
                ['side', '45'],
            ];
            for (const [key, value] of invalidPairs) {
                it(`ignores ${key}=${value} since it's invalid`, () => {
                    const node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
                    const node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { [key]: value } });
                    const node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
                    const way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
                    const graph = new iD.coreGraph([node1, node2, node3, way]);
                    expect(node2.directions(graph, projection)).toEqual([]);
                });
            }

            it('supports a mix of direction=* and side=*', () => {
                const node1 = new iD.osmNode({ id: 'n1', loc: [-1, 0] });
                const node2 = new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { side: 'left', direction: 'forward;ne;91' } });
                const node3 = new iD.osmNode({ id: 'n3', loc: [1, 0] });
                const way = new iD.osmWay({ nodes: ['n1','n2','n3'] });
                const graph = new iD.coreGraph([node1, node2, node3, way]);
                expect(node2.directions(graph, projection)).toEqual([
                    { type: 'side', angle: 0 },
                    { type: 'direction', angle: 270 },
                    { type: 'direction', angle: 45 },
                    { type: 'direction', angle: 91 },
                ]);
            });

            it('supports railway:turnout_side=right', () => {
                const node1 = new iD.osmNode({ id: 'n1', loc: [-1, -1] });
                const node2 = new iD.osmNode({ id: 'n2', loc: [-1, 0] });
                const node3 = new iD.osmNode({ id: 'n3', loc: [0, 0], tags: { 'railway:turnout_side': 'right' } });
                const node4 = new iD.osmNode({ id: 'n4', loc: [1, 0] });
                const way1 = new iD.osmWay({ id: 'w1', nodes: ['n1','n3'], tags: { 'railway': 'rail' } });
                const way2 = new iD.osmWay({ id: 'w2', nodes: ['n2','n3','n4'], tags: { 'railway': 'rail' } });
                const graph = new iD.coreGraph([node1, node2, node3, node4, way1, way2]);
                expect(node3.directions(graph, projection)).toEqual([
                    { type: 'side', angle: 0 },
                ]);
            });

            it('supports railway:turnout_side=left', () => {
                const node1 = new iD.osmNode({ id: 'n1', loc: [-1, -1] });
                const node2 = new iD.osmNode({ id: 'n2', loc: [-1, 0] });
                const node3 = new iD.osmNode({ id: 'n3', loc: [0, 0], tags: { 'railway:turnout_side': 'left' } });
                const node4 = new iD.osmNode({ id: 'n4', loc: [1, 0] });
                const way1 = new iD.osmWay({ id: 'w1', nodes: ['n1','n3'], tags: { 'railway': 'rail' } });
                const way2 = new iD.osmWay({ id: 'w2', nodes: ['n2','n3','n4'], tags: { 'railway': 'rail' } });
                const graph = new iD.coreGraph([node1, node2, node3, node4, way1, way2]);
                expect(node3.directions(graph, projection)).toEqual([
                    { type: 'side', angle: 180 },
                ]);
            });
        });

    });

    describe('#asJXON', function () {
        it('converts a node to jxon', function() {
            var node = new iD.osmNode({id: 'n-1', loc: [-77, 38], tags: {amenity: 'cafe'}});
            expect(node.asJXON()).toEqual({node: {
                '@id': '-1',
                '@lon': -77,
                '@lat': 38,
                '@version': 0,
                tag: [{keyAttributes: {k: 'amenity', v: 'cafe'}}]}});
        });

        it('includes changeset if provided', function() {
            expect(new iD.osmNode({loc: [0, 0]}).asJXON('1234').node['@changeset']).toEqual('1234');
        });
    });

    describe('#asGeoJSON', function () {
        it('converts to a GeoJSON Point geometry', function () {
            var node = new iD.osmNode({tags: {amenity: 'cafe'}, loc: [1, 2]}),
                json = node.asGeoJSON();

            expect(json.type).toEqual('Point');
            expect(json.coordinates).toEqual([1, 2]);
        });
    });
});
