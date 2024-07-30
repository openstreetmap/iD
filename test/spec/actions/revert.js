describe('iD.actionRevert', function() {
    describe('basic', function () {
        it('removes a new entity', function() {
            var n1 = iD.osmNode({id: 'n-1'}),
                graph = iD.coreGraph().replace(n1);

            graph = iD.actionRevert('n-1')(graph);
            expect(graph.hasEntity('n-1')).to.be.undefined;
        });

        it('reverts an updated entity', function() {
            var n1 = iD.osmNode({id: 'n1'}),
                n1up = n1.update({}),
                graph = iD.coreGraph([n1]).replace(n1up);

            graph = iD.actionRevert('n1')(graph);
            expect(graph.hasEntity('n1')).to.equal(n1);
        });

        it('restores a deleted entity', function() {
            var n1 = iD.osmNode({id: 'n1'}),
                graph = iD.coreGraph([n1]).remove(n1);

            graph = iD.actionRevert('n1')(graph);
            expect(graph.hasEntity('n1')).to.equal(n1);
        });
    });

    describe('reverting way child nodes', function () {
        it('removes new node, updates parent way nodelist', function() {
            // note: test with a 3 node way so w1 doesn't go degenerate..
            var n1 = iD.osmNode({id: 'n1'}),
                n2 = iD.osmNode({id: 'n2'}),
                n3 = iD.osmNode({id: 'n-3'}),
                w1 = iD.osmWay({id: 'w1', nodes: ['n1', 'n2']}),
                w1up = w1.addNode('n-3', 2),
                graph = iD.coreGraph([n1, n2, w1]).replace(n3).replace(w1up);

            graph = iD.actionRevert('n-3')(graph);

            var w1_1 = graph.hasEntity('w1');
            expect(graph.hasEntity('n1'), 'n1 unchanged').to.equal(n1);
            expect(graph.hasEntity('n2'), 'n2 unchanged').to.equal(n2);
            expect(graph.hasEntity('n-3'), 'n-3 removed').to.be.undefined;
            expect(graph.parentWays(n1), 'n1 has w1 as parent way').to.deep.equal([w1_1]);
            expect(graph.parentWays(n2), 'n2 has w1 as parent way').to.deep.equal([w1_1]);
            expect(w1_1.nodes, 'w1 nodes updated').to.deep.equal(w1.nodes);
        });

        it('reverts existing node, preserves parent way nodelist', function() {
            var n1 = iD.osmNode({id: 'n1'}),
                n2 = iD.osmNode({id: 'n2'}),
                w1 = iD.osmWay({id: 'w1', nodes: ['n1', 'n2']}),
                n1up = n1.update({}),
                graph = iD.coreGraph([n1, n2, w1]).replace(n1up);

            graph = iD.actionRevert('n1')(graph);

            var w1_1 = graph.hasEntity('w1');
            expect(graph.hasEntity('n1'), 'n1 reverted').to.equal(n1);
            expect(graph.hasEntity('n2'), 'n2 unchanged').to.equal(n2);
            expect(graph.parentWays(n1), 'n1 has w1 as parent way').to.deep.equal([w1_1]);
            expect(graph.parentWays(n2), 'n2 has w1 as parent way').to.deep.equal([w1_1]);
            expect(w1_1.nodes, 'w1 nodes preserved').to.deep.equal(w1.nodes);
        });
    });

    describe('reverting relation members', function () {
        it('removes new node, updates parent relation memberlist', function() {
            var n1 = iD.osmNode({id: 'n1'}),
                n2 = iD.osmNode({id: 'n-2'}),
                r1 = iD.osmRelation({id: 'r1', members: [{id: 'n1'}]}),
                r1up = r1.addMember({id: 'n-2'}, 1),
                graph = iD.coreGraph([n1, r1]).replace(n2).replace(r1up);

            graph = iD.actionRevert('n-2')(graph);

            var r1_1 = graph.hasEntity('r1');
            expect(graph.hasEntity('n1'), 'n1 unchanged').to.equal(n1);
            expect(graph.hasEntity('n-2'), 'n-2 removed').to.be.undefined;
            expect(graph.parentRelations(n1), 'n1 has r1 as parent relation').to.deep.equal([r1_1]);
            expect(r1_1.members, 'r1 members updated').to.deep.equal(r1.members);
        });

        it('reverts existing node, preserves parent relation memberlist', function() {
            var n1 = iD.osmNode({id: 'n1'}),
                n2 = iD.osmNode({id: 'n2'}),
                r1 = iD.osmRelation({id: 'r1', members: [{id: 'n1'}, {id: 'n2'}]}),
                n1up = n1.update({}),
                graph = iD.coreGraph([n1, n2, r1]).replace(n1up);

            graph = iD.actionRevert('n1')(graph);

            var r1_1 = graph.hasEntity('r1');
            expect(graph.hasEntity('n1'), 'n1 reverted').to.equal(n1);
            expect(graph.hasEntity('n2'), 'n2 unchanged').to.equal(n2);
            expect(graph.parentRelations(n1), 'n1 has r1 as parent relation').to.deep.equal([r1_1]);
            expect(graph.parentRelations(n2), 'n2 has r1 as parent relation').to.deep.equal([r1_1]);
            expect(r1_1.members, 'r1 members preserved').to.deep.equal(r1.members);
        });
    });

    describe('reverting parent ways', function () {
        it('removes new way, preserves new and existing child nodes', function() {
            var n1 = iD.osmNode({id: 'n1'}),
                n2 = iD.osmNode({id: 'n-2'}),
                w1 = iD.osmWay({id: 'w-1', nodes: ['n1', 'n-2']}),
                graph = iD.coreGraph([n1]).replace(n2).replace(w1);

            graph = iD.actionRevert('w-1')(graph);
            expect(graph.hasEntity('w-1'), 'w-1 removed').to.be.undefined;
            expect(graph.hasEntity('n1'), 'n1 unchanged').to.equal(n1);
            expect(graph.hasEntity('n-2'), 'n-2 unchanged').to.equal(n2);
            expect(graph.parentWays(n1), 'n1 has no parent ways').to.be.empty;
            expect(graph.parentWays(n2), 'n-2 has no parent ways').to.be.empty;
        });

        it('reverts an updated way, preserves new and existing child nodes', function() {
            var n1 = iD.osmNode({id: 'n1'}),
                n2 = iD.osmNode({id: 'n-2'}),
                w1 = iD.osmWay({id: 'w1', nodes: ['n1']}),
                w1up = w1.addNode('n-2', 1),
                graph = iD.coreGraph([n1, w1]).replace(n2).replace(w1up);

            graph = iD.actionRevert('w1')(graph);
            expect(graph.hasEntity('w1'), 'w1 reverted').to.equal(w1);
            expect(graph.hasEntity('n1'), 'n1 unchanged').to.equal(n1);
            expect(graph.hasEntity('n-2'), 'n-2 unchanged').to.equal(n2);
            expect(graph.parentWays(n1), 'n1 has w1 as parent way').to.deep.equal([w1]);
            expect(graph.parentWays(n2), 'n-2 has no parent ways').to.be.empty;
        });

        it('restores a deleted way, preserves new and existing child nodes', function() {
            var n1 = iD.osmNode({id: 'n1'}),
                n2 = iD.osmNode({id: 'n-2'}),
                w1 = iD.osmWay({id: 'w1', nodes: ['n1']}),
                w1up = w1.addNode('n-2', 1),
                graph = iD.coreGraph([n1, w1]).replace(n2).replace(w1up).remove(w1up);

            graph = iD.actionRevert('w1')(graph);
            expect(graph.hasEntity('w1'), 'w1 reverted').to.equal(w1);
            expect(graph.hasEntity('n1'), 'n1 unchanged').to.equal(n1);
            expect(graph.hasEntity('n-2'), 'n-2 unchanged').to.equal(n2);
            expect(graph.parentWays(n1), 'n1 has w1 as parent way').to.deep.equal([w1]);
            expect(graph.parentWays(n2), 'n-2 has no parent ways').to.be.empty;
        });
    });

    describe('reverting parent relations', function () {
        it('removes new relation, preserves new and existing members', function() {
            var n1 = iD.osmNode({id: 'n1'}),
                n2 = iD.osmNode({id: 'n-2'}),
                r1 = iD.osmRelation({id: 'r-1', members: [{id: 'n1'}, {id: 'n-2'}]}),
                graph = iD.coreGraph([n1]).replace(n2).replace(r1);

            graph = iD.actionRevert('r-1')(graph);
            expect(graph.hasEntity('r-1'), 'r-1 removed').to.be.undefined;
            expect(graph.hasEntity('n1'), 'n1 unchanged').to.equal(n1);
            expect(graph.hasEntity('n-2'), 'n-2 unchanged').to.equal(n2);
            expect(graph.parentRelations(n1), 'n1 has no parent relations').to.be.empty;
            expect(graph.parentRelations(n2), 'n-2 has no parent relations').to.be.empty;
        });

        it('reverts an updated relation, preserves new and existing members', function() {
            var n1 = iD.osmNode({id: 'n1'}),
                n2 = iD.osmNode({id: 'n-2'}),
                r1 = iD.osmRelation({id: 'r1', members: [{id: 'n1'}]}),
                r1up = r1.addMember({id: 'n-2'}, 1),
                graph = iD.coreGraph([n1, r1]).replace(n2).replace(r1up);

            graph = iD.actionRevert('r1')(graph);
            expect(graph.hasEntity('r1'), 'r1 reverted').to.equal(r1);
            expect(graph.hasEntity('n1'), 'n1 unchanged').to.equal(n1);
            expect(graph.hasEntity('n-2'), 'n-2 unchanged').to.equal(n2);
            expect(graph.parentRelations(n1), 'n1 has r1 as parent relation').to.deep.equal([r1]);
            expect(graph.parentRelations(n2), 'n-2 has no parent relations').to.be.empty;
        });

        it('restores a deleted relation, preserves new and existing members', function() {
            var n1 = iD.osmNode({id: 'n1'}),
                n2 = iD.osmNode({id: 'n-2'}),
                r1 = iD.osmRelation({id: 'r1', members: [{id: 'n1'}]}),
                r1up = r1.addMember({id: 'n-2'}, 1),
                graph = iD.coreGraph([n1, r1]).replace(n2).replace(r1up).remove(r1up);

            graph = iD.actionRevert('r1')(graph);
            expect(graph.hasEntity('r1'), 'r1 reverted').to.equal(r1);
            expect(graph.hasEntity('n1'), 'n1 unchanged').to.equal(n1);
            expect(graph.hasEntity('n-2'), 'n-2 unchanged').to.equal(n2);
            expect(graph.parentRelations(n1), 'n1 has r1 as parent relation').to.deep.equal([r1]);
            expect(graph.parentRelations(n2), 'n-2 has no parent relations').to.be.empty;
        });
    });

});
