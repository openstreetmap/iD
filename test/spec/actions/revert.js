describe('iD.actions.Revert', function() {
    it('deletes a new entity', function() {
        var n1 = iD.Node({id: 'n'}),
            graph = iD.Graph().replace(n1);

        graph = iD.actions.Revert('n')(graph);
        expect(graph.hasEntity('n')).to.be.undefined;
    });

    it('reverts an updated entity', function() {
        var n1 = iD.Node({id: 'n'}),
            n2 = n1.update({}),
            graph = iD.Graph([n1]).replace(n2);

        graph = iD.actions.Revert('n')(graph);
        expect(graph.hasEntity('n')).to.equal(n1);
    });

    it('restores a deleted entity', function() {
        var n1 = iD.Node({id: 'n'}),
            graph = iD.Graph([n1]).remove(n1);

        graph = iD.actions.Revert('n')(graph);
        expect(graph.hasEntity('n')).to.equal(n1);
    });

});
