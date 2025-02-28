describe('iD.actionCopyEntities', function () {
    it('copies a node', function () {
        const a = iD.osmNode({id: 'a'});
        const base = iD.coreGraph([a]);
        const head = iD.actionCopyEntities(['a'], base)(base);
        const diff = iD.coreDifference(base, head);
        const created = diff.created();

        expect(head.hasEntity('a')).to.be.ok;
        expect(created).to.have.length(1);
    });

    it('copies a way', function () {
        const a = iD.osmNode({id: 'a'});
        const b = iD.osmNode({id: 'b'});
        const w = iD.osmWay({id: 'w', nodes: ['a', 'b']});
        const base = iD.coreGraph([a, b, w]);
        const action = iD.actionCopyEntities(['w'], base);
        const head = action(base);
        const diff = iD.coreDifference(base, head);
        const created = diff.created();

        expect(head.hasEntity('w')).to.be.ok;
        expect(created).to.have.length(3);
    });

    it('copies multiple nodes', function () {
        const base = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'})
        ]);
        const action = iD.actionCopyEntities(['a', 'b'], base);
        const head = action(base);
        const diff = iD.coreDifference(base, head);
        const created = diff.created();

        expect(head.hasEntity('a')).to.be.ok;
        expect(head.hasEntity('b')).to.be.ok;
        expect(created).to.have.length(2);
    });

    it('copies multiple ways, keeping the same connections', function () {
        const base = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmWay({id: 'w1', nodes: ['a', 'b']}),
            iD.osmWay({id: 'w2', nodes: ['b', 'c']})
        ]);
        const action = iD.actionCopyEntities(['w1', 'w2'], base);
        const head = action(base);
        const diff = iD.coreDifference(base, head);
        const created = diff.created();

        expect(created).to.have.length(5);
        expect(action.copies().w1.nodes[1]).to.eql(action.copies().w2.nodes[0]);
    });

    it('obtains source entities from an alternate graph', function () {
        const a = iD.osmNode({id: 'a'});
        const old = iD.coreGraph([a]);
        const base = iD.coreGraph();
        const action = iD.actionCopyEntities(['a'], old);
        const head = action(base);

        expect(head.hasEntity('a')).not.to.be.ok;
        expect(Object.keys(action.copies())).to.have.length(1);
    });
});
