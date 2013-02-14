describe('iD.Graph', function() {
    describe("constructor", function () {
        it("accepts an entities Object", function () {
            var entity = iD.Entity(),
                graph = iD.Graph({'n-1': entity});
            expect(graph.entity('n-1')).to.equal(entity);
        });

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
            expect(iD.Graph([], true).frozen).not.to.be.true;
        });
    });

    describe("#freeze", function () {
        it("sets the frozen flag", function () {
            expect(iD.Graph([], true).freeze().frozen).to.be.true;
        });

        if (iD.debug) {
            it("freezes entities", function () {
                expect(Object.isFrozen(iD.Graph().entities)).to.be.true;
            });
        }
    });

    describe("#rebase", function () {
        it("preserves existing entities", function () {
            var node = iD.Node({id: 'n'}),
                graph = iD.Graph([node]);
            graph.rebase({});
            expect(graph.entity('n')).to.equal(node);
        });

        it("includes new entities", function () {
            var node = iD.Node({id: 'n'}),
                graph = iD.Graph();
            graph.rebase({'n': node});
            expect(graph.entity('n')).to.equal(node);
        });

        it("gives precedence to existing entities", function () {
            var a = iD.Node({id: 'n'}),
                b = iD.Node({id: 'n'}),
                graph = iD.Graph([a]);
            graph.rebase({'n': b});
            expect(graph.entity('n')).to.equal(a);
        });

        it("inherits entities from base prototypally", function () {
            var graph = iD.Graph();
            graph.rebase({'n': iD.Node()});
            expect(graph.entities).not.to.have.ownProperty('n');
        });

        it("updates parentWays", function () {
            var n = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w1', nodes: ['n']}),
                w2 = iD.Way({id: 'w2', nodes: ['n']}),
                graph = iD.Graph([n, w1]);

            graph.rebase({ 'w2': w2 });
            expect(graph.parentWays(n)).to.eql([w1, w2]);
            expect(graph._parentWays.hasOwnProperty('n')).to.be.false;
        });

        it("avoids adding duplicate parentWays", function () {
            var n = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w1', nodes: ['n']}),
                graph = iD.Graph([n, w1]);
            graph.rebase({ 'w1': w1 });
            expect(graph.parentWays(n)).to.eql([w1]);
        });

        it("updates parentWays for nodes with modified parentWays", function () {
            var n = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w1', nodes: ['n']}),
                w2 = iD.Way({id: 'w2', nodes: ['n']}),
                w3 = iD.Way({id: 'w3', nodes: ['n']}),
                graph = iD.Graph([n, w1]),
                graph2 = graph.replace(w2);

            graph.rebase({ 'w3': w3 });
            graph2.rebase({ 'w3': w3 });

            expect(graph2.parentWays(n)).to.eql([w1, w2, w3]);
        });

        it("avoids re-adding a modified way as a parent way", function() {
            var n1 = iD.Node({id: 'n1'}),
                n2 = iD.Node({id: 'n2'}),
                w1 = iD.Way({id: 'w1', nodes: ['n1', 'n2']}),
                w2 = w1.removeNode('n2'),
                graph = iD.Graph([n1, n2, w1]),
                graph2 = graph.replace(w2);

            graph.rebase({ 'w1': w1 });
            graph2.rebase({ 'w1': w1 });

            expect(graph2.parentWays(n2)).to.eql([]);
        });

        it("avoids re-adding a deleted way as a parent way", function() {
            var n = iD.Node({id: 'n'}),
                w1 = iD.Way({id: 'w1', nodes: ['n']}),
                graph = iD.Graph([n, w1]),
                graph2 = graph.remove(w1);

            graph.rebase({ 'w1': w1 });
            graph2.rebase({ 'w1': w1 });

            expect(graph2.parentWays(n)).to.eql([]);
        });

        it("updates parentRelations", function () {
            var n = iD.Node({id: 'n'}),
                r1 = iD.Relation({id: 'r1', members: [{id: 'n'}]}),
                r2 = iD.Relation({id: 'r2', members: [{id: 'n'}]}),
                graph = iD.Graph([n, r1]);

            graph.rebase({'r2': r2});

            expect(graph.parentRelations(n)).to.eql([r1, r2]);
            expect(graph._parentRels.hasOwnProperty('n')).to.be.false;
        });

        it("avoids re-adding a modified relation as a parent relation", function() {
            var n = iD.Node({id: 'n'}),
                r1 = iD.Relation({id: 'r1', members: [{id: 'n'}]}),
                r2 = r1.removeMember('n'),
                graph = iD.Graph([n, r1]),
                graph2 = graph.replace(r2);

            graph.rebase({ 'r1': r1 });
            graph2.rebase({ 'r1': r1 });

            expect(graph2.parentRelations(n)).to.eql([]);
        });

        it("avoids re-adding a deleted relation as a parent relation", function() {
            var n = iD.Node({id: 'n'}),
                r1 = iD.Relation({id: 'r1', members: [{id: 'n'}]}),
                graph = iD.Graph([n, r1]),
                graph2 = graph.remove(r1);

            graph.rebase({ 'r1': r1 });
            graph2.rebase({ 'r1': r1 });

            expect(graph2.parentRelations(n)).to.eql([]);
        });

        it("updates parentRels for nodes with modified parentWays", function () {
            var n = iD.Node({id: 'n'}),
                r1 = iD.Relation({id: 'r1', members: [{id: 'n'}]}),
                r2 = iD.Relation({id: 'r2', members: [{id: 'n'}]}),
                r3 = iD.Relation({id: 'r3', members: [{id: 'n'}]}),
                graph = iD.Graph([n, r1]),
                graph2 = graph.replace(r2);

            graph.rebase({'r3': r3});
            graph2.rebase({'r3': r3});
            expect(graph2.parentRelations(n)).to.eql([r1, r2, r3]);
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
            expect(graph.remove(node).entity(node.id)).to.be.undefined;
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

        it("adds parentRels",  function () {
            var node = iD.Node({id: 'n' }),
            r1 = iD.Relation({id: 'w', members: [{id: 'n'}]}),
            graph = iD.Graph([node]);
            expect(graph.replace(r1).parentRelations(node)).to.eql([r1]);
        });

        it("removes parentRelations",  function () {
            var node = iD.Node({id: 'n' }),
            r1 = iD.Relation({id: 'w', members: [{id: 'n'}]}),
            graph = iD.Graph([node, r1]);
            expect(graph.remove(r1).parentRelations(node)).to.eql([]);
        });

        it("doesn't add duplicate parentRelations",  function () {
            var node = iD.Node({id: 'n' }),
            r1 = iD.Relation({id: 'w', members: [{id: 'n'}]}),
            graph = iD.Graph([node, r1]);
            expect(graph.replace(r1).parentRelations(node)).to.eql([r1]);
        });
    });

    describe("#update", function () {
        it("returns a new graph if self is frozen", function () {
            var graph = iD.Graph();
            expect(graph.update()).not.to.equal(graph);
        });

        it("returns self if self is not frozen", function () {
            var graph = iD.Graph({}, true);
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

            expect(graph.entity(node.id)).to.be.undefined;
        });

        it("executes all of the given functions", function () {
            var a = iD.Node(),
                b = iD.Node(),
                graph = iD.Graph([a]);

            graph = graph.update(
                function (graph) { graph.remove(a); },
                function (graph) { graph.replace(b); }
            );

            expect(graph.entity(a.id)).to.be.undefined;
            expect(graph.entity(b.id)).to.equal(b);
        });
    });

    describe("#parentWays", function() {
        it("returns an array of ways that contain the given node id", function () {
            var node  = iD.Node({id: "n1"}),
                way   = iD.Way({id: "w1", nodes: ["n1"]}),
                graph = iD.Graph({n1: node, w1: way});
            expect(graph.parentWays(node)).to.eql([way]);
            expect(graph.parentWays(way)).to.eql([]);
        });
    });

    describe("#parentRelations", function() {
        it("returns an array of relations that contain the given entity id", function () {
            var node     = iD.Node({id: "n1"}),
                nonnode     = iD.Node({id: "n2"}),
                relation = iD.Relation({id: "r1", members: [{ id: "n1", role: 'from' }]}),
                graph    = iD.Graph({n1: node, r1: relation});
            expect(graph.parentRelations(node)).to.eql([relation]);
            expect(graph.parentRelations(nonnode)).to.eql([]);
        });
    });

    describe("#childNodes", function () {
        it("returns an array of child nodes", function () {
            var node  = iD.Node({id: "n1"}),
                way   = iD.Way({id: "w1", nodes: ["n1"]}),
                graph = iD.Graph({n1: node, w1: way});
            expect(graph.childNodes(way)).to.eql([node]);
        });
    });
});
