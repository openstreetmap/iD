describe("iD.actions.DeleteWay", function() {
    it("removes the way from the graph", function() {
        var way    = iD.Way(),
            action = iD.actions.DeleteWay(way.id),
            graph  = iD.Graph([way]).update(action);
        expect(graph.hasEntity(way.id)).to.be.undefined;
    });

    it("removes a way from parent relations", function() {
        var way      = iD.Way(),
            relation = iD.Relation({members: [{ id: way.id }, { id: 'w-2' }]}),
            action   = iD.actions.DeleteWay(way.id),
            graph    = iD.Graph([way, relation]).update(action);
        expect(_.pluck(graph.entity(relation.id).members, 'id')).not.to.contain(way.id);
    });

    it("deletes member nodes not referenced by another parent", function() {
        var node   = iD.Node(),
            way    = iD.Way({nodes: [node.id]}),
            action = iD.actions.DeleteWay(way.id),
            graph  = iD.Graph([node, way]).update(action);
        expect(graph.hasEntity(node.id)).to.be.undefined;
    });

    it("does not delete member nodes referenced by another parent", function() {
        var node   = iD.Node(),
            way1   = iD.Way({nodes: [node.id]}),
            way2   = iD.Way({nodes: [node.id]}),
            action = iD.actions.DeleteWay(way1.id),
            graph  = iD.Graph([node, way1, way2]).update(action);
        expect(graph.hasEntity(node.id)).not.to.be.undefined;
    });

    it("deletes multiple member nodes", function() {
        var a      = iD.Node(),
            b      = iD.Node(),
            way    = iD.Way({nodes: [a.id, b.id]}),
            action = iD.actions.DeleteWay(way.id),
            graph  = iD.Graph([a, b, way]).update(action);
        expect(graph.hasEntity(a.id)).to.be.undefined;
        expect(graph.hasEntity(b.id)).to.be.undefined;
    });

    it("deletes a circular way's start/end node", function() {
        var a      = iD.Node(),
            b      = iD.Node(),
            c      = iD.Node(),
            way    = iD.Way({nodes: [a.id, b.id, c.id, a.id]}),
            action = iD.actions.DeleteWay(way.id),
            graph  = iD.Graph([a, b, c, way]).update(action);
        expect(graph.hasEntity(a.id)).to.be.undefined;
        expect(graph.hasEntity(b.id)).to.be.undefined;
        expect(graph.hasEntity(c.id)).to.be.undefined;
    });

    it("does not delete member nodes with interesting tags", function() {
        var node   = iD.Node({tags: {highway: 'traffic_signals'}}),
            way    = iD.Way({nodes: [node.id]}),
            action = iD.actions.DeleteWay(way.id),
            graph  = iD.Graph([node, way]).update(action);
        expect(graph.hasEntity(node.id)).not.to.be.undefined;
    });

    it("deletes parent relations that become empty", function () {
        var way      = iD.Way(),
            relation = iD.Relation({members: [{ id: way.id }]}),
            action   = iD.actions.DeleteWay(way.id),
            graph    = iD.Graph([way, relation]).update(action);
        expect(graph.hasEntity(relation.id)).to.be.undefined;
    });

    describe("#disabled", function () {
        it("returns 'part_of_relation' for members of route and boundary relations", function () {
            var a        = iD.Way({id: 'a'}),
                b        = iD.Way({id: 'b'}),
                route    = iD.Relation({members: [{id: 'a'}], tags: {type: 'route'}}),
                boundary = iD.Relation({members: [{id: 'b'}], tags: {type: 'boundary'}}),
                graph    = iD.Graph([a, b, route, boundary]);
            expect(iD.actions.DeleteWay('a').disabled(graph)).to.equal('part_of_relation');
            expect(iD.actions.DeleteWay('b').disabled(graph)).to.equal('part_of_relation');
        });

        it("returns 'part_of_relation' for outer members of multipolygons", function () {
            var way      = iD.Way({id: 'w'}),
                relation = iD.Relation({members: [{id: 'w', role: 'outer'}], tags: {type: 'multipolygon'}}),
                graph    = iD.Graph([way, relation]),
                action   = iD.actions.DeleteWay(way.id);
            expect(action.disabled(graph)).to.equal('part_of_relation');
        });

        it("returns falsy for inner members of multipolygons", function () {
            var way      = iD.Way({id: 'w'}),
                relation = iD.Relation({members: [{id: 'w', role: 'inner'}], tags: {type: 'multipolygon'}}),
                graph    = iD.Graph([way, relation]),
                action   = iD.actions.DeleteWay(way.id);
            expect(action.disabled(graph)).not.ok;
        });
    });
});
