describe('iD.Graph', function() {
    it("can be constructed with an entities Object", function () {
        var entity = iD.Entity(),
            graph = iD.Graph({'n-1': entity});
        expect(graph.entity('n-1')).to.equal(entity);
    });

    it("can be constructed with an entities Array", function () {
        var entity = iD.Entity(),
            graph = iD.Graph([entity]);
        expect(graph.entity(entity.id)).to.equal(entity);
    });

    if (iD.debug) {
        it("is frozen", function () {
            expect(Object.isFrozen(iD.Graph())).to.be.true;
        });

        it("freezes entities", function () {
            expect(Object.isFrozen(iD.Graph().entities)).to.be.true;
        });
    }

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
    });

    describe("#replace", function () {
        it("returns a new graph", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            expect(graph.replace(node)).not.to.equal(graph);
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

    describe("#fetch", function () {
        it("replaces node ids with references", function () {
            var node  = iD.Node({id: "n1"}),
                way   = iD.Way({id: "w1", nodes: ["n1"]}),
                graph = iD.Graph({n1: node, w1: way});
            expect(graph.fetch("w1").nodes).to.eql([node]);
        });
    });

    describe("#difference", function () {
        it("returns an Array of ids of changed entities", function () {
            var initial = iD.Node({id: "n1"}),
                updated = initial.update({}),
                created = iD.Node(),
                deleted = iD.Node({id: 'n2'}),
                graph1 = iD.Graph([initial, deleted]),
                graph2 = graph1.replace(updated).replace(created).remove(deleted);
            expect(graph2.difference(graph1)).to.eql([created.id, updated.id, deleted.id]);
        });

        it("includes created entities that were subsequently deleted", function () {
            var node = iD.Node(),
                graph1 = iD.Graph([node]),
                graph2 = graph1.remove(node);
            expect(graph2.difference(graph1)).to.eql([node.id]);
        });
    });

    describe("#modified", function () {
        it("returns an Array of ids of modified entities", function () {
            var node1 = iD.Node({id: 'n1', _updated: true}),
                node2 = iD.Node({id: 'n2'}),
                graph = iD.Graph([node1, node2]);
            expect(graph.modified()).to.eql([node1.id]);
        });
    });

    describe("#created", function () {
        it("returns an Array of ids of created entities", function () {
            var node1 = iD.Node({id: 'n-1', _updated: true}),
                node2 = iD.Node({id: 'n2'}),
                graph = iD.Graph([node1, node2]);
            expect(graph.created()).to.eql([node1.id]);
        });
    });

    describe("#deleted", function () {
        it("returns an Array of ids of deleted entities", function () {
            var node1 = iD.Node({id: "n1"}),
                node2 = iD.Node(),
                graph = iD.Graph([node1, node2]).remove(node1);
            expect(graph.deleted()).to.eql([node1.id]);
        });

        it("doesn't include created entities that were subsequently deleted", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]).remove(node);
            expect(graph.deleted()).to.eql([]);
        });
    });
});
