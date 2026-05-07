describe('iD.coreGraph', function() {
    describe('constructor', function () {
        it('accepts an entities Array', function () {
            var entity = new iD.osmNode(),
                graph = new iD.coreGraph([entity]);
            expect(graph.entity(entity.id)).to.equal(entity);
        });

        it('accepts a Graph', function () {
            var entity = new iD.osmNode(),
                graph = new iD.coreGraph(new iD.coreGraph([entity]));
            expect(graph.entity(entity.id)).to.equal(entity);
        });

        it('copies other\'s entities', function () {
            var entity = new iD.osmNode(),
                base   = new iD.coreGraph([entity]),
                graph  = new iD.coreGraph(base);
            expect(graph.entities).not.toBe(base.entities);
        });

        it('rebases on other\'s base', function () {
            var base   = new iD.coreGraph(),
                graph  = new iD.coreGraph(base);
            expect(graph.base().entities).to.equal(base.base().entities);
        });

        it('freezes by default', function () {
            expect(new iD.coreGraph().frozen).toBe(true);
        });

        it('remains mutable if passed true as second argument', function () {
            expect(new iD.coreGraph([], true).frozen).toBe(false);
        });
    });

    describe('#hasEntity', function () {
        it('returns the entity when present', function () {
            var node = new iD.osmNode(),
                graph = new iD.coreGraph([node]);
            expect(graph.hasEntity(node.id)).to.equal(node);
        });

        it('returns undefined when the entity is not present', function () {
            expect(new iD.coreGraph().hasEntity('1')).toBeUndefined();
        });
    });

    describe('#entity', function () {
        it('returns the entity when present', function () {
            var node = new iD.osmNode(),
                graph = new iD.coreGraph([node]);
            expect(graph.entity(node.id)).to.equal(node);
        });

        it('throws when the entity is not present', function () {
            expect(function() { new iD.coreGraph().entity('1'); }).toThrow();
        });
    });

    describe('#rebase', function () {
        it('preserves existing entities', function () {
            var node = new iD.osmNode({id: 'n'}),
                graph = new iD.coreGraph([node]);

            graph.rebase([], [graph]);

            expect(graph.entity('n')).to.equal(node);
        });

        it('includes new entities', function () {
            var node = new iD.osmNode({id: 'n'}),
                graph = new iD.coreGraph();

            graph.rebase([node], [graph]);

            expect(graph.entity('n')).to.equal(node);
        });

        it('doesn\'t rebase deleted entities', function () {
            var node = new iD.osmNode({id: 'n', visible: false}),
                graph = new iD.coreGraph();

            graph.rebase([node], [graph]);

            expect(graph.hasEntity('n')).toBeFalsy();
        });

        it('gives precedence to existing entities', function () {
            var a = new iD.osmNode({id: 'n'}),
                b = new iD.osmNode({id: 'n'}),
                graph = new iD.coreGraph([a]);

            graph.rebase([b], [graph]);

            expect(graph.entity('n')).to.equal(a);
        });

        it('gives precedence to new entities when force = true', function () {
            var a = new iD.osmNode({id: 'n'}),
                b = new iD.osmNode({id: 'n'}),
                graph = new iD.coreGraph([a]);

            graph.rebase([b], [graph], true);

            expect(graph.entity('n')).to.equal(b);
        });

        it('inherits entities from base prototypally', function () {
            var graph = new iD.coreGraph();

            graph.rebase([new iD.osmNode({id: 'n'})], [graph]);

            expect(graph.entities).not.to.have.ownProperty('n');
        });

        it('updates parentWays', function () {
            var n = new iD.osmNode({id: 'n'}),
                w1 = new iD.osmWay({id: 'w1', nodes: ['n']}),
                w2 = new iD.osmWay({id: 'w2', nodes: ['n']}),
                graph = new iD.coreGraph([n, w1]);

            graph.rebase([w2], [graph]);

            expect(graph.parentWays(n)).toEqual([w1, w2]);
            expect(graph._parentWays.hasOwnProperty('n')).toBe(false);
        });

        it('avoids adding duplicate parentWays', function () {
            var n = new iD.osmNode({id: 'n'}),
                w1 = new iD.osmWay({id: 'w1', nodes: ['n']}),
                graph = new iD.coreGraph([n, w1]);

            graph.rebase([w1], [graph]);

            expect(graph.parentWays(n)).toEqual([w1]);
        });

        it('updates parentWays for nodes with modified parentWays', function () {
            var n = new iD.osmNode({id: 'n'}),
                w1 = new iD.osmWay({id: 'w1', nodes: ['n']}),
                w2 = new iD.osmWay({id: 'w2', nodes: ['n']}),
                w3 = new iD.osmWay({id: 'w3', nodes: ['n']}),
                graph = new iD.coreGraph([n, w1]),
                graph2 = graph.replace(w2);

            graph.rebase([w3], [graph, graph2]);

            expect(graph2.parentWays(n)).toEqual([w1, w2, w3]);
        });

        it('avoids re-adding a modified way as a parent way', function() {
            var n1 = new iD.osmNode({id: 'n1'}),
                n2 = new iD.osmNode({id: 'n2'}),
                w1 = new iD.osmWay({id: 'w1', nodes: ['n1', 'n2']}),
                w2 = w1.removeNode('n2'),
                graph = new iD.coreGraph([n1, n2, w1]),
                graph2 = graph.replace(w2);

            graph.rebase([w1], [graph, graph2]);

            expect(graph2.parentWays(n2)).toEqual([]);
        });

        it('avoids re-adding a deleted way as a parent way', function() {
            var n = new iD.osmNode({id: 'n'}),
                w1 = new iD.osmWay({id: 'w1', nodes: ['n']}),
                graph = new iD.coreGraph([n, w1]),
                graph2 = graph.remove(w1);

            graph.rebase([w1], [graph, graph2]);

            expect(graph2.parentWays(n)).toEqual([]);
        });

        it('re-adds a deleted node that is discovered to have another parent', function() {
            var n = new iD.osmNode({id: 'n'}),
                w1 = new iD.osmWay({id: 'w1', nodes: ['n']}),
                w2 = new iD.osmWay({id: 'w2', nodes: ['n']}),
                graph = new iD.coreGraph([n, w1]),
                graph2 = graph.remove(n);

            graph.rebase([n, w2], [graph, graph2]);

            expect(graph2.entity('n')).toEqual(n);
        });

        it('updates parentRelations', function () {
            var n = new iD.osmNode({id: 'n'}),
                r1 = new iD.osmRelation({id: 'r1', members: [{id: 'n'}]}),
                r2 = new iD.osmRelation({id: 'r2', members: [{id: 'n'}]}),
                graph = new iD.coreGraph([n, r1]);

            graph.rebase([r2], [graph]);

            expect(graph.parentRelations(n)).toEqual([r1, r2]);
            expect(graph._parentRels.hasOwnProperty('n')).toBe(false);
        });

        it('avoids re-adding a modified relation as a parent relation', function() {
            var n = new iD.osmNode({id: 'n'}),
                r1 = new iD.osmRelation({id: 'r1', members: [{id: 'n'}]}),
                r2 = r1.removeMembersWithID('n'),
                graph = new iD.coreGraph([n, r1]),
                graph2 = graph.replace(r2);

            graph.rebase([r1], [graph, graph2]);

            expect(graph2.parentRelations(n)).toEqual([]);
        });

        it('avoids re-adding a deleted relation as a parent relation', function() {
            var n = new iD.osmNode({id: 'n'}),
                r1 = new iD.osmRelation({id: 'r1', members: [{id: 'n'}]}),
                graph = new iD.coreGraph([n, r1]),
                graph2 = graph.remove(r1);

            graph.rebase([r1], [graph, graph2]);

            expect(graph2.parentRelations(n)).toEqual([]);
        });

        it('updates parentRels for nodes with modified parentWays', function () {
            var n = new iD.osmNode({id: 'n'}),
                r1 = new iD.osmRelation({id: 'r1', members: [{id: 'n'}]}),
                r2 = new iD.osmRelation({id: 'r2', members: [{id: 'n'}]}),
                r3 = new iD.osmRelation({id: 'r3', members: [{id: 'n'}]}),
                graph = new iD.coreGraph([n, r1]),
                graph2 = graph.replace(r2);

            graph.rebase([r3], [graph, graph2]);

            expect(graph2.parentRelations(n)).toEqual([r1, r2, r3]);
        });

        it('invalidates transients', function() {
            var n = new iD.osmNode({id: 'n'}),
                w1 = new iD.osmWay({id: 'w1', nodes: ['n']}),
                w2 = new iD.osmWay({id: 'w2', nodes: ['n']}),
                graph = new iD.coreGraph([n, w1]);

            function numParents(entity) {
                return graph.transient(entity, 'numParents', function() {
                    return graph.parentWays(entity).length;
                });
            }

            expect(numParents(n)).to.equal(1);
            graph.rebase([w2], [graph]);
            expect(numParents(n)).to.equal(2);
        });
    });

    describe('#remove', function () {
        it('returns a new graph', function () {
            var node = new iD.osmNode(),
                graph = new iD.coreGraph([node]);
            expect(graph.remove(node)).not.toBe(graph);
        });

        it('doesn\'t modify the receiver', function () {
            var node = new iD.osmNode(),
                graph = new iD.coreGraph([node]);
            graph.remove(node);
            expect(graph.entity(node.id)).to.equal(node);
        });

        it('removes the entity from the result', function () {
            var node = new iD.osmNode(),
                graph = new iD.coreGraph([node]);
            expect(graph.remove(node).hasEntity(node.id)).toBeUndefined();
        });

        it('removes the entity as a parentWay', function () {
            var node = new iD.osmNode({id: 'n' }),
                w1 = new iD.osmWay({id: 'w', nodes: ['n']}),
                graph = new iD.coreGraph([node, w1]);
            expect(graph.remove(w1).parentWays(node)).toEqual([]);
        });

        it('removes the entity as a parentRelation', function () {
            var node = new iD.osmNode({id: 'n' }),
                r1 = new iD.osmRelation({id: 'w', members: [{id: 'n' }]}),
                graph = new iD.coreGraph([node, r1]);
            expect(graph.remove(r1).parentRelations(node)).toEqual([]);
        });
    });

    describe('#replace', function () {
        it('is a no-op if the replacement is identical to the existing entity', function () {
            var node = new iD.osmNode(),
                graph = new iD.coreGraph([node]);
            expect(graph.replace(node)).to.equal(graph);
        });

        it('returns a new graph', function () {
            var node = new iD.osmNode(),
                graph = new iD.coreGraph([node]);
            expect(graph.replace(node.update())).not.toBe(graph);
        });

        it('doesn\'t modify the receiver', function () {
            var node = new iD.osmNode(),
                graph = new iD.coreGraph([node]);
            graph.replace(node);
            expect(graph.entity(node.id)).to.equal(node);
        });

        it('replaces the entity in the result', function () {
            var node1 = new iD.osmNode(),
                node2 = node1.update({}),
                graph = new iD.coreGraph([node1]);
            expect(graph.replace(node2).entity(node2.id)).to.equal(node2);
        });

        it('adds parentWays',  function () {
            var node = new iD.osmNode({id: 'n' }),
                w1 = new iD.osmWay({id: 'w', nodes: ['n']}),
                graph = new iD.coreGraph([node]);
            expect(graph.replace(w1).parentWays(node)).toEqual([w1]);
        });

        it('removes parentWays',  function () {
            var node = new iD.osmNode({id: 'n' }),
                w1 = new iD.osmWay({id: 'w', nodes: ['n']}),
                graph = new iD.coreGraph([node, w1]);
            expect(graph.remove(w1).parentWays(node)).toEqual([]);
        });

        it('doesn\'t add duplicate parentWays',  function () {
            var node = new iD.osmNode({id: 'n' }),
                w1 = new iD.osmWay({id: 'w', nodes: ['n']}),
                graph = new iD.coreGraph([node, w1]);
            expect(graph.replace(w1).parentWays(node)).toEqual([w1]);
        });

        it('adds parentRelations',  function () {
            var node = new iD.osmNode({id: 'n' }),
                r1 = new iD.osmRelation({id: 'r', members: [{id: 'n'}]}),
                graph = new iD.coreGraph([node]);
            expect(graph.replace(r1).parentRelations(node)).toEqual([r1]);
        });

        it('removes parentRelations',  function () {
            var node = new iD.osmNode({id: 'n' }),
                r1 = new iD.osmRelation({id: 'r', members: [{id: 'n'}]}),
                graph = new iD.coreGraph([node, r1]);
            expect(graph.remove(r1).parentRelations(node)).toEqual([]);
        });

        it('doesn\'t add duplicate parentRelations',  function () {
            var node = new iD.osmNode({id: 'n' }),
                r1 = new iD.osmRelation({id: 'r', members: [{id: 'n'}]}),
                graph = new iD.coreGraph([node, r1]);
            expect(graph.replace(r1).parentRelations(node)).toEqual([r1]);
        });
    });

    describe('#revert', function () {
        it('is a no-op if the head entity is identical to the base entity', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                graph = new iD.coreGraph([n1]);
            expect(graph.revert('n')).to.equal(graph);
        });

        it('returns a new graph', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                n2 = n1.update({}),
                graph = new iD.coreGraph([n1]).replace(n2);
            expect(graph.revert('n')).not.toBe(graph);
        });

        it('doesn\'t modify the receiver', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                n2 = n1.update({}),
                graph = new iD.coreGraph([n1]).replace(n2);
            graph.revert('n');
            expect(graph.hasEntity('n')).to.equal(n2);
        });

        it('removes a new entity', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                graph = new iD.coreGraph().replace(n1);

            graph = graph.revert('n');
            expect(graph.hasEntity('n')).toBeUndefined();
        });

        it('reverts an updated entity to the base version', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                n2 = n1.update({}),
                graph = new iD.coreGraph([n1]).replace(n2);

            graph = graph.revert('n');
            expect(graph.hasEntity('n')).to.equal(n1);
        });

        it('restores a deleted entity', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                graph = new iD.coreGraph([n1]).remove(n1);

            graph = graph.revert('n');
            expect(graph.hasEntity('n')).to.equal(n1);
        });

        it('removes new parentWays', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                w1 = new iD.osmWay({id: 'w', nodes: ['n']}),
                graph = new iD.coreGraph().replace(n1).replace(w1);

            graph = graph.revert('w');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentWays(n1)).toEqual([]);
        });

        it('removes new parentRelations', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                r1 = new iD.osmRelation({id: 'r', members: [{id: 'n'}]}),
                graph = new iD.coreGraph().replace(n1).replace(r1);

            graph = graph.revert('r');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentRelations(n1)).toEqual([]);
        });

        it('reverts updated parentWays', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                w1 = new iD.osmWay({id: 'w', nodes: ['n']}),
                w2 = w1.removeNode('n'),
                graph = new iD.coreGraph([n1, w1]).replace(w2);

            graph = graph.revert('w');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentWays(n1)).toEqual([w1]);
        });

        it('reverts updated parentRelations', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                r1 = new iD.osmRelation({id: 'r', members: [{id: 'n'}]}),
                r2 = r1.removeMembersWithID('n'),
                graph = new iD.coreGraph([n1, r1]).replace(r2);

            graph = graph.revert('r');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentRelations(n1)).toEqual([r1]);
        });

        it('restores deleted parentWays', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                w1 = new iD.osmWay({id: 'w', nodes: ['n']}),
                graph = new iD.coreGraph([n1, w1]).remove(w1);

            graph = graph.revert('w');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentWays(n1)).toEqual([w1]);
        });

        it('restores deleted parentRelations', function () {
            var n1 = new iD.osmNode({id: 'n'}),
                r1 = new iD.osmRelation({id: 'r', members: [{id: 'n'}]}),
                graph = new iD.coreGraph([n1, r1]).remove(r1);

            graph = graph.revert('r');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentRelations(n1)).toEqual([r1]);
        });
    });

    describe('#update', function () {
        it('returns a new graph if self is frozen', function () {
            var graph = new iD.coreGraph();
            expect(graph.update()).not.toBe(graph);
        });

        it('returns self if self is not frozen', function () {
            var graph = new iD.coreGraph([], true);
            expect(graph.update()).to.equal(graph);
        });

        it('doesn\'t modify self is self is frozen', function () {
            var node = new iD.osmNode(),
                graph = new iD.coreGraph([node]);

            graph.update(function (graph) { graph.remove(node); });

            expect(graph.entity(node.id)).to.equal(node);
        });

        it('modifies self is self is not frozen', function () {
            var node = new iD.osmNode(),
                graph = new iD.coreGraph([node], true);

            graph.update(function (graph) { graph.remove(node); });

            expect(graph.hasEntity(node.id)).toBeUndefined();
        });

        it('executes all of the given functions', function () {
            var a = new iD.osmNode(),
                b = new iD.osmNode(),
                graph = new iD.coreGraph([a]);

            graph = graph.update(
                function (graph) { graph.remove(a); },
                function (graph) { graph.replace(b); }
            );

            expect(graph.hasEntity(a.id)).toBeUndefined();
            expect(graph.entity(b.id)).to.equal(b);
        });
    });

    describe('#parentWays', function() {
        it('returns an array of ways that contain the given node id', function () {
            var node  = new iD.osmNode({id: 'n1'}),
                way   = new iD.osmWay({id: 'w1', nodes: ['n1']}),
                graph = new iD.coreGraph([node, way]);
            expect(graph.parentWays(node)).toEqual([way]);
            expect(graph.parentWays(way)).toEqual([]);
        });
    });

    describe('#parentRelations', function() {
        it('returns an array of relations that contain the given entity id', function () {
            var node     = new iD.osmNode({id: 'n1'}),
                nonnode  = new iD.osmNode({id: 'n2'}),
                relation = new iD.osmRelation({id: 'r1', members: [{ id: 'n1', role: 'from' }]}),
                graph    = new iD.coreGraph([node, relation]);
            expect(graph.parentRelations(node)).toEqual([relation]);
            expect(graph.parentRelations(nonnode)).toEqual([]);
        });
    });

    describe('#childNodes', function () {
        it('returns an array of child nodes', function () {
            var node  = new iD.osmNode({id: 'n1'}),
                way   = new iD.osmWay({id: 'w1', nodes: ['n1']}),
                graph = new iD.coreGraph([node, way]);
            expect(graph.childNodes(way)).toEqual([node]);
        });
    });
});
