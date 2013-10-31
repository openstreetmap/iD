describe("iD.actions.Merge", function () {
    it("merges multiple points to a line", function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', tags: {a: 'a'}}),
                iD.Node({id: 'b', tags: {b: 'b'}}),
                iD.Way({id: 'w'}),
                iD.Relation({id: 'r', members: [{id: 'a', role: 'r', type: 'node'}]})
            ]),
            action = iD.actions.Merge(['a', 'b', 'w']);

        expect(action.disabled(graph)).not.to.be.ok;

        graph = action(graph);

        expect(graph.hasEntity('a')).to.be.undefined;
        expect(graph.hasEntity('b')).to.be.undefined;
        expect(graph.entity('w').tags).to.eql({a: 'a', b: 'b'});
        expect(graph.entity('r').members).to.eql([{id: 'w', role: 'r', type: 'way'}]);
    });

    it("merges multiple points to an area", function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', tags: {a: 'a'}}),
                iD.Node({id: 'b', tags: {b: 'b'}}),
                iD.Way({id: 'w', tags: {area: 'yes'}}),
                iD.Relation({id: 'r', members: [{id: 'a', role: 'r', type: 'node'}]})
            ]),
            action = iD.actions.Merge(['a', 'b', 'w']);

        expect(action.disabled(graph)).not.to.be.ok;

        graph = action(graph);

        expect(graph.hasEntity('a')).to.be.undefined;
        expect(graph.hasEntity('b')).to.be.undefined;
        expect(graph.entity('w').tags).to.eql({a: 'a', b: 'b', area: 'yes'});
        expect(graph.entity('r').members).to.eql([{id: 'w', role: 'r', type: 'way'}]);
    });
});
