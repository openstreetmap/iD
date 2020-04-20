describe('iD.actionMerge', function () {
    it('merges multiple points to a line', function () {
        var graph = iD.coreGraph([
                iD.osmNode({id: 'a', tags: {a: 'a'}}),
                iD.osmNode({id: 'b', tags: {b: 'b'}}),
                iD.osmWay({id: 'w'}),
                iD.osmRelation({id: 'r', members: [{id: 'a', role: 'r', type: 'node'}]})
            ]),
            action = iD.actionMerge(['a', 'b', 'w']);

        expect(action.disabled(graph)).not.to.be.ok;

        graph = action(graph);

        expect(graph.hasEntity('a')).to.be.undefined;
        expect(graph.hasEntity('b')).to.be.undefined;
        expect(graph.entity('w').tags).to.eql({a: 'a', b: 'b'});
        expect(graph.entity('r').members).to.eql([{id: 'w', role: 'r', type: 'way'}]);
    });

    it('merges multiple points to an area', function () {
        var graph = iD.coreGraph([
                iD.osmNode({id: 'a', tags: {a: 'a'}}),
                iD.osmNode({id: 'b', tags: {b: 'b'}}),
                iD.osmWay({id: 'w', tags: {area: 'yes'}}),
                iD.osmRelation({id: 'r', members: [{id: 'a', role: 'r', type: 'node'}]})
            ]),
            action = iD.actionMerge(['a', 'b', 'w']);

        expect(action.disabled(graph)).not.to.be.ok;

        graph = action(graph);

        expect(graph.hasEntity('a')).to.be.undefined;
        expect(graph.hasEntity('b')).to.be.undefined;
        expect(graph.entity('w').tags).to.eql({a: 'a', b: 'b', area: 'yes'});
        expect(graph.entity('r').members).to.eql([{id: 'w', role: 'r', type: 'way'}]);
    });

    it('preserves original point if possible', function () {
        var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [1, 0], tags: {a: 'a'}}),
                iD.osmNode({id: 'p', loc: [0, 0], tags: {p: 'p'}}),
                iD.osmNode({id: 'q', loc: [0, 1]}),
                iD.osmWay({id: 'w', nodes: ['p', 'q'], tags: {w: 'w'}})
            ]),
            action = iD.actionMerge(['a', 'w']);

        graph = action(graph);
        expect(graph.hasEntity('a')).to.be.ok;
        expect(graph.hasEntity('p')).to.be.ok;
        expect(graph.hasEntity('q')).to.be.undefined;
        expect(graph.entity('w').tags).to.eql({a: 'a', w: 'w'});
        expect(graph.entity('w').nodes).to.eql(['p', 'a']);
        expect(graph.entity('a').loc[0]).to.eql(0);
        expect(graph.entity('a').loc[1]).to.eql(1);
    });
});
