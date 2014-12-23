describe("iD.actions.CopyEntity", function () {
    it("copies a Node and adds it to the graph", function () {
        var a = iD.Node({id: 'a'}),
            base = iD.Graph([a]),
            head = iD.actions.CopyEntity(a)(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(head.hasEntity('a')).to.be.ok;
        expect(created).to.have.length(1);
        expect(created[0]).to.be.an.instanceof(iD.Node);
    });

    it("shallow copies a Way and adds it to the graph", function () {
        var a = iD.Node({id: 'a'}),
            b = iD.Node({id: 'b'}),
            w = iD.Way({id: 'w', nodes: ['a', 'b']}),
            base = iD.Graph([a, b, w]),
            head = iD.actions.CopyEntity(w)(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(head.hasEntity('w')).to.be.ok;
        expect(created).to.have.length(1);
        expect(created[0]).to.be.an.instanceof(iD.Way);
    });

    it("deep copies a Way and child Nodes and adds them to the graph", function () {
        var a = iD.Node({id: 'a'}),
            b = iD.Node({id: 'b'}),
            w = iD.Way({id: 'w', nodes: ['a', 'b']}),
            base = iD.Graph([a, b, w]),
            head = iD.actions.CopyEntity(w, true)(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(head.hasEntity('w')).to.be.ok;
        expect(created).to.have.length(3);
        expect(created[0]).to.be.an.instanceof(iD.Way);
        expect(created[1]).to.be.an.instanceof(iD.Node);
        expect(created[2]).to.be.an.instanceof(iD.Node);
    });

    it("shallow copies a Relation and adds it to the graph", function () {
        var a = iD.Node({id: 'a'}),
            b = iD.Node({id: 'b'}),
            w = iD.Way({id: 'w', nodes: ['a', 'b']}),
            r = iD.Relation({id: 'r', members: [{id: 'w'}]}),
            base = iD.Graph([a, b, w, r]),
            head = iD.actions.CopyEntity(r)(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(head.hasEntity('r')).to.be.ok;
        expect(created).to.have.length(1);
        expect(created[0]).to.be.an.instanceof(iD.Relation);
    });

    it("deep copies a Relation, member Ways, and child Nodes and adds them to the graph", function () {
        var a = iD.Node({id: 'a'}),
            b = iD.Node({id: 'b'}),
            w = iD.Way({id: 'w', nodes: ['a', 'b']}),
            r = iD.Relation({id: 'r', members: [{id: 'w'}]}),
            base = iD.Graph([a, b, w, r]),
            head = iD.actions.CopyEntity(r, true)(base),
            diff = iD.Difference(base, head),
            created = diff.created();

        expect(head.hasEntity('r')).to.be.ok;
        expect(created).to.have.length(4);
        expect(created[0]).to.be.an.instanceof(iD.Relation);
        expect(created[1]).to.be.an.instanceof(iD.Way);
        expect(created[2]).to.be.an.instanceof(iD.Node);
        expect(created[3]).to.be.an.instanceof(iD.Node);
    });
});
