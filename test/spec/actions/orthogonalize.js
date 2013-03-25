describe("iD.actions.Orthogonalize", function () {
    var projection = d3.geo.mercator();

    it("orthoganalizes a quad", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a', loc: [0, 0]}),
                'b': iD.Node({id: 'b', loc: [4, 0]}),
                'c': iD.Node({id: 'c', loc: [3, 2]}),
                'd': iD.Node({id: 'd', loc: [0, 2]}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            });

        graph = iD.actions.Orthogonalize('-', projection)(graph);

        expect(graph.entity('-').nodes).to.have.length(5);
    });

    it("orthoganalizes a triangle", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a', loc: [0, 0]}),
                'b': iD.Node({id: 'b', loc: [3, 0]}),
                'c': iD.Node({id: 'c', loc: [2, 2]}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'a']})
            });

        graph = iD.actions.Orthogonalize('-', projection)(graph);

        expect(graph.entity('-').nodes).to.have.length(4);
    });
});
