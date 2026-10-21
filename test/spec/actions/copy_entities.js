describe('iD.actionCopyEntities', function () {
    it('copies a node', function () {
        var a = new iD.osmNode({id: 'a'});
        var base = new iD.coreGraph([a]);
        var head = iD.actionCopyEntities(['a'], base)(base);
        var diff = iD.coreDifference(base, head);
        var created = diff.created();

        expect(head.hasEntity('a')).toBeTruthy();
        expect(created).toHaveLength(1);
    });

    it('copies a way', function () {
        var a = new iD.osmNode({id: 'a'});
        var b = new iD.osmNode({id: 'b'});
        var w = new iD.osmWay({id: 'w', nodes: ['a', 'b']});
        var base = new iD.coreGraph([a, b, w]);
        var action = iD.actionCopyEntities(['w'], base);
        var head = action(base);
        var diff = iD.coreDifference(base, head);
        var created = diff.created();

        expect(head.hasEntity('w')).toBeTruthy();
        expect(created).toHaveLength(3);
    });

    it('copies multiple nodes', function () {
        var base = new iD.coreGraph([
            new iD.osmNode({id: 'a'}),
            new iD.osmNode({id: 'b'})
        ]);
        var action = iD.actionCopyEntities(['a', 'b'], base);
        var head = action(base);
        var diff = iD.coreDifference(base, head);
        var created = diff.created();

        expect(head.hasEntity('a')).toBeTruthy();
        expect(head.hasEntity('b')).toBeTruthy();
        expect(created).toHaveLength(2);
    });

    it('copies multiple ways, keeping the same connections', function () {
        var base = new iD.coreGraph([
            new iD.osmNode({id: 'a'}),
            new iD.osmNode({id: 'b'}),
            new iD.osmNode({id: 'c'}),
            new iD.osmWay({id: 'w1', nodes: ['a', 'b']}),
            new iD.osmWay({id: 'w2', nodes: ['b', 'c']})
        ]);
        var action = iD.actionCopyEntities(['w1', 'w2'], base);
        var head = action(base);
        var diff = iD.coreDifference(base, head);
        var created = diff.created();

        expect(created).toHaveLength(5);
        expect(action.copies().w1.nodes[1]).toEqual(action.copies().w2.nodes[0]);
    });

    it('obtains source entities from an alternate graph', function () {
        var a = new iD.osmNode({id: 'a'});
        var old = new iD.coreGraph([a]);
        var base = new iD.coreGraph();
        var action = iD.actionCopyEntities(['a'], old);
        var head = action(base);

        expect(head.hasEntity('a')).toBeFalsy();
        expect(Object.keys(action.copies())).toHaveLength(1);
    });
});
