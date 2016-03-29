describe("iD.actions.CopyEntities", function () {
    it("copies a node", function () {
        var a = iD.Node({id: 'a'}),
            base = iD.Graph([a]),
            head = iD.actions.CopyEntities(['a'], base)(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(head.hasEntity('a')).to.be.ok;
        expect(created).to.have.length(1);
    });

    it("copies a way", function () {
        var a = iD.Node({id: 'a'}),
            b = iD.Node({id: 'b'}),
            w = iD.Way({id: 'w', nodes: ['a', 'b']}),
            base = iD.Graph([a, b, w]),
            action = iD.actions.CopyEntities(['w'], base),
            head = action(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(head.hasEntity('w')).to.be.ok;
        expect(created).to.have.length(3);
    });

    it("copies multiple nodes", function () {
        var base = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'})
            ]),
            action = iD.actions.CopyEntities(['a', 'b'], base),
            head = action(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(head.hasEntity('a')).to.be.ok;
        expect(head.hasEntity('b')).to.be.ok;
        expect(created).to.have.length(2);
    });

    it("copies multiple ways, keeping the same connections", function () {
        var base = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'}),
                iD.Way({id: 'w1', nodes: ['a', 'b']}),
                iD.Way({id: 'w2', nodes: ['b', 'c']})
            ]),
            action = iD.actions.CopyEntities(['w1', 'w2'], base),
            head = action(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(created).to.have.length(5);
        expect(action.copies().w1.nodes[1]).to.eql(action.copies().w2.nodes[0]);
    });

    it("obtains source entities from an alternate graph", function () {
        var a = iD.Node({id: 'a'}),
            old = iD.Graph([a]),
            base = iD.Graph(),
            action = iD.actions.CopyEntities(['a'], old),
            head = action(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(head.hasEntity('a')).not.to.be.ok;
        expect(Object.keys(action.copies())).to.have.length(1);
    });
});
