describe('iD.Graph', function() {
    describe("constructor", function () {
        it("accepts an entities Array", function () {
            var entity = iD.Entity(),
                graph = iD.Graph([entity]);
            expect(graph.entity(entity.id)).to.equal(entity);
        });

        it("accepts a Graph", function () {
            var entity = iD.Entity(),
                graph = iD.Graph(iD.Graph([entity]));
            expect(graph.entity(entity.id)).to.equal(entity);
        });

        it("copies other's entities", function () {
            var entity = iD.Entity(),
                base   = iD.Graph([entity]),
                graph  = iD.Graph(base);
            expect(graph.entities).not.to.equal(base.entities);
        });

        it("rebases on other's base", function () {
            var base   = iD.Graph(),
                graph  = iD.Graph(base);
            expect(graph.base().entities).to.equal(base.base().entities);
        });

        it("freezes by default", function () {
            expect(iD.Graph().frozen).to.be.true;
        });

        it("remains mutable if passed true as second argument", function () {
            expect(iD.Graph([], true).frozen).to.be.false;
        });
    });

    describe("#hasEntity", function () {
        it("returns the entity when present", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            expect(graph.hasEntity(node.id)).to.equal(node);
        });

        it("returns undefined when the entity is not present", function () {
            expect(iD.Graph().hasEntity('1')).to.be.undefined;
        });
    });

    describe("#entity", function () {
        it("returns the entity when present", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            expect(graph.entity(node.id)).to.equal(node);
        });

        it("throws when the entity is not present", function () {
            expect(function() { iD.Graph().entity('1'); }).to.throw;
        });
    });

    describe("#rebase", function () {
        it("preserves existing entities", function () {
            var node = iD.Node({id: 'n'}),
                graph = iD.Graph([node]);

            graph.rebase([], [graph]);

            expect(graph.entity('n')).to.equal(node);
        });

        it("includes new entities", function () {
            var node = iD.Node({id: 'n'}),
                graph = iD.Graph();

            graph.rebase([node], [graph]);

            expect(graph.entity('n')).to.equal(node);
        });

        it("doesn't rebase deleted entities", function () {
            var node = iD.Node({id: 'n', visible: false}),
                graph = iD.Graph();

            graph.rebase([node], [graph]);

            expect(graph.hasEntity('n')).to.be.not.ok;
        });

        it("gives precedence to existing entities", function () {
            var a = iD.Node({id: 'n'}),
                b = iD.Node({id: 'n'}),
                graph = iD.Graph([a]);

            graph.rebase([b], [graph]);

            expect(graph.entity('n')).to.equal(a);
        });

        it("gives precedence to new entities when force = true", function () {
            var a = iD.Node({id: 'n'}),
                b = iD.Node({id: 'n'}),
                graph = iD.Graph([a]);

            graph.rebase([b], [graph], true);

            expect(graph.entity('n')).to.equal(b);
        });

        it("inherits entities from base prototypally", function () {
            var graph = iD.Graph();

            graph.rebase([iD.Node({id: 'n'})], [graph]);

            expect(graph.entities).not.to.have.ownProperty('n');
        });

        it("updates parentWays", function () {
            var n = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w1', nodes: ['n']}),
                w2 = iD.Way({id: 'w2', nodes: ['n']}),
                graph = iD.Graph([n, w1]);

            graph.rebase([w2], [graph]);

            expect(graph.parentWays(n)).to.eql([w1, w2]);
            expect(graph._parentWays.hasOwnProperty('n')).to.be.false;
        });

        it("avoids adding duplicate parentWays", function () {
            var n = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w1', nodes: ['n']}),
                graph = iD.Graph([n, w1]);

            graph.rebase([w1], [graph]);

            expect(graph.parentWays(n)).to.eql([w1]);
        });

        it("updates parentWays for nodes with modified parentWays", function () {
            var n = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w1', nodes: ['n']}),
                w2 = iD.Way({id: 'w2', nodes: ['n']}),
                w3 = iD.Way({id: 'w3', nodes: ['n']}),
                graph = iD.Graph([n, w1]),
                graph2 = graph.replace(w2);

            graph.rebase([w3], [graph, graph2]);

            expect(graph2.parentWays(n)).to.eql([w1, w2, w3]);
        });

        it("avoids re-adding a modified way as a parent way", function() {
            var n1 = iD.Node({id: 'n1'}),
                n2 = iD.Node({id: 'n2'}),
                w1 = iD.Way({id: 'w1', nodes: ['n1', 'n2']}),
                w2 = w1.removeNode('n2'),
                graph = iD.Graph([n1, n2, w1]),
                graph2 = graph.replace(w2);

            graph.rebase([w1], [graph, graph2]);

            expect(graph2.parentWays(n2)).to.eql([]);
        });

        it("avoids re-adding a deleted way as a parent way", function() {
            var n = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w1', nodes: ['n']}),
                graph = iD.Graph([n, w1]),
                graph2 = graph.remove(w1);

            graph.rebase([w1], [graph, graph2]);

            expect(graph2.parentWays(n)).to.eql([]);
        });

        it("re-adds a deleted node that is discovered to have another parent", function() {
            var n = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w1', nodes: ['n']}),
                w2 = iD.Way({id: 'w2', nodes: ['n']}),
                graph = iD.Graph([n, w1]),
                graph2 = graph.remove(n);

            graph.rebase([n, w2], [graph, graph2]);

            expect(graph2.entity('n')).to.eql(n);
        });

        it("updates parentRelations", function () {
            var n = iD.Node({id: 'n'}),
                r1 = iD.Relation({id: 'r1', members: [{id: 'n'}]}),
                r2 = iD.Relation({id: 'r2', members: [{id: 'n'}]}),
                graph = iD.Graph([n, r1]);

            graph.rebase([r2], [graph]);

            expect(graph.parentRelations(n)).to.eql([r1, r2]);
            expect(graph._parentRels.hasOwnProperty('n')).to.be.false;
        });

        it("avoids re-adding a modified relation as a parent relation", function() {
            var n = iD.Node({id: 'n'}),
                r1 = iD.Relation({id: 'r1', members: [{id: 'n'}]}),
                r2 = r1.removeMembersWithID('n'),
                graph = iD.Graph([n, r1]),
                graph2 = graph.replace(r2);

            graph.rebase([r1], [graph, graph2]);

            expect(graph2.parentRelations(n)).to.eql([]);
        });

        it("avoids re-adding a deleted relation as a parent relation", function() {
            var n = iD.Node({id: 'n'}),
                r1 = iD.Relation({id: 'r1', members: [{id: 'n'}]}),
                graph = iD.Graph([n, r1]),
                graph2 = graph.remove(r1);

            graph.rebase([r1], [graph, graph2]);

            expect(graph2.parentRelations(n)).to.eql([]);
        });

        it("updates parentRels for nodes with modified parentWays", function () {
            var n = iD.Node({id: 'n'}),
                r1 = iD.Relation({id: 'r1', members: [{id: 'n'}]}),
                r2 = iD.Relation({id: 'r2', members: [{id: 'n'}]}),
                r3 = iD.Relation({id: 'r3', members: [{id: 'n'}]}),
                graph = iD.Graph([n, r1]),
                graph2 = graph.replace(r2);

            graph.rebase([r3], [graph, graph2]);

            expect(graph2.parentRelations(n)).to.eql([r1, r2, r3]);
        });

        it("invalidates transients", function() {
            var n = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w1', nodes: ['n']}),
                w2 = iD.Way({id: 'w2', nodes: ['n']}),
                graph = iD.Graph([n, w1]);

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

    describe("#remove", function () {
        it("returns a new graph", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            expect(graph.remove(node)).not.to.equal(graph);
        });

        it("doesn't modify the receiver", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            graph.remove(node);
            expect(graph.entity(node.id)).to.equal(node);
        });

        it("removes the entity from the result", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            expect(graph.remove(node).hasEntity(node.id)).to.be.undefined;
        });

        it("removes the entity as a parentWay", function () {
            var node = iD.Node({id: 'n' }),
                w1 = iD.Way({id: 'w', nodes: ['n']}),
                graph = iD.Graph([node, w1]);
            expect(graph.remove(w1).parentWays(node)).to.eql([]);
        });

        it("removes the entity as a parentRelation", function () {
            var node = iD.Node({id: 'n' }),
                r1 = iD.Relation({id: 'w', members: [{id: 'n' }]}),
                graph = iD.Graph([node, r1]);
            expect(graph.remove(r1).parentRelations(node)).to.eql([]);
        });
    });

    describe("#replace", function () {
        it("is a no-op if the replacement is identical to the existing entity", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            expect(graph.replace(node)).to.equal(graph);
        });

        it("returns a new graph", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            expect(graph.replace(node.update())).not.to.equal(graph);
        });

        it("doesn't modify the receiver", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            graph.replace(node);
            expect(graph.entity(node.id)).to.equal(node);
        });

        it("replaces the entity in the result", function () {
            var node1 = iD.Node(),
                node2 = node1.update({}),
                graph = iD.Graph([node1]);
            expect(graph.replace(node2).entity(node2.id)).to.equal(node2);
        });

        it("adds parentWays",  function () {
            var node = iD.Node({id: 'n' }),
                w1 = iD.Way({id: 'w', nodes: ['n']}),
                graph = iD.Graph([node]);
            expect(graph.replace(w1).parentWays(node)).to.eql([w1]);
        });

        it("removes parentWays",  function () {
            var node = iD.Node({id: 'n' }),
                w1 = iD.Way({id: 'w', nodes: ['n']}),
                graph = iD.Graph([node, w1]);
            expect(graph.remove(w1).parentWays(node)).to.eql([]);
        });

        it("doesn't add duplicate parentWays",  function () {
            var node = iD.Node({id: 'n' }),
                w1 = iD.Way({id: 'w', nodes: ['n']}),
                graph = iD.Graph([node, w1]);
            expect(graph.replace(w1).parentWays(node)).to.eql([w1]);
        });

        it("adds parentRelations",  function () {
            var node = iD.Node({id: 'n' }),
                r1 = iD.Relation({id: 'r', members: [{id: 'n'}]}),
                graph = iD.Graph([node]);
            expect(graph.replace(r1).parentRelations(node)).to.eql([r1]);
        });

        it("removes parentRelations",  function () {
            var node = iD.Node({id: 'n' }),
                r1 = iD.Relation({id: 'r', members: [{id: 'n'}]}),
                graph = iD.Graph([node, r1]);
            expect(graph.remove(r1).parentRelations(node)).to.eql([]);
        });

        it("doesn't add duplicate parentRelations",  function () {
            var node = iD.Node({id: 'n' }),
                r1 = iD.Relation({id: 'r', members: [{id: 'n'}]}),
                graph = iD.Graph([node, r1]);
            expect(graph.replace(r1).parentRelations(node)).to.eql([r1]);
        });
    });

    describe("#revert", function () {
        it("is a no-op if the head entity is identical to the base entity", function () {
            var n1 = iD.Node({id: 'n'}),
                graph = iD.Graph([n1]);
            expect(graph.revert('n')).to.equal(graph);
        });

        it("returns a new graph", function () {
            var n1 = iD.Node({id: 'n'}),
                n2 = n1.update({}),
                graph = iD.Graph([n1]).replace(n2);
            expect(graph.revert('n')).not.to.equal(graph);
        });

        it("doesn't modify the receiver", function () {
            var n1 = iD.Node({id: 'n'}),
                n2 = n1.update({}),
                graph = iD.Graph([n1]).replace(n2);
            graph.revert('n');
            expect(graph.hasEntity('n')).to.equal(n2);
        });

        it("removes a new entity", function () {
            var n1 = iD.Node({id: 'n'}),
                graph = iD.Graph().replace(n1);

            graph = graph.revert('n');
            expect(graph.hasEntity('n')).to.be.undefined;
        });

        it("reverts an updated entity to the base version", function () {
            var n1 = iD.Node({id: 'n'}),
                n2 = n1.update({}),
                graph = iD.Graph([n1]).replace(n2);

            graph = graph.revert('n');
            expect(graph.hasEntity('n')).to.equal(n1);
        });

        it("restores a deleted entity", function () {
            var n1 = iD.Node({id: 'n'}),
                graph = iD.Graph([n1]).remove(n1);

            graph = graph.revert('n');
            expect(graph.hasEntity('n')).to.equal(n1);
        });

        it("removes new parentWays", function () {
            var n1 = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w', nodes: ['n']}),
                graph = iD.Graph().replace(n1).replace(w1);

            graph = graph.revert('w');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentWays(n1)).to.eql([]);
        });

        it("removes new parentRelations", function () {
            var n1 = iD.Node({id: 'n'}),
                r1 = iD.Relation({id: 'r', members: [{id: 'n'}]}),
                graph = iD.Graph().replace(n1).replace(r1);

            graph = graph.revert('r');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentRelations(n1)).to.eql([]);
        });

        it("reverts updated parentWays", function () {
            var n1 = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w', nodes: ['n']}),
                w2 = w1.removeNode('n'),
                graph = iD.Graph([n1, w1]).replace(w2);

            graph = graph.revert('w');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentWays(n1)).to.eql([w1]);
        });

        it("reverts updated parentRelations", function () {
            var n1 = iD.Node({id: 'n'}),
                r1 = iD.Relation({id: 'r', members: [{id: 'n'}]}),
                r2 = r1.removeMembersWithID('n'),
                graph = iD.Graph([n1, r1]).replace(r2);

            graph = graph.revert('r');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentRelations(n1)).to.eql([r1]);
        });

        it("restores deleted parentWays", function () {
            var n1 = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w', nodes: ['n']}),
                graph = iD.Graph([n1, w1]).remove(w1);

            graph = graph.revert('w');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentWays(n1)).to.eql([w1]);
        });

        it("restores deleted parentRelations", function () {
            var n1 = iD.Node({id: 'n'}),
                r1 = iD.Relation({id: 'r', members: [{id: 'n'}]}),
                graph = iD.Graph([n1, r1]).remove(r1);

            graph = graph.revert('r');
            expect(graph.hasEntity('n')).to.equal(n1);
            expect(graph.parentRelations(n1)).to.eql([r1]);
        });
    });

    describe("#update", function () {
        it("returns a new graph if self is frozen", function () {
            var graph = iD.Graph();
            expect(graph.update()).not.to.equal(graph);
        });

        it("returns self if self is not frozen", function () {
            var graph = iD.Graph([], true);
            expect(graph.update()).to.equal(graph);
        });

        it("doesn't modify self is self is frozen", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);

            graph.update(function (graph) { graph.remove(node); });

            expect(graph.entity(node.id)).to.equal(node);
        });

        it("modifies self is self is not frozen", function () {
            var node = iD.Node(),
                graph = iD.Graph([node], true);

            graph.update(function (graph) { graph.remove(node); });

            expect(graph.hasEntity(node.id)).to.be.undefined;
        });

        it("executes all of the given functions", function () {
            var a = iD.Node(),
                b = iD.Node(),
                graph = iD.Graph([a]);

            graph = graph.update(
                function (graph) { graph.remove(a); },
                function (graph) { graph.replace(b); }
            );

            expect(graph.hasEntity(a.id)).to.be.undefined;
            expect(graph.entity(b.id)).to.equal(b);
        });
    });

    describe("#parentWays", function() {
        it("returns an array of ways that contain the given node id", function () {
            var node  = iD.Node({id: "n1"}),
                way   = iD.Way({id: "w1", nodes: ["n1"]}),
                graph = iD.Graph([node, way]);
            expect(graph.parentWays(node)).to.eql([way]);
            expect(graph.parentWays(way)).to.eql([]);
        });
    });

    describe("#parentRelations", function() {
        it("returns an array of relations that contain the given entity id", function () {
            var node     = iD.Node({id: "n1"}),
                nonnode  = iD.Node({id: "n2"}),
                relation = iD.Relation({id: "r1", members: [{ id: "n1", role: 'from' }]}),
                graph    = iD.Graph([node, relation]);
            expect(graph.parentRelations(node)).to.eql([relation]);
            expect(graph.parentRelations(nonnode)).to.eql([]);
        });
    });

    describe("#childNodes", function () {
        it("returns an array of child nodes", function () {
            var node  = iD.Node({id: "n1"}),
                way   = iD.Way({id: "w1", nodes: ["n1"]}),
                graph = iD.Graph([node, way]);
            expect(graph.childNodes(way)).to.eql([node]);
        });
    });
});
