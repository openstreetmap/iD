describe('iD.actionCopyEntities', function () {
    it('copies a node', function () {
        var a = iD.osmNode({id: 'a'}),
            base = iD.coreGraph([a]),
            head = iD.actionCopyEntities(['a'], base)(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(head.hasEntity('a')).to.be.ok;
        expect(created).to.have.length(1);
    });

    it('copies a way', function () {
        var a = iD.osmNode({id: 'a'}),
            b = iD.osmNode({id: 'b'}),
            w = iD.osmWay({id: 'w', nodes: ['a', 'b']}),
            base = iD.coreGraph([a, b, w]),
            action = iD.actionCopyEntities(['w'], base),
            head = action(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(head.hasEntity('w')).to.be.ok;
        expect(created).to.have.length(3);
    });

    it('copies multiple nodes', function () {
        var base = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'})
            ]),
            action = iD.actionCopyEntities(['a', 'b'], base),
            head = action(base),
            diff = iD.Difference(base, head),
            created = diff.created();

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
            ]),
            action = iD.actionCopyEntities(['w1', 'w2'], base),
            head = action(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(created).to.have.length(5);
        expect(action.copies().w1.nodes[1]).to.eql(action.copies().w2.nodes[0]);
    });

    it('obtains source entities from an alternate graph', function () {
        var a = iD.osmNode({id: 'a'}),
            old = iD.coreGraph([a]),
            base = iD.coreGraph(),
            action = iD.actionCopyEntities(['a'], old),
            head = action(base),
            diff = iD.Difference(base, head);
            diff.created();

        expect(head.hasEntity('a')).not.to.be.ok;
        expect(Object.keys(action.copies())).to.have.length(1);
    });
});
