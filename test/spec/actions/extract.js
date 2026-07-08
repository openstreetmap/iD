describe('iD.actionExtract', function () {
    var tags = { 'name': 'test' };

    function createTargetNode(id, lonlat) {
        return new iD.osmNode({ id: id, loc: lonlat, tags: tags });
    }

    describe('linear way', function () {
        var graph;
        beforeEach(function () {
            //
            // a -- b -- c -- d
            //
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'a', loc: [0, 0] }),
                new iD.osmNode({ id: 'b', loc: [1, 0] }),
                new iD.osmNode({ id: 'c', loc: [2, 0] }),
                new iD.osmNode({ id: 'd', loc: [3, 0] }),
                new iD.osmWay({ id: '-', nodes: ['a', 'b', 'c', 'd'] })
            ]);
        });

        describe('target in first position', function () {
            beforeEach(function () {
                // Swap target into the location & position of A
                var targetNode = createTargetNode('a', graph.entity('a').loc);
                graph = graph.replace(targetNode);
            });

            it('does not change length of way', function () {
                // Act
                var assertionGraph = iD.actionExtract('a')(graph);

                // Confirm that the way still has 4 nodes
                var target = assertionGraph.entity('-');
                expect(target.nodes.length).toEqual(4);
            });

            it('does not change order of nodes', function () {
                // Act
                var assertionGraph = iD.actionExtract('a')(graph);

                // Confirm that the way is ordered correctly
                var target = assertionGraph.entity('-');
                // Note that we can't be sure of the id of the replacement node
                // so we only assert the nodes we know the ids for
                // As we have already confirmed the size of the array we can assume
                // that the replacement node is in the correct posisiton by a process of elimination
                expect(target.nodes[1]).toEqual('b');
                expect(target.nodes[2]).toEqual('c');
                expect(target.nodes[3]).toEqual('d');
            });

            it('does not change location of nodes', function () {
                // Act
                var assertionGraph = iD.actionExtract('a')(graph);

                // Confirm that the nodes have not moved, including the replacement node
                var nodes = assertionGraph.entity('-').nodes;
                expect(assertionGraph.entity(nodes[0]).loc).toEqual([0, 0]);
                expect(assertionGraph.entity(nodes[1]).loc).toEqual([1, 0]);
                expect(assertionGraph.entity(nodes[2]).loc).toEqual([2, 0]);
                expect(assertionGraph.entity(nodes[3]).loc).toEqual([3, 0]);
            });

            it('does replace target node', function () {
                // Act
                var assertionGraph = iD.actionExtract('a')(graph);

                var nodes = assertionGraph.entity('-').nodes;
                // Confirm that the target is no longer "a"
                expect(nodes[0]).not.toEqual('a');
                // and that the tags are not present
                expect(assertionGraph.entity(nodes[0]).tags).toEqual({});
            });

            it('does detach target node', function () {
                // Act
                var assertionGraph = iD.actionExtract('a')(graph);

                // confirm that a still exists
                var targetNode = assertionGraph.entity('a');
                expect(targetNode).toBeDefined();
                // ... and that the location is correct
                expect(targetNode.loc).toEqual([0, 0]);
                // ... and that the tags are intact
                expect(targetNode.tags).toEqual(tags);
                // ... and that the parentWay is empty
                expect(assertionGraph.parentWays(targetNode)).toEqual([]);
            });
        });

        describe('target in second position', function () {
            beforeEach(function () {
                // Swap target into the location & position of B
                var targetNode = createTargetNode('b', graph.entity('b').loc);
                graph = graph.replace(targetNode);
            });

            it('does not change length of way', function () {
                // Act
                var assertionGraph = iD.actionExtract('b')(graph);

                // Confirm that the way still has 4 nodes
                var target = assertionGraph.entity('-');
                expect(target.nodes.length).toEqual(4);
            });

            it('does not change order of nodes', function () {
                // Act
                var assertionGraph = iD.actionExtract('b')(graph);

                // Confirm that the way is ordered correctly
                var target = assertionGraph.entity('-');
                // Note that we can't be sure of the id of the replacement node
                // so we only assert the nodes we know the ids for
                // As we have already confirmed the size of the array we can assume
                // that the replacement node is in the correct posisiton by a process of elimination
                expect(target.nodes[0]).toEqual('a');
                expect(target.nodes[2]).toEqual('c');
                expect(target.nodes[3]).toEqual('d');
            });

            it('does not change location of nodes', function () {
                // Act
                var assertionGraph = iD.actionExtract('b')(graph);

                // Confirm that the nodes have not moved, including the replacement node
                var nodes = assertionGraph.entity('-').nodes;
                expect(assertionGraph.entity(nodes[0]).loc).toEqual([0, 0]);
                expect(assertionGraph.entity(nodes[1]).loc).toEqual([1, 0]);
                expect(assertionGraph.entity(nodes[2]).loc).toEqual([2, 0]);
                expect(assertionGraph.entity(nodes[3]).loc).toEqual([3, 0]);
            });

            it('does replace target node', function () {
                // Act
                var assertionGraph = iD.actionExtract('b')(graph);

                var nodes = assertionGraph.entity('-').nodes;
                // Confirm that the target is no longer "a"
                expect(nodes[1]).not.toEqual('b');
                // and that the tags are not present
                expect(assertionGraph.entity(nodes[1]).tags).toEqual({});
            });

            it('does detach target node', function () {
                // Act
                var assertionGraph = iD.actionExtract('b')(graph);

                // confirm that a still exists
                var targetNode = assertionGraph.entity('b');
                expect(targetNode).toBeDefined();
                // ... and that the location is correct
                expect(targetNode.loc).toEqual([1, 0]);
                // ... and that the tags are intact
                expect(targetNode.tags).toEqual(tags);
                // ... and that the parentWay is empty
                expect(assertionGraph.parentWays(targetNode)).toEqual([]);
            });
        });
    });


    describe('closed way', function () {
        var graph;
        beforeEach(function () {
            //
            //  d -- c
            //  |    |
            //  a -- b
            //
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'a', loc: [0, 0] }),
                new iD.osmNode({ id: 'b', loc: [1, 0] }),
                new iD.osmNode({ id: 'c', loc: [1, 1] }),
                new iD.osmNode({ id: 'd', loc: [0, 1] }),
                new iD.osmWay({ id: '-', nodes: ['a', 'b', 'c', 'd', 'a'] })
            ]);
        });

        describe('target in first position', function () {
            beforeEach(function () {
                // Swap target into the location & position of A
                var targetNode = createTargetNode('a', graph.entity('a').loc);
                graph = graph.replace(targetNode);
            });

            it('does not change length of way', function () {
                // Act
                var assertionGraph = iD.actionExtract('a')(graph);

                // Confirm that the way still has 5 nodes
                var target = assertionGraph.entity('-');
                expect(target.nodes.length).toEqual(5);
            });

            it('does not change order of nodes', function () {
                // Act
                var assertionGraph = iD.actionExtract('a')(graph);

                // Confirm that the way is ordered correctly
                var target = assertionGraph.entity('-');
                // Note that we can't be sure of the id of the replacement node
                // so we only assert the nodes we know the ids for
                // As we have already confirmed the size of the array we can assume
                // that the replacement node is in the correct posisiton by a process of elimination
                expect(target.nodes[1]).toEqual('b');
                expect(target.nodes[2]).toEqual('c');
                expect(target.nodes[3]).toEqual('d');
                // Need to confirm that the id of the first & last node is the same so that the way remains closed
                expect(target.nodes[0]).toEqual(target.nodes[4]);
            });

            it('does not change location of nodes', function () {
                // Act
                var assertionGraph = iD.actionExtract('a')(graph);

                // Confirm that the nodes have not moved, including the replacement node
                var nodes = assertionGraph.entity('-').nodes;
                expect(assertionGraph.entity(nodes[0]).loc).toEqual([0, 0]);
                expect(assertionGraph.entity(nodes[1]).loc).toEqual([1, 0]);
                expect(assertionGraph.entity(nodes[2]).loc).toEqual([1, 1]);
                expect(assertionGraph.entity(nodes[3]).loc).toEqual([0, 1]);
                // We don't need to assert node[4] location as we've already confirmed that it is the same as node 0
            });

            it('does replace target node', function () {
                // Act
                var assertionGraph = iD.actionExtract('a')(graph);

                var nodes = assertionGraph.entity('-').nodes;
                // Confirm that the target is no longer "a"
                expect(nodes[0]).not.toEqual('a');
                // .. also in the tail position
                expect(nodes[4]).not.toEqual('a');
                // and that the tags are not present (already confirmed same node in position 0 & 4, so only need to check tags once)
                expect(assertionGraph.entity(nodes[0]).tags).toEqual({});
            });

            it('does detach target node', function () {
                // Act
                var assertionGraph = iD.actionExtract('a')(graph);

                // confirm that a still exists
                var targetNode = assertionGraph.entity('a');
                expect(targetNode).toBeDefined();
                // ... and that the location is correct
                expect(targetNode.loc).toEqual([0, 0]);
                // ... and that the tags are intact
                expect(targetNode.tags).toEqual(tags);
                // ... and that the parentWay is empty
                expect(assertionGraph.parentWays(targetNode)).toEqual([]);
            });
        });

        describe('target in second position', function () {
            beforeEach(function () {
                // Swap target into the location & position of B
                var targetNode = createTargetNode('b', graph.entity('b').loc);
                graph = graph.replace(targetNode);
            });

            it('does not change length of way', function () {
                // Act
                var assertionGraph = iD.actionExtract('b')(graph);

                // Confirm that the way still has 5 nodes
                var target = assertionGraph.entity('-');
                expect(target.nodes.length).toEqual(5);
            });

            it('does not change order of nodes', function () {
                // Act
                var assertionGraph = iD.actionExtract('b')(graph);

                // Confirm that the way is ordered correctly
                var target = assertionGraph.entity('-');
                // Note that we can't be sure of the id of the replacement node
                // so we only assert the nodes we know the ids for
                // As we have already confirmed the size of the array we can assume
                // that the replacement node is in the correct posisiton by a process of elimination
                expect(target.nodes[0]).toEqual('a');
                expect(target.nodes[2]).toEqual('c');
                expect(target.nodes[3]).toEqual('d');
                expect(target.nodes[4]).toEqual('a');
            });

            it('does not change location of nodes', function () {
                // Act
                var assertionGraph = iD.actionExtract('b')(graph);

                // Confirm that the nodes have not moved, including the replacement node
                var nodes = assertionGraph.entity('-').nodes;
                expect(assertionGraph.entity(nodes[0]).loc).toEqual([0, 0]);
                expect(assertionGraph.entity(nodes[1]).loc).toEqual([1, 0]);
                expect(assertionGraph.entity(nodes[2]).loc).toEqual([1, 1]);
                expect(assertionGraph.entity(nodes[3]).loc).toEqual([0, 1]);
                // Confirmed already that node[4] is node[0] so no further assertion needed
            });

            it('does replace target node', function () {
                // Act
                var assertionGraph = iD.actionExtract('b')(graph);

                var nodes = assertionGraph.entity('-').nodes;
                // Confirm that the target is no longer "a"
                expect(nodes[1]).not.toEqual('b');
                // and that the tags are not present
                expect(assertionGraph.entity(nodes[1]).tags).toEqual({});
            });

            it('does detach target node', function () {
                // Act
                var assertionGraph = iD.actionExtract('b')(graph);

                // confirm that a still exists
                var targetNode = assertionGraph.entity('b');
                expect(targetNode).toBeDefined();
                // ... and that the location is correct
                expect(targetNode.loc).toEqual([1, 0]);
                // ... and that the tags are intact
                expect(targetNode.tags).toEqual(tags);
                // ... and that the parentWay is empty
                expect(assertionGraph.parentWays(targetNode)).toEqual([]);
            });
        });
    });


    describe('intersecting linear ways', function () {
        var graph;
        beforeEach(function () {
            //
            //           f
            //           ‖
            //           e
            //           ‖
            // a -- b -- c -- d
            //
            // Node c represents the target
            //
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'a', loc: [0, 0] }),
                new iD.osmNode({ id: 'b', loc: [1, 0] }),
                new iD.osmNode({ id: 'c', loc: [2, 0], tags: tags }),
                new iD.osmNode({ id: 'd', loc: [3, 0] }),
                new iD.osmNode({ id: 'e', loc: [2, 1] }),
                new iD.osmNode({ id: 'f', loc: [2, 2] }),
                new iD.osmWay({ id: '-', nodes: ['a', 'b', 'c', 'd'] }),
                new iD.osmWay({ id: '=', nodes: ['c', 'e', 'f'] })
            ]);
        });

        it('does not change length of ways', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);

            // Confirm that the way still has 4 nodes
            var target = assertionGraph.entity('-');
            expect(target.nodes.length).toEqual(4);
            // .. and second way has 3
            target = assertionGraph.entity('=');
            expect(target.nodes.length).toEqual(3);
        });

        it('does not change order of nodes', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);

            // Confirm that the way is ordered correctly
            var target = assertionGraph.entity('-');
            // Note that we can't be sure of the id of the replacement node
            // so we only assert the nodes we know the ids for
            // As we have already confirmed the size of the array we can assume
            // that the replacement node is in the correct posisiton by a process of elimination
            expect(target.nodes[0]).toEqual('a');
            expect(target.nodes[1]).toEqual('b');
            expect(target.nodes[3]).toEqual('d');
            // and second way
            target = assertionGraph.entity('=');
            expect(target.nodes[1]).toEqual('e');
            expect(target.nodes[2]).toEqual('f');
        });

        it('does not change location of nodes', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);

            // Confirm that the nodes have not moved, including the replacement node
            var nodes = assertionGraph.entity('-').nodes;
            expect(assertionGraph.entity(nodes[0]).loc).toEqual([0, 0]);
            expect(assertionGraph.entity(nodes[1]).loc).toEqual([1, 0]);
            expect(assertionGraph.entity(nodes[2]).loc).toEqual([2, 0]);
            expect(assertionGraph.entity(nodes[3]).loc).toEqual([3, 0]);
            // and second way
            nodes = assertionGraph.entity('=').nodes;
            expect(assertionGraph.entity(nodes[0]).loc).toEqual([2, 0]);
            expect(assertionGraph.entity(nodes[1]).loc).toEqual([2, 1]);
            expect(assertionGraph.entity(nodes[2]).loc).toEqual([2, 2]);
        });

        it('uses same replacement node at intersection', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);
            // Confirm both ways have the same replacement node
            expect(assertionGraph.entity('-').nodes[2]).toEqual(assertionGraph.entity('=').nodes[0]);
        });

        it('does replace target node', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);

            var nodes = assertionGraph.entity('-').nodes;
            // Confirm that the target is no longer "c"
            expect(nodes[2]).not.toEqual('c');
            // and that the tags are not present
            expect(assertionGraph.entity(nodes[2]).tags).toEqual({});
            // Confirm that the second way's first node is the same
            expect(assertionGraph.entity('=').nodes[0]).toEqual(nodes[2]);
        });

        it('does detach target node', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);

            // confirm that a still exists
            var targetNode = assertionGraph.entity('c');
            expect(targetNode).toBeDefined();
            // ... and that the location is correct
            expect(targetNode.loc).toEqual([2, 0]);
            // ... and that the tags are intact
            expect(targetNode.tags).toEqual(tags);
            // ... and that the parentWay is empty
            expect(assertionGraph.parentWays(targetNode)).toEqual([]);
        });
    });


    describe('intersecting closed way', function () {
        var graph;
        beforeEach(function () {
            //
            //       g == f
            //       ‖    ‖
            //  d -- c == e
            //  |    |
            //  a -- b
            //
            // c is the target node
            //
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'a', loc: [0, 0] }),
                new iD.osmNode({ id: 'b', loc: [1, 0] }),
                new iD.osmNode({ id: 'c', loc: [1, 1], tags: tags }),
                new iD.osmNode({ id: 'd', loc: [0, 1] }),
                new iD.osmNode({ id: 'e', loc: [2, 1] }),
                new iD.osmNode({ id: 'f', loc: [2, 2] }),
                new iD.osmNode({ id: 'g', loc: [1, 2] }),
                new iD.osmWay({ id: '-', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                new iD.osmWay({ id: '=', nodes: ['c', 'e', 'f', 'g', 'c'] })
            ]);
        });

        it('does not change length of ways', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);

            // Confirm that the way still has 5 nodes
            var target = assertionGraph.entity('-');
            expect(target.nodes.length).toEqual(5);
            // and the second
            target = assertionGraph.entity('=');
            expect(target.nodes.length).toEqual(5);
        });

        it('does not change order of nodes', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);

            // Confirm that the way is ordered correctly
            var target = assertionGraph.entity('-');
            // Note that we can't be sure of the id of the replacement node
            // so we only assert the nodes we know the ids for
            // As we have already confirmed the size of the array we can assume
            // that the replacement node is in the correct posisiton by a process of elimination
            expect(target.nodes[0]).toEqual('a');
            expect(target.nodes[1]).toEqual('b');
            expect(target.nodes[3]).toEqual('d');
            // Need to confirm that the id of the first & last node is the same so that the way remains closed
            expect(target.nodes[0]).toEqual(target.nodes[4]);
            // and the same for the other way
            target = assertionGraph.entity('=');
            expect(target.nodes[1]).toEqual('e');
            expect(target.nodes[2]).toEqual('f');
            expect(target.nodes[3]).toEqual('g');
            expect(target.nodes[0]).toEqual(target.nodes[4]);
        });

        it('does not change location of nodes', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);

            // Confirm that the nodes have not moved, including the replacement node
            var nodes = assertionGraph.entity('-').nodes;
            expect(assertionGraph.entity(nodes[0]).loc).toEqual([0, 0]);
            expect(assertionGraph.entity(nodes[1]).loc).toEqual([1, 0]);
            expect(assertionGraph.entity(nodes[2]).loc).toEqual([1, 1]);
            expect(assertionGraph.entity(nodes[3]).loc).toEqual([0, 1]);
            // We don't need to assert node[4] location as we've already confirmed that it is the same as node 0
            // and the other way
            nodes = assertionGraph.entity('=').nodes;
            expect(assertionGraph.entity(nodes[0]).loc).toEqual([1, 1]);
            expect(assertionGraph.entity(nodes[1]).loc).toEqual([2, 1]);
            expect(assertionGraph.entity(nodes[2]).loc).toEqual([2, 2]);
            expect(assertionGraph.entity(nodes[3]).loc).toEqual([1, 2]);
        });

        it('uses same replacement node at intersection', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);
            // Confirm both ways have the same replacement node
            expect(assertionGraph.entity('-').nodes[2]).toEqual(assertionGraph.entity('=').nodes[0]);
        });

        it('does replace target node', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);

            var nodes = assertionGraph.entity('-').nodes;
            // Confirm that the target is no longer "c"
            expect(nodes[0]).not.toEqual('c');
            // .. also in the tail position
            expect(nodes[4]).not.toEqual('c');
            // and that the tags are not present (already confirmed same node in position 0 & 4, so only need to check tags once)
            expect(assertionGraph.entity(nodes[0]).tags).toEqual({});
            // Don't need to check for way 2 since we've already confirmed it is the same node
        });

        it('does detach target node', function () {
            // Act
            var assertionGraph = iD.actionExtract('c')(graph);

            // confirm that a still exists
            var targetNode = assertionGraph.entity('c');
            expect(targetNode).toBeDefined();
            // ... and that the location is correct
            expect(targetNode.loc).toEqual([1, 1]);
            // ... and that the tags are intact
            expect(targetNode.tags).toEqual(tags);
            // ... and that the parentWay is empty
            expect(assertionGraph.parentWays(targetNode)).toEqual([]);
        });
    });


    describe('with relation', function () {
        var graph;

        beforeEach(function () {
            //
            // a -- b -- c
            //
            // Node b represents the target
            // With a relationship for the way including b
            //
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'a', loc: [0, 0] }),
                new iD.osmNode({ id: 'b', loc: [1, 0], tags: tags }),
                new iD.osmNode({ id: 'c', loc: [2, 0] }),
                new iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] }),
                new iD.osmRelation({id: 'r', tags: {type: 'route', route: 'foot'},
                    members: [
                        { id: 'a', type: 'node', role: 'point' },
                        { id: 'b', type: 'node', role: 'point' },
                        { id: 'c', type: 'node', role: 'point' }
                    ]
                })
            ]);
        });

        it('does not extract relations by default', () => {
            const assertionGraph = iD.actionExtract('b')(graph);

            const targetNode = assertionGraph.entity('b');
            expect(assertionGraph.parentRelations(targetNode).length).toEqual(1);
        });

        it('detached node not a member of relation', function () {
            var assertionGraph = iD.actionExtract('b')(graph, true);

            var targetNode = assertionGraph.entity('b');
            // Confirm is not a member of the relation
            expect(assertionGraph.parentRelations(targetNode).length).toEqual(0);
        });

        it('new node is a member of relation', function () {
            var assertionGraph = iD.actionExtract('b')(graph, true);

            // Find the new node
            var targetWay = assertionGraph.entity('-');
            var newNodeId = targetWay.nodes.filter(function (m) {
                return m !== 'a' && m !== 'b' && m !== 'c';
            })[0];
            var newNode = assertionGraph.entity(newNodeId);

            // Confirm is a member of the relation
            expect(assertionGraph.parentRelations(newNode).length).toEqual(1);
            expect(assertionGraph.parentRelations(newNode)[0].id).toEqual('r');
        });

        it('Relation membership has the same properties', function () {
            var assertionGraph = iD.actionExtract('b')(graph, true);

            // Find the new node
            var targetWay = assertionGraph.entity('-');
            var newNodeId = targetWay.nodes.filter(function (m) {
                return m !== 'a' && m !== 'b' && m !== 'c';
            })[0];

            // Get the relation
            var targetRelation = assertionGraph.entity('r');
            // Find the member
            var targetMember = targetRelation.memberById(newNodeId);

            // Confirm membership is the same as original (except for the new id)
            expect(targetMember).toEqual({ id: newNodeId, index: 1, type: 'node', role: 'point' });
        });

    });
});
