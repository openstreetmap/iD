describe('iD.actionCopyEntities', function () {
    it('copies a node', function () {
        var a = iD.osmNode({id: 'a'});
        var base = iD.coreGraph([a]);
        var head = iD.actionCopyEntities(['a'], base)(base);
        var diff = iD.coreDifference(base, head);
        var created = diff.created();

        expect(head.hasEntity('a')).to.be.ok;
        expect(created).to.have.length(1);
    });

    it('copies a way', function () {
        var a = iD.osmNode({id: 'a'});
        var b = iD.osmNode({id: 'b'});
        var w = iD.osmWay({id: 'w', nodes: ['a', 'b']});
        var base = iD.coreGraph([a, b, w]);
        var action = iD.actionCopyEntities(['w'], base);
        var head = action(base);
        var diff = iD.coreDifference(base, head);
        var created = diff.created();

        expect(head.hasEntity('w')).to.be.ok;
        expect(created).to.have.length(3);
    });

    it('copies multiple nodes', function () {
        var base = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'})
        ]);
        var action = iD.actionCopyEntities(['a', 'b'], base);
        var head = action(base);
        var diff = iD.coreDifference(base, head);
        var created = diff.created();

        expect(head.hasEntity('a')).to.be.ok;
        expect(head.hasEntity('b')).to.be.ok;
        expect(created).to.have.length(2);
    });

    it('copies multiple ways, keeping the same connections', function () {
        var base = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmWay({id: 'w1', nodes: ['a', 'b']}),
            iD.osmWay({id: 'w2', nodes: ['b', 'c']})
        ]);
        var action = iD.actionCopyEntities(['w1', 'w2'], base);
        var head = action(base);
        var diff = iD.coreDifference(base, head);
        var created = diff.created();

        expect(created).to.have.length(5);
        expect(action.copies().w1.nodes[1]).to.eql(action.copies().w2.nodes[0]);
    });

    it('obtains source entities from an alternate graph', function () {
        var a = iD.osmNode({id: 'a'});
        var old = iD.coreGraph([a]);
        var base = iD.coreGraph();
        var action = iD.actionCopyEntities(['a'], old);
        var head = action(base);

        expect(head.hasEntity('a')).not.to.be.ok;
        expect(Object.keys(action.copies())).to.have.length(1);
    });
});
