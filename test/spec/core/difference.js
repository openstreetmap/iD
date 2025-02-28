describe('iD.coreDifference', function () {
    describe('#changes', function () {
        it('includes created entities', function () {
            const node = iD.osmNode({id: 'n'});
            const base = iD.coreGraph();
            const head = base.replace(node);
            const diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({n: {base: undefined, head: node}});
        });

        it('includes undone created entities', function () {
            const node = iD.osmNode({id: 'n'});
            const base = iD.coreGraph();
            const head = base.replace(node);
            const diff = iD.coreDifference(head, base);
            expect(diff.changes()).to.eql({n: {base: node, head: undefined}});
        });

        it('includes modified entities', function () {
            const n1 = iD.osmNode({id: 'n'});
            const n2 = n1.update({ tags: { yes: 'no' } });
            const base = iD.coreGraph([n1]);
            const head = base.replace(n2);
            const diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({n: {base: n1, head: n2}});
        });

        it('includes undone modified entities', function () {
            const n1 = iD.osmNode({id: 'n'});
            const n2 = n1.update({ tags: { yes: 'no' } });
            const base = iD.coreGraph([n1]);
            const head = base.replace(n2);
            const diff = iD.coreDifference(head, base);
            expect(diff.changes()).to.eql({n: {base: n2, head: n1}});
        });

        it('doesn\'t include updated but identical entities', function () {
            const n1 = iD.osmNode({id: 'n'});
            const n2 = n1.update();
            const base = iD.coreGraph([n1]);
            const head = base.replace(n2);
            const diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({});
        });

        it('includes deleted entities', function () {
            const node = iD.osmNode({id: 'n'});
            const base = iD.coreGraph([node]);
            const head = base.remove(node);
            const diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({n: {base: node, head: undefined}});
        });

        it('includes undone deleted entities', function () {
            const node = iD.osmNode({id: 'n'});
            const base = iD.coreGraph([node]);
            const head = base.remove(node);
            const diff = iD.coreDifference(head, base);
            expect(diff.changes()).to.eql({n: {base: undefined, head: node}});
        });

        it('doesn\'t include created entities that were subsequently deleted', function () {
            const node = iD.osmNode();
            const base = iD.coreGraph();
            const head = base.replace(node).remove(node);
            const diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({});
        });

        it('doesn\'t include created entities that were subsequently reverted', function () {
            const node = iD.osmNode({id: 'n-1'});
            const base = iD.coreGraph();
            const head = base.replace(node).revert('n-1');
            const diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({});
        });

        it('doesn\'t include modified entities that were subsequently reverted', function () {
            const n1 = iD.osmNode({id: 'n'});
            const n2 = n1.update({ tags: { yes: 'no' } });
            const base = iD.coreGraph([n1]);
            const head = base.replace(n2).revert('n');
            const diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({});
        });

        it('doesn\'t include deleted entities that were subsequently reverted', function () {
            const node = iD.osmNode({id: 'n'});
            const base = iD.coreGraph([node]);
            const head = base.remove(node).revert('n');
            const diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({});
        });
    });

    describe('#extantIDs', function () {
        it('includes the ids of created entities', function () {
            const node = iD.osmNode({id: 'n'});
            const base = iD.coreGraph();
            const head = base.replace(node);
            const diff = iD.coreDifference(base, head);
            expect(diff.extantIDs()).to.eql(['n']);
        });

        it('includes the ids of modified entities', function () {
            const n1 = iD.osmNode({id: 'n'});
            const n2 = n1.move([1, 2]);
            const base = iD.coreGraph([n1]);
            const head = base.replace(n2);
            const diff = iD.coreDifference(base, head);
            expect(diff.extantIDs()).to.eql(['n']);
        });

        it('omits the ids of deleted entities', function () {
            const node = iD.osmNode({id: 'n'});
            const base = iD.coreGraph([node]);
            const head = base.remove(node);
            const diff = iD.coreDifference(base, head);
            expect(diff.extantIDs()).to.eql([]);
        });

        it('omits the ids of members of modified relations by default', function () {
            const w1 = iD.osmWay({id: 'w1'});
            const w2 = iD.osmWay({id: 'w2'});
            const r1 = iD.osmRelation({
                id: 'r',
                tags: { type: 'multipolygon' },
                members: [{role: 'outer', id: 'w1', type: 'way'}, {role: '', id: 'w2', type: 'way'}]
            });
            const r2 = r1.update({ tags: { type: 'multipolygon', landuse: 'residential' }});
            const base = iD.coreGraph([r1, w1, w2]);
            const head = base.replace(r2);
            const diff = iD.coreDifference(base, head);
            expect(diff.extantIDs()).to.eql(['r']);
        });

        it('includes the ids of members of modified relations with option', function () {
            const w1 = iD.osmWay({id: 'w1'});
            const w2 = iD.osmWay({id: 'w2'});
            const r1 = iD.osmRelation({
                id: 'r',
                tags: { type: 'multipolygon' },
                members: [{role: 'outer', id: 'w1', type: 'way'}, {role: '', id: 'w2', type: 'way'}]
            });
            const r2 = r1.update({ tags: { type: 'multipolygon', landuse: 'residential' }});
            const base = iD.coreGraph([r1, w1, w2]);
            const head = base.replace(r2);
            const diff = iD.coreDifference(base, head);
            expect(diff.extantIDs(true)).to.eql(['r', 'w1', 'w2']);
        });
    });

    describe('#created', function () {
        it('returns an array of created entities', function () {
            const node = iD.osmNode({id: 'n'});
            const base = iD.coreGraph();
            const head = base.replace(node);
            const diff = iD.coreDifference(base, head);
            expect(diff.created()).to.eql([node]);
        });
    });

    describe('#modified', function () {
        it('returns an array of modified entities', function () {
            const n1 = iD.osmNode({id: 'n'});
            const n2 = n1.move([1, 2]);
            const base = iD.coreGraph([n1]);
            const head = base.replace(n2);
            const diff = iD.coreDifference(base, head);
            expect(diff.modified()).to.eql([n2]);
        });
    });

    describe('#deleted', function () {
        it('returns an array of deleted entities', function () {
            const node = iD.osmNode({id: 'n'});
            const base = iD.coreGraph([node]);
            const head = base.remove(node);
            const diff = iD.coreDifference(base, head);
            expect(diff.deleted()).to.eql([node]);
        });
    });

    describe('#summary', function () {
        const base = iD.coreGraph([
            iD.osmNode({id: 'a', tags: {crossing: 'marked'}}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'v'}),
            iD.osmWay({id: '-', nodes: ['a', 'b']})
        ]);

        it('reports a created way as created', function() {
            const way = iD.osmWay({id: '+'});
            const head = base.replace(way);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'created',
                entity: way,
                graph: head
            }]);
        });

        it('reports a deleted way as deleted', function() {
            const way = base.entity('-');
            const head = base.remove(way);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'deleted',
                entity: way,
                graph: base
            }]);
        });

        it('reports a modified way as modified', function() {
            const way = base.entity('-').mergeTags({highway: 'primary'});
            const head = base.replace(way);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: way,
                graph: head
            }]);
        });

        it('reports a way as modified when a member vertex is moved', function() {
            const vertex = base.entity('b').move([0,3]);
            const head = base.replace(vertex);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: head.entity('-'),
                graph: head
            }]);
        });

        it('reports a way as modified when a member vertex is added', function() {
            const vertex = iD.osmNode({id: 'c'});
            const way = base.entity('-').addNode('c');
            const head = base.replace(vertex).replace(way);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: way,
                graph: head
            }]);
        });

        it('reports a way as modified when a member vertex is removed', function() {
            const way = base.entity('-').removeNode('b');
            const head = base.replace(way);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: way,
                graph: head
            }]);
        });

        it('reports a created way containing a moved vertex as being created', function() {
            const vertex = base.entity('b').move([0,3]);
            const way = iD.osmWay({id: '+', nodes: ['b']});
            const head = base.replace(way).replace(vertex);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'created',
                entity: way,
                graph: head
            }, {
                changeType: 'modified',
                entity: head.entity('-'),
                graph: head
            }]);
        });

        it('reports a created way with a created vertex as being created', function() {
            const vertex = iD.osmNode({id: 'c'});
            const way = iD.osmWay({id: '+', nodes: ['c']});
            const head = base.replace(vertex).replace(way);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'created',
                entity: way,
                graph: head
            }]);
        });

        it('reports a vertex as modified when it has tags and they are changed', function() {
            const vertex = base.entity('a').mergeTags({highway: 'traffic_signals'});
            const head = base.replace(vertex);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: vertex,
                graph: head
            }]);
        });

        it('reports a vertex as modified when it has tags and is moved', function() {
            const vertex = base.entity('a').move([1, 2]);
            const head = base.replace(vertex);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: head.entity('-'),
                graph: head
            }, {
                changeType: 'modified',
                entity: vertex,
                graph: head
            }]);
        });

        it('does not report a vertex as modified when it is moved and has no-op tag changes', function() {
            const vertex = base.entity('b').update({tags: {}, loc: [1, 2]});
            const head = base.replace(vertex);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: head.entity('-'),
                graph: head
            }]);
        });

        it('reports a vertex as deleted when it had tags', function() {
            const vertex = base.entity('v');
            const head = base.remove(vertex);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'deleted',
                entity: vertex,
                graph: base
            }]);
        });

        it('reports a vertex as created when it has tags', function() {
            const vertex = iD.osmNode({id: 'c', tags: {crossing: 'marked'}});
            const way = base.entity('-').addNode('c');
            const head = base.replace(way).replace(vertex);
            const diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: way,
                graph: head
            }, {
                changeType: 'created',
                entity: vertex,
                graph: head
            }]);
        });
    });

    describe('#complete', function () {
        it('includes created entities', function () {
            const node = iD.osmNode({id: 'n'});
            const base = iD.coreGraph();
            const head = base.replace(node);
            const diff = iD.coreDifference(base, head);
            expect(diff.complete().n).to.equal(node);
        });

        it('includes modified entities', function () {
            const n1 = iD.osmNode({id: 'n'});
            const n2 = n1.move([1, 2]);
            const base = iD.coreGraph([n1]);
            const head = base.replace(n2);
            const diff = iD.coreDifference(base, head);
            expect(diff.complete().n).to.equal(n2);
        });

        it('includes deleted entities', function () {
            const node = iD.osmNode({id: 'n'});
            const base = iD.coreGraph([node]);
            const head = base.remove(node);
            const diff = iD.coreDifference(base, head);
            expect(diff.complete()).to.eql({n: undefined});
        });

        it('includes nodes added to a way', function () {
            const n1 = iD.osmNode({id: 'n1'});
            const n2 = iD.osmNode({id: 'n2'});
            const w1 = iD.osmWay({id: 'w', nodes: ['n1']});
            const w2 = w1.addNode('n2');
            const base = iD.coreGraph([n1, n2, w1]);
            const head = base.replace(w2);
            const diff = iD.coreDifference(base, head);

            expect(diff.complete().n2).to.equal(n2);
        });

        it('includes nodes removed from a way', function () {
            const n1 = iD.osmNode({id: 'n1'});
            const n2 = iD.osmNode({id: 'n2'});
            const w1 = iD.osmWay({id: 'w', nodes: ['n1', 'n2']});
            const w2 = w1.removeNode('n2');
            const base = iD.coreGraph([n1, n2, w1]);
            const head = base.replace(w2);
            const diff = iD.coreDifference(base, head);

            expect(diff.complete().n2).to.equal(n2);
        });

        it('includes multipolygon members', function () {
            const w1 = iD.osmWay({id: 'w1'});
            const w2 = iD.osmWay({id: 'w2'});
            const r1 = iD.osmRelation({
                id: 'r',
                tags: { type: 'multipolygon' },
                members: [{role: 'outer', id: 'w1', type: 'way'}, {role: '', id: 'w2', type: 'way'}]
            });
            const r2 = r1.updateMember({role: 'inner', id: 'w2', type: 'way'}, 1);
            const base = iD.coreGraph([w1, w2, r1]);
            const head = base.replace(r2);
            const diff = iD.coreDifference(base, head);

            expect(diff.complete().w2).to.equal(w2);
        });

        it('includes parent ways of modified nodes', function () {
            const n1   = iD.osmNode({id: 'n'});
            const n2   = n1.move([1, 2]);
            const way  = iD.osmWay({id: 'w', nodes: ['n']});
            const base = iD.coreGraph([n1, way]);
            const head = base.replace(n2);
            const diff = iD.coreDifference(base, head);

            expect(diff.complete().w).to.equal(way);
        });

        it('includes parent relations of modified entities', function () {
            const n1   = iD.osmNode({id: 'n'});
            const n2   = n1.move([1, 2]);
            const rel  = iD.osmRelation({id: 'r', members: [{id: 'n'}]});
            const base = iD.coreGraph([n1, rel]);
            const head = base.replace(n2);
            const diff = iD.coreDifference(base, head);

            expect(diff.complete().r).to.equal(rel);
        });

        it('includes parent relations of modified entities, recursively', function () {
            const n1   = iD.osmNode({id: 'n'});
            const n2   = n1.move([1, 2]);
            const rel1 = iD.osmRelation({id: 'r1', members: [{id: 'n'}]});
            const rel2 = iD.osmRelation({id: 'r2', members: [{id: 'r1'}]});
            const base = iD.coreGraph([n1, rel1, rel2]);
            const head = base.replace(n2);
            const diff = iD.coreDifference(base, head);

            expect(diff.complete().r2).to.equal(rel2);
        });

        it('includes parent relations of parent ways of modified nodes', function () {
            const n1   = iD.osmNode({id: 'n'});
            const n2   = n1.move([1, 2]);
            const way  = iD.osmWay({id: 'w', nodes: ['n']});
            const rel  = iD.osmRelation({id: 'r', members: [{id: 'w'}]});
            const base = iD.coreGraph([n1, way, rel]);
            const head = base.replace(n2);
            const diff = iD.coreDifference(base, head);

            expect(diff.complete().r).to.equal(rel);
        });

        it('copes with recursive relations', function () {
            const node = iD.osmNode({id: 'n'});
            const rel1 = iD.osmRelation({id: 'r1', members: [{id: 'n'}, {id: 'r2'}]});
            const rel2 = iD.osmRelation({id: 'r2', members: [{id: 'r1'}]});
            const base = iD.coreGraph([node, rel1, rel2]);
            const head = base.replace(node.move([1, 2]));
            const diff = iD.coreDifference(base, head);

            expect(diff.complete()).to.be.ok;
        });

        it.todo('limits changes to those within a given extent');
    });
});
