describe('iD.actionDetachNode', function () {
    var tags = { 'name': 'test' };
    function createTargetNode(id, lonlat) {
        return iD.Node({ id: id, loc: lonlat, tags: tags });
    }
    describe('simple way', function () {
        var graph;
        beforeEach(function () {
            // Set up a simple way
            // a-b-c-d
            // (0,0)-(1,0)-(2,0)-(3,0)
            graph = iD.Graph([
                iD.Node({ id: 'a', loc: [0, 0] }),
                iD.Node({ id: 'b', loc: [1, 0] }),
                iD.Node({ id: 'c', loc: [2, 0] }),
                iD.Node({ id: 'd', loc: [3, 0] }),
                iD.Way({ id: 'w', nodes: ['a', 'b', 'c', 'd'] })
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
                var assertionGraph = iD.actionDetachNode('a')(graph);

                // Confirm that the way still has 4 nodes
                var target = assertionGraph.entity('w');
                expect(target.nodes.length).to.eql(4);
            });

            it('does not change order of nodes', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('a')(graph);

                // Confirm that the way is ordered correctly
                var target = assertionGraph.entity('w');
                // Note that we can't be sure of the id of the replacement node
                // so we only assert the nodes we know the ids for
                // As we have already confirmed the size of the array we can assume
                // that the replacement node is in the correct posisiton by a process of elimination                
                expect(target.nodes[1]).to.eql('b');
                expect(target.nodes[2]).to.eql('c');
                expect(target.nodes[3]).to.eql('d');
            });

            it('does not change location of nodes', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('a')(graph);

                // Confirm that the nodes have not moved, including the replacement node
                var nodes = assertionGraph.entity('w').nodes;
                expect(assertionGraph.entity(nodes[0]).loc).to.eql([0, 0]);
                expect(assertionGraph.entity(nodes[1]).loc).to.eql([1, 0]);
                expect(assertionGraph.entity(nodes[2]).loc).to.eql([2, 0]);
                expect(assertionGraph.entity(nodes[3]).loc).to.eql([3, 0]);
            });

            it('does replace target node', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('a')(graph);

                var nodes = assertionGraph.entity('w').nodes;
                // Confirm that the target is no longer "a"
                expect(nodes[0]).not.to.eql('a');
                // and that the tags are not present
                expect(assertionGraph.entity(nodes[0]).tags).to.eql({});
            });

            it('does detach target node', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('a')(graph);

                // confirm that a still exists
                var targetNode = assertionGraph.entity('a');
                expect(targetNode).not.to.eql(undefined);
                // ... and that the location is correct
                expect(targetNode.loc).to.eql([0, 0]);
                // ... and that the tags are intact
                expect(targetNode.tags).to.eql(tags);
                // ... and that the parentWay is empty
                expect(assertionGraph.parentWays(targetNode)).to.eql([]);
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
                var assertionGraph = iD.actionDetachNode('b')(graph);

                // Confirm that the way still has 4 nodes
                var target = assertionGraph.entity('w');
                expect(target.nodes.length).to.eql(4);
            });

            it('does not change order of nodes', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('b')(graph);

                // Confirm that the way is ordered correctly
                var target = assertionGraph.entity('w');
                // Note that we can't be sure of the id of the replacement node
                // so we only assert the nodes we know the ids for
                // As we have already confirmed the size of the array we can assume
                // that the replacement node is in the correct posisiton by a process of elimination                
                expect(target.nodes[0]).to.eql('a');
                expect(target.nodes[2]).to.eql('c');
                expect(target.nodes[3]).to.eql('d');
            });

            it('does not change location of nodes', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('b')(graph);

                // Confirm that the nodes have not moved, including the replacement node
                var nodes = assertionGraph.entity('w').nodes;
                expect(assertionGraph.entity(nodes[0]).loc).to.eql([0, 0]);
                expect(assertionGraph.entity(nodes[1]).loc).to.eql([1, 0]);
                expect(assertionGraph.entity(nodes[2]).loc).to.eql([2, 0]);
                expect(assertionGraph.entity(nodes[3]).loc).to.eql([3, 0]);
            });

            it('does replace target node', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('b')(graph);

                var nodes = assertionGraph.entity('w').nodes;
                // Confirm that the target is no longer "a"
                expect(nodes[1]).not.to.eql('b');
                // and that the tags are not present
                expect(assertionGraph.entity(nodes[1]).tags).to.eql({});
            });

            it('does detach target node', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('b')(graph);

                // confirm that a still exists
                var targetNode = assertionGraph.entity('b');
                expect(targetNode).not.to.eql(undefined);
                // ... and that the location is correct
                expect(targetNode.loc).to.eql([1, 0]);
                // ... and that the tags are intact
                expect(targetNode.tags).to.eql(tags);
                // ... and that the parentWay is empty
                expect(assertionGraph.parentWays(targetNode)).to.eql([]);
            });
        });
    });
    describe('closed way', function () {
        var graph;
        beforeEach(function () {
            // Set up a closed way
            // a-b (0,0)-(1,0)
            // | |
            // d-c (0,1)-(1,1)
            graph = iD.Graph([
                iD.Node({ id: 'a', loc: [0, 0] }),
                iD.Node({ id: 'b', loc: [1, 0] }),
                iD.Node({ id: 'c', loc: [1, 1] }),
                iD.Node({ id: 'd', loc: [0, 1] }),
                iD.Way({ id: 'w', nodes: ['a', 'b', 'c', 'd', 'a'] })
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
                var assertionGraph = iD.actionDetachNode('a')(graph);

                // Confirm that the way still has 5 nodes
                var target = assertionGraph.entity('w');
                expect(target.nodes.length).to.eql(5);
            });

            it('does not change order of nodes', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('a')(graph);

                // Confirm that the way is ordered correctly
                var target = assertionGraph.entity('w');
                // Note that we can't be sure of the id of the replacement node
                // so we only assert the nodes we know the ids for
                // As we have already confirmed the size of the array we can assume
                // that the replacement node is in the correct posisiton by a process of elimination                
                expect(target.nodes[1]).to.eql('b');
                expect(target.nodes[2]).to.eql('c');
                expect(target.nodes[3]).to.eql('d');
                // Need to confirm that the id of the first & last node is the same so that the way remains closed
                expect(target.nodes[0]).to.eql(target.nodes[4]);
            });

            it('does not change location of nodes', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('a')(graph);

                // Confirm that the nodes have not moved, including the replacement node
                var nodes = assertionGraph.entity('w').nodes;
                expect(assertionGraph.entity(nodes[0]).loc).to.eql([0, 0]);
                expect(assertionGraph.entity(nodes[1]).loc).to.eql([1, 0]);
                expect(assertionGraph.entity(nodes[2]).loc).to.eql([1, 1]);
                expect(assertionGraph.entity(nodes[3]).loc).to.eql([0, 1]);
                // We don't need to assert node[4] location as we've already confirmed that it is the same as node 0
            });

            it('does replace target node', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('a')(graph);

                var nodes = assertionGraph.entity('w').nodes;
                // Confirm that the target is no longer "a"
                expect(nodes[0]).not.to.eql('a');
                // .. also in the tail position
                expect(nodes[4]).not.to.eql('a');
                // and that the tags are not present (already confirmed same node in position 0 & 4, so only need to check tags once)
                expect(assertionGraph.entity(nodes[0]).tags).to.eql({});
            });

            it('does detach target node', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('a')(graph);

                // confirm that a still exists
                var targetNode = assertionGraph.entity('a');
                expect(targetNode).not.to.eql(undefined);
                // ... and that the location is correct
                expect(targetNode.loc).to.eql([0, 0]);
                // ... and that the tags are intact
                expect(targetNode.tags).to.eql(tags);
                // ... and that the parentWay is empty
                expect(assertionGraph.parentWays(targetNode)).to.eql([]);
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
                var assertionGraph = iD.actionDetachNode('b')(graph);

                // Confirm that the way still has 5 nodes
                var target = assertionGraph.entity('w');
                expect(target.nodes.length).to.eql(5);
            });

            it('does not change order of nodes', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('b')(graph);

                // Confirm that the way is ordered correctly
                var target = assertionGraph.entity('w');
                // Note that we can't be sure of the id of the replacement node
                // so we only assert the nodes we know the ids for
                // As we have already confirmed the size of the array we can assume
                // that the replacement node is in the correct posisiton by a process of elimination                
                expect(target.nodes[0]).to.eql('a');
                expect(target.nodes[2]).to.eql('c');
                expect(target.nodes[3]).to.eql('d');
                expect(target.nodes[4]).to.eql('a');
            });

            it('does not change location of nodes', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('b')(graph);

                // Confirm that the nodes have not moved, including the replacement node
                var nodes = assertionGraph.entity('w').nodes;
                expect(assertionGraph.entity(nodes[0]).loc).to.eql([0, 0]);
                expect(assertionGraph.entity(nodes[1]).loc).to.eql([1, 0]);
                expect(assertionGraph.entity(nodes[2]).loc).to.eql([1, 1]);
                expect(assertionGraph.entity(nodes[3]).loc).to.eql([0, 1]);
                // Confirmed already that node[4] is node[0] so no further assertion needed
            });

            it('does replace target node', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('b')(graph);

                var nodes = assertionGraph.entity('w').nodes;
                // Confirm that the target is no longer "a"
                expect(nodes[1]).not.to.eql('b');
                // and that the tags are not present
                expect(assertionGraph.entity(nodes[1]).tags).to.eql({});
            });

            it('does detach target node', function () {
                // Act
                var assertionGraph = iD.actionDetachNode('b')(graph);

                // confirm that a still exists
                var targetNode = assertionGraph.entity('b');
                expect(targetNode).not.to.eql(undefined);
                // ... and that the location is correct
                expect(targetNode.loc).to.eql([1, 0]);
                // ... and that the tags are intact
                expect(targetNode.tags).to.eql(tags);
                // ... and that the parentWay is empty
                expect(assertionGraph.parentWays(targetNode)).to.eql([]);
            });
        });
    });
    describe('intersecting simple ways', function () {
        var graph;
        beforeEach(function () {
            // Set up two simple ways
            // a-b-c-d  (0,0)-(1,0)-(2,0)-(3,0)
            //     e  (2,1)
            //     f  (2,2)
            // Node c represents the target
            graph = iD.Graph([
                iD.Node({ id: 'a', loc: [0, 0] }),
                iD.Node({ id: 'b', loc: [1, 0] }),
                iD.Node({ id: 'c', loc: [2, 0], tags: tags }),
                iD.Node({ id: 'd', loc: [3, 0] }),
                iD.Node({ id: 'e', loc: [2, 1] }),
                iD.Node({ id: 'f', loc: [2, 2] }),
                iD.Way({ id: 'w', nodes: ['a', 'b', 'c', 'd'] }),
                iD.Way({ id: 'x', nodes: ['c', 'e', 'f'] })
            ]);
        });

        it('does not change length of ways', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);

            // Confirm that the way still has 4 nodes
            var target = assertionGraph.entity('w');
            expect(target.nodes.length).to.eql(4);
            // .. and second way has 3
            target = assertionGraph.entity('x');
            expect(target.nodes.length).to.eql(3);
        });

        it('does not change order of nodes', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);

            // Confirm that the way is ordered correctly
            var target = assertionGraph.entity('w');
            // Note that we can't be sure of the id of the replacement node
            // so we only assert the nodes we know the ids for
            // As we have already confirmed the size of the array we can assume
            // that the replacement node is in the correct posisiton by a process of elimination                
            expect(target.nodes[0]).to.eql('a');
            expect(target.nodes[1]).to.eql('b');
            expect(target.nodes[3]).to.eql('d');
            // and second way
            target = assertionGraph.entity('x');
            expect(target.nodes[1]).to.eql('e');
            expect(target.nodes[2]).to.eql('f');
        });

        it('does not change location of nodes', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);

            // Confirm that the nodes have not moved, including the replacement node
            var nodes = assertionGraph.entity('w').nodes;
            expect(assertionGraph.entity(nodes[0]).loc).to.eql([0, 0]);
            expect(assertionGraph.entity(nodes[1]).loc).to.eql([1, 0]);
            expect(assertionGraph.entity(nodes[2]).loc).to.eql([2, 0]);
            expect(assertionGraph.entity(nodes[3]).loc).to.eql([3, 0]);
            // and second way
            nodes = assertionGraph.entity('x').nodes;
            expect(assertionGraph.entity(nodes[0]).loc).to.eql([2, 0]);
            expect(assertionGraph.entity(nodes[1]).loc).to.eql([2, 1]);
            expect(assertionGraph.entity(nodes[2]).loc).to.eql([2, 2]);
        });

        it('uses same replacement node at intersection', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);
            // Confirm both ways have the same replacement node
            expect(assertionGraph.entity('w').nodes[2]).to.eql(assertionGraph.entity('x').nodes[0]);
        });

        it('does replace target node', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);

            var nodes = assertionGraph.entity('w').nodes;
            // Confirm that the target is no longer "c"
            expect(nodes[2]).not.to.eql('c');
            // and that the tags are not present
            expect(assertionGraph.entity(nodes[2]).tags).to.eql({});
            // Confirm that the second way's first node is the same
            expect(assertionGraph.entity('x').nodes[0]).to.eql(nodes[2]);
        });

        it('does detach target node', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);

            // confirm that a still exists
            var targetNode = assertionGraph.entity('c');
            expect(targetNode).not.to.eql(undefined);
            // ... and that the location is correct
            expect(targetNode.loc).to.eql([2, 0]);
            // ... and that the tags are intact
            expect(targetNode.tags).to.eql(tags);
            // ... and that the parentWay is empty
            expect(assertionGraph.parentWays(targetNode)).to.eql([]);
        });
    });
    describe('intersecting closed way', function () {
        var graph;
        beforeEach(function () {
            // Set up two intersecting closed ways
            // a-b (0,0)-(1,0)
            // | |
            // d-c-e      (0,1)-(1,1)-(2,1)
            //   | |
            //   g f (0,2) - (1,2)
            // C is the target node
            graph = iD.Graph([
                iD.Node({ id: 'a', loc: [0, 0] }),
                iD.Node({ id: 'b', loc: [1, 0] }),
                iD.Node({ id: 'c', loc: [1, 1], tags: tags }),
                iD.Node({ id: 'd', loc: [0, 1] }),
                iD.Node({ id: 'e', loc: [2, 1] }),
                iD.Node({ id: 'f', loc: [1, 2] }),
                iD.Node({ id: 'g', loc: [0, 2] }),
                iD.Way({ id: 'w', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.Way({ id: 'x', nodes: ['c', 'e', 'f', 'g', 'c'] })
            ]);
        });

        it('does not change length of ways', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);

            // Confirm that the way still has 5 nodes
            var target = assertionGraph.entity('w');
            expect(target.nodes.length).to.eql(5);
            // and the second
            target = assertionGraph.entity('x');
            expect(target.nodes.length).to.eql(5);
        });

        it('does not change order of nodes', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);

            // Confirm that the way is ordered correctly
            var target = assertionGraph.entity('w');
            // Note that we can't be sure of the id of the replacement node
            // so we only assert the nodes we know the ids for
            // As we have already confirmed the size of the array we can assume
            // that the replacement node is in the correct posisiton by a process of elimination                
            expect(target.nodes[0]).to.eql('a');
            expect(target.nodes[1]).to.eql('b');
            expect(target.nodes[3]).to.eql('d');
            // Need to confirm that the id of the first & last node is the same so that the way remains closed
            expect(target.nodes[0]).to.eql(target.nodes[4]);
            // and the same for the other way
            target = assertionGraph.entity('x');
            expect(target.nodes[1]).to.eql('e');
            expect(target.nodes[2]).to.eql('f');
            expect(target.nodes[3]).to.eql('g');
            expect(target.nodes[0]).to.eql(target.nodes[4]);
        });

        it('does not change location of nodes', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);

            // Confirm that the nodes have not moved, including the replacement node
            var nodes = assertionGraph.entity('w').nodes;
            expect(assertionGraph.entity(nodes[0]).loc).to.eql([0, 0]);
            expect(assertionGraph.entity(nodes[1]).loc).to.eql([1, 0]);
            expect(assertionGraph.entity(nodes[2]).loc).to.eql([1, 1]);
            expect(assertionGraph.entity(nodes[3]).loc).to.eql([0, 1]);
            // We don't need to assert node[4] location as we've already confirmed that it is the same as node 0
            // and the other way
            nodes = assertionGraph.entity('x').nodes;
            expect(assertionGraph.entity(nodes[0]).loc).to.eql([1, 1]);
            expect(assertionGraph.entity(nodes[1]).loc).to.eql([2, 1]);
            expect(assertionGraph.entity(nodes[2]).loc).to.eql([1, 2]);
            expect(assertionGraph.entity(nodes[3]).loc).to.eql([0, 2]);
        });

        it('uses same replacement node at intersection', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);
            // Confirm both ways have the same replacement node
            expect(assertionGraph.entity('w').nodes[2]).to.eql(assertionGraph.entity('x').nodes[0]);
        });

        it('does replace target node', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);

            var nodes = assertionGraph.entity('w').nodes;
            // Confirm that the target is no longer "c"
            expect(nodes[0]).not.to.eql('c');
            // .. also in the tail position
            expect(nodes[4]).not.to.eql('c');
            // and that the tags are not present (already confirmed same node in position 0 & 4, so only need to check tags once)
            expect(assertionGraph.entity(nodes[0]).tags).to.eql({});
            // Don't need to check for way 2 since we've already confirmed it is the same node
        });

        it('does detach target node', function () {
            // Act
            var assertionGraph = iD.actionDetachNode('c')(graph);

            // confirm that a still exists
            var targetNode = assertionGraph.entity('c');
            expect(targetNode).not.to.eql(undefined);
            // ... and that the location is correct
            expect(targetNode.loc).to.eql([1, 1]);
            // ... and that the tags are intact
            expect(targetNode.tags).to.eql(tags);
            // ... and that the parentWay is empty
            expect(assertionGraph.parentWays(targetNode)).to.eql([]);
        });
    });
    describe('with relation', function () {
        var graph;

        beforeEach(function () {
            // Set up a simple way
            // a-b-c (0,0)-(1,0)-(2,0)
            // Node b represents the target
            // With a relationship for the way including b
            graph = iD.Graph([
                iD.Node({ id: 'a', loc: [0, 0] }),
                iD.Node({ id: 'b', loc: [1, 0], tags: tags }),
                iD.Node({ id: 'c', loc: [2, 0] }),
                iD.Way({ id: 'w', nodes: ['a', 'b', 'c'] }),
                iD.Relation({
                    id: 'r',
                    tags: {
                        type: 'route',
                        route: 'foot'
                    },
                    members: [
                        { id: 'a', type: 'node', role: 'point' },
                        { id: 'b', type: 'node', role: 'point' },
                        { id: 'c', type: 'node', role: 'point' }
                    ]
                })
            ]);
        });

        it('detached node not a member of relation', function () {
            var assertionGraph = iD.actionDetachNode('b')(graph);

            var targetNode = assertionGraph.entity('b');
            // Confirm is not a member of the relation
            expect(assertionGraph.parentRelations(targetNode).length).to.eql(0);
        });

        it('new node is a member of relation', function () {
            var assertionGraph = iD.actionDetachNode('b')(graph);

            // Find the new node
            var targetWay = assertionGraph.entity('w');
            var newNodeId = targetWay.nodes.filter(function (m) {
                return m !== 'a' && m !== 'b' && m !== 'c';
            })[0];
            var newNode = assertionGraph.entity(newNodeId);

            // Confirm is a member of the relation
            expect(assertionGraph.parentRelations(newNode).length).to.eql(1);
            expect(assertionGraph.parentRelations(newNode)[0].id).to.eql('r');
        });

        it('Relation membership has the same properties', function () {
            var assertionGraph = iD.actionDetachNode('b')(graph);

            // Find the new node
            var targetWay = assertionGraph.entity('w');
            var newNodeId = targetWay.nodes.filter(function (m) {
                return m !== 'a' && m !== 'b' && m !== 'c';
            })[0];

            // Get the relation
            var targetRelation = assertionGraph.entity('r');
            // Find the member
            var targetMember = targetRelation.memberById(newNodeId);

            // Confirm membership is the same as original (except for the new id)
            expect(targetMember).to.eql({ id: newNodeId, index: 1, type: 'node', role: 'point' });
        });

    });
});