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

    it('preserves existing point id when possible', function () {
        var graph = iD.coreGraph([
                iD.osmNode({id: 'n1', loc: [1, 0], tags: {n1: 'n1'}}),
                iD.osmNode({id: 'a', loc: [0, 0], tags: {a: 'a'}}),
                iD.osmNode({id: 'b', loc: [0, 1]}),
                iD.osmWay({id: 'w', nodes: ['a', 'b'], tags: {w: 'w'}})
            ]),
            action = iD.actionMerge(['n1', 'w']);

        graph = action(graph);
        expect(graph.hasEntity('n1')).to.be.ok;
        expect(graph.hasEntity('a')).to.be.undefined;
        expect(graph.hasEntity('b')).to.be.ok;
        expect(graph.entity('w').tags).to.eql({n1: 'n1', w: 'w'});
        expect(graph.entity('w').nodes).to.eql(['n1', 'b']);
        expect(graph.entity('n1').loc[0]).to.eql(0);
        expect(graph.entity('n1').loc[1]).to.eql(0);
    });

    it('preserves existing point ids when possible', function () {
        var graph = iD.coreGraph([
                iD.osmNode({id: 'n1', loc: [1, 0], tags: {n1: 'n1'}}),
                iD.osmNode({id: 'n2', loc: [2, 0], tags: {n2: 'n2'}}),
                iD.osmNode({id: 'a', loc: [0, 1]}),
                iD.osmNode({id: 'b', loc: [0, 2], tags: {b: 'b'}}),
                iD.osmNode({id: 'c', loc: [0, 3]}),
                iD.osmWay({id: 'w', nodes: ['a', 'b', 'c'], tags: {w: 'w'}})
            ]),
            action = iD.actionMerge(['n1', 'n2', 'w']);

        graph = action(graph);
        expect(graph.hasEntity('n1')).to.be.ok;
        expect(graph.hasEntity('n2')).to.be.ok;
        expect(graph.hasEntity('a')).to.be.undefined;
        expect(graph.hasEntity('b')).to.be.undefined;
        expect(graph.hasEntity('c')).to.be.ok;
        expect(graph.entity('n2').tags).to.eql({b: 'b'});
        expect(graph.entity('w').tags).to.eql({n1: 'n1', n2: 'n2', w: 'w'});
        expect(graph.entity('w').nodes).to.eql(['n1', 'n2', 'c']);
        expect(graph.entity('n1').loc[0]).to.eql(0);
        expect(graph.entity('n1').loc[1]).to.eql(1);
        expect(graph.entity('n2').loc[0]).to.eql(0);
        expect(graph.entity('n2').loc[1]).to.eql(2);
    });

    it('preserves existing node ids when possible', function () {
        var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [1, 0], tags: {a: 'a'}}),
                iD.osmNode({id: 'b', loc: [2, 0]}),
                iD.osmNode({id: 'n1', loc: [0, 1]}),
                iD.osmNode({id: 'n2', loc: [0, 2], tags: {n2: 'n2'}}),
                iD.osmWay({id: 'w', nodes: ['n1', 'n2'], tags: {w: 'w'}})
            ]),
            action = iD.actionMerge(['a', 'b', 'w']);

        graph = action(graph);
        expect(graph.hasEntity('a')).to.be.undefined;
        expect(graph.hasEntity('b')).to.be.undefined;
        expect(graph.hasEntity('n1')).to.be.ok;
        expect(graph.hasEntity('n2')).to.be.ok;
        expect(graph.entity('w').tags).to.eql({a: 'a', w: 'w'});
        expect(graph.entity('w').nodes).to.eql(['n1', 'n2']);
        expect(graph.entity('n1').loc[0]).to.eql(0);
        expect(graph.entity('n1').loc[1]).to.eql(1);
        expect(graph.entity('n2').loc[0]).to.eql(0);
        expect(graph.entity('n2').loc[1]).to.eql(2);
    });

    it('preserves interesting existing node ids when possible', function () {
        var graph = iD.coreGraph([
                iD.osmNode({id: 'n1', loc: [1, 0], tags: {n1: 'n1'}}),
                iD.osmNode({id: 'n2', loc: [0, 1], tags: {n2: 'n2'}}),
                iD.osmNode({id: 'n3', loc: [0, 2]}),
                iD.osmWay({id: 'w', nodes: ['n2', 'n3'], tags: {w: 'w'}})
            ]),
            action = iD.actionMerge(['n1', 'w']);

        graph = action(graph);
        expect(graph.hasEntity('n1')).to.be.ok;
        expect(graph.hasEntity('n2')).to.be.ok;
        expect(graph.hasEntity('n3')).to.be.undefined;
        expect(graph.entity('w').tags).to.eql({n1: 'n1', w: 'w'});
        expect(graph.entity('w').nodes).to.eql(['n2', 'n1']);
        expect(graph.entity('n1').loc[0]).to.eql(0);
        expect(graph.entity('n1').loc[1]).to.eql(2);
    });

    it('preserves oldest interesting existing node ids', function () {
        var graph = iD.coreGraph([
                iD.osmNode({id: 'n3', loc: [1, 0], tags: {n3: 'n3'}}),
                iD.osmNode({id: 'n6', loc: [2, 0], tags: {n6: 'n6'}}),
                iD.osmNode({id: 'n2', loc: [0, 1], tags: {n2: 'n2'}}),
                iD.osmNode({id: 'n5', loc: [0, 2], tags: {n5: 'n5'}}),
                iD.osmNode({id: 'n1', loc: [0, 3], tags: {n1: 'n1'}}),
                iD.osmNode({id: 'n4', loc: [0, 4], tags: {n4: 'n4'}}),
                iD.osmWay({id: 'w', nodes: ['n2', 'n5', 'n1', 'n4'], tags: {w: 'w'}})
            ]),
            action = iD.actionMerge(['n3', 'n6', 'w']);

        graph = action(graph);
        expect(graph.hasEntity('n1')).to.be.ok;
        expect(graph.hasEntity('n2')).to.be.ok;
        expect(graph.hasEntity('n3')).to.be.ok;
        expect(graph.hasEntity('n4')).to.be.ok;
        expect(graph.hasEntity('n5')).to.be.undefined;
        expect(graph.hasEntity('n6')).to.be.undefined;
        expect(graph.entity('w').tags).to.eql({n3: 'n3', n6: 'n6', w: 'w'});
        expect(graph.entity('w').nodes).to.eql(['n2', 'n3', 'n1', 'n4']);
        expect(graph.entity('n3').loc[0]).to.eql(0);
        expect(graph.entity('n3').loc[1]).to.eql(2);
    });
});
