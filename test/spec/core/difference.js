describe('iD.coreDifference', function () {
    describe('#changes', function () {
        it('includes created entities', function () {
            var node = iD.osmNode({id: 'n'});
            var base = iD.coreGraph();
            var head = base.replace(node);
            var diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({n: {base: undefined, head: node}});
        });

        it('includes undone created entities', function () {
            var node = iD.osmNode({id: 'n'});
            var base = iD.coreGraph();
            var head = base.replace(node);
            var diff = iD.coreDifference(head, base);
            expect(diff.changes()).to.eql({n: {base: node, head: undefined}});
        });

        it('includes modified entities', function () {
            var n1 = iD.osmNode({id: 'n'});
            var n2 = n1.update({ tags: { yes: 'no' } });
            var base = iD.coreGraph([n1]);
            var head = base.replace(n2);
            var diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({n: {base: n1, head: n2}});
        });

        it('includes undone modified entities', function () {
            var n1 = iD.osmNode({id: 'n'});
            var n2 = n1.update({ tags: { yes: 'no' } });
            var base = iD.coreGraph([n1]);
            var head = base.replace(n2);
            var diff = iD.coreDifference(head, base);
            expect(diff.changes()).to.eql({n: {base: n2, head: n1}});
        });

        it('doesn\'t include updated but identical entities', function () {
            var n1 = iD.osmNode({id: 'n'});
            var n2 = n1.update();
            var base = iD.coreGraph([n1]);
            var head = base.replace(n2);
            var diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({});
        });

        it('includes deleted entities', function () {
            var node = iD.osmNode({id: 'n'});
            var base = iD.coreGraph([node]);
            var head = base.remove(node);
            var diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({n: {base: node, head: undefined}});
        });

        it('includes undone deleted entities', function () {
            var node = iD.osmNode({id: 'n'});
            var base = iD.coreGraph([node]);
            var head = base.remove(node);
            var diff = iD.coreDifference(head, base);
            expect(diff.changes()).to.eql({n: {base: undefined, head: node}});
        });

        it('doesn\'t include created entities that were subsequently deleted', function () {
            var node = iD.osmNode();
            var base = iD.coreGraph();
            var head = base.replace(node).remove(node);
            var diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({});
        });

        it('doesn\'t include created entities that were subsequently reverted', function () {
            var node = iD.osmNode({id: 'n-1'});
            var base = iD.coreGraph();
            var head = base.replace(node).revert('n-1');
            var diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({});
        });

        it('doesn\'t include modified entities that were subsequently reverted', function () {
            var n1 = iD.osmNode({id: 'n'});
            var n2 = n1.update({ tags: { yes: 'no' } });
            var base = iD.coreGraph([n1]);
            var head = base.replace(n2).revert('n');
            var diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({});
        });

        it('doesn\'t include deleted entities that were subsequently reverted', function () {
            var node = iD.osmNode({id: 'n'});
            var base = iD.coreGraph([node]);
            var head = base.remove(node).revert('n');
            var diff = iD.coreDifference(base, head);
            expect(diff.changes()).to.eql({});
        });
    });

    describe('#extantIDs', function () {
        it('includes the ids of created entities', function () {
            var node = iD.osmNode({id: 'n'});
            var base = iD.coreGraph();
            var head = base.replace(node);
            var diff = iD.coreDifference(base, head);
            expect(diff.extantIDs()).to.eql(['n']);
        });

        it('includes the ids of modified entities', function () {
            var n1 = iD.osmNode({id: 'n'});
            var n2 = n1.move([1, 2]);
            var base = iD.coreGraph([n1]);
            var head = base.replace(n2);
            var diff = iD.coreDifference(base, head);
            expect(diff.extantIDs()).to.eql(['n']);
        });

        it('omits the ids of deleted entities', function () {
            var node = iD.osmNode({id: 'n'});
            var base = iD.coreGraph([node]);
            var head = base.remove(node);
            var diff = iD.coreDifference(base, head);
            expect(diff.extantIDs()).to.eql([]);
        });

        it('omits the ids of members of modified relations by default', function () {
            var w1 = iD.osmWay({id: 'w1'});
            var w2 = iD.osmWay({id: 'w2'});
            var r1 = iD.osmRelation({
                id: 'r',
                tags: { type: 'multipolygon' },
                members: [{role: 'outer', id: 'w1', type: 'way'}, {role: '', id: 'w2', type: 'way'}]
            });
            var r2 = r1.update({ tags: { type: 'multipolygon', landuse: 'residential' }});
            var base = iD.coreGraph([r1, w1, w2]);
            var head = base.replace(r2);
            var diff = iD.coreDifference(base, head);
            expect(diff.extantIDs()).to.eql(['r']);
        });

        it('includes the ids of members of modified relations with option', function () {
            var w1 = iD.osmWay({id: 'w1'});
            var w2 = iD.osmWay({id: 'w2'});
            var r1 = iD.osmRelation({
                id: 'r',
                tags: { type: 'multipolygon' },
                members: [{role: 'outer', id: 'w1', type: 'way'}, {role: '', id: 'w2', type: 'way'}]
            });
            var r2 = r1.update({ tags: { type: 'multipolygon', landuse: 'residential' }});
            var base = iD.coreGraph([r1, w1, w2]);
            var head = base.replace(r2);
            var diff = iD.coreDifference(base, head);
            expect(diff.extantIDs(true)).to.eql(['r', 'w1', 'w2']);
        });
    });

    describe('#created', function () {
        it('returns an array of created entities', function () {
            var node = iD.osmNode({id: 'n'});
            var base = iD.coreGraph();
            var head = base.replace(node);
            var diff = iD.coreDifference(base, head);
            expect(diff.created()).to.eql([node]);
        });
    });

    describe('#modified', function () {
        it('returns an array of modified entities', function () {
            var n1 = iD.osmNode({id: 'n'});
            var n2 = n1.move([1, 2]);
            var base = iD.coreGraph([n1]);
            var head = base.replace(n2);
            var diff = iD.coreDifference(base, head);
            expect(diff.modified()).to.eql([n2]);
        });
    });

    describe('#deleted', function () {
        it('returns an array of deleted entities', function () {
            var node = iD.osmNode({id: 'n'});
            var base = iD.coreGraph([node]);
            var head = base.remove(node);
            var diff = iD.coreDifference(base, head);
            expect(diff.deleted()).to.eql([node]);
        });
    });

    describe('#summary', function () {
        var base = iD.coreGraph([
            iD.osmNode({id: 'a', tags: {crossing: 'marked'}}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'v'}),
            iD.osmWay({id: '-', nodes: ['a', 'b']})
        ]);

        it('reports a created way as created', function() {
            var way = iD.osmWay({id: '+'});
            var head = base.replace(way);
            var diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'created',
                entity: way,
                graph: head
            }]);
        });

        it('reports a deleted way as deleted', function() {
            var way = base.entity('-');
            var head = base.remove(way);
            var diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'deleted',
                entity: way,
                graph: base
            }]);
        });

        it('reports a modified way as modified', function() {
            var way = base.entity('-').mergeTags({highway: 'primary'});
            var head = base.replace(way);
            var diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: way,
                graph: head
            }]);
        });

        it('reports a way as modified when a member vertex is moved', function() {
            var vertex = base.entity('b').move([0,3]);
            var head = base.replace(vertex);
            var diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: head.entity('-'),
                graph: head
            }]);
        });

        it('reports a way as modified when a member vertex is added', function() {
            var vertex = iD.osmNode({id: 'c'});
            var way = base.entity('-').addNode('c');
            var head = base.replace(vertex).replace(way);
            var diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: way,
                graph: head
            }]);
        });

        it('reports a way as modified when a member vertex is removed', function() {
            var way = base.entity('-').removeNode('b');
            var head = base.replace(way);
            var diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: way,
                graph: head
            }]);
        });

        it('reports a created way containing a moved vertex as being created', function() {
            var vertex = base.entity('b').move([0,3]);
            var way = iD.osmWay({id: '+', nodes: ['b']});
            var head = base.replace(way).replace(vertex);
            var diff = iD.coreDifference(base, head);

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
            var vertex = iD.osmNode({id: 'c'});
            var way = iD.osmWay({id: '+', nodes: ['c']});
            var head = base.replace(vertex).replace(way);
            var diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'created',
                entity: way,
                graph: head
            }]);
        });

        it('reports a vertex as modified when it has tags and they are changed', function() {
            var vertex = base.entity('a').mergeTags({highway: 'traffic_signals'});
            var head = base.replace(vertex);
            var diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: vertex,
                graph: head
            }]);
        });

        it('reports a vertex as modified when it has tags and is moved', function() {
            var vertex = base.entity('a').move([1, 2]);
            var head = base.replace(vertex);
            var diff = iD.coreDifference(base, head);

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
            var vertex = base.entity('b').update({tags: {}, loc: [1, 2]});
            var head = base.replace(vertex);
            var diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'modified',
                entity: head.entity('-'),
                graph: head
            }]);
        });

        it('reports a vertex as deleted when it had tags', function() {
            var vertex = base.entity('v');
            var head = base.remove(vertex);
            var diff = iD.coreDifference(base, head);

            expect(diff.summary()).to.eql([{
                changeType: 'deleted',
                entity: vertex,
                graph: base
            }]);
        });

        it('reports a vertex as created when it has tags', function() {
            var vertex = iD.osmNode({id: 'c', tags: {crossing: 'marked'}});
            var way = base.entity('-').addNode('c');
            var head = base.replace(way).replace(vertex);
            var diff = iD.coreDifference(base, head);

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
            var node = iD.osmNode({id: 'n'});
            var base = iD.coreGraph();
            var head = base.replace(node);
            var diff = iD.coreDifference(base, head);
            expect(diff.complete().n).to.equal(node);
        });

        it('includes modified entities', function () {
            var n1 = iD.osmNode({id: 'n'});
            var n2 = n1.move([1, 2]);
            var base = iD.coreGraph([n1]);
            var head = base.replace(n2);
            var diff = iD.coreDifference(base, head);
            expect(diff.complete().n).to.equal(n2);
        });

        it('includes deleted entities', function () {
            var node = iD.osmNode({id: 'n'});
            var base = iD.coreGraph([node]);
            var head = base.remove(node);
            var diff = iD.coreDifference(base, head);
            expect(diff.complete()).to.eql({n: undefined});
        });

        it('includes nodes added to a way', function () {
            var n1 = iD.osmNode({id: 'n1'});
            var n2 = iD.osmNode({id: 'n2'});
            var w1 = iD.osmWay({id: 'w', nodes: ['n1']});
            var w2 = w1.addNode('n2');
            var base = iD.coreGraph([n1, n2, w1]);
            var head = base.replace(w2);
            var diff = iD.coreDifference(base, head);

            expect(diff.complete().n2).to.equal(n2);
        });

        it('includes nodes removed from a way', function () {
            var n1 = iD.osmNode({id: 'n1'});
            var n2 = iD.osmNode({id: 'n2'});
            var w1 = iD.osmWay({id: 'w', nodes: ['n1', 'n2']});
            var w2 = w1.removeNode('n2');
            var base = iD.coreGraph([n1, n2, w1]);
            var head = base.replace(w2);
            var diff = iD.coreDifference(base, head);

            expect(diff.complete().n2).to.equal(n2);
        });

        it('includes multipolygon members', function () {
            var w1 = iD.osmWay({id: 'w1'});
            var w2 = iD.osmWay({id: 'w2'});
            var r1 = iD.osmRelation({
                id: 'r',
                tags: { type: 'multipolygon' },
                members: [{role: 'outer', id: 'w1', type: 'way'}, {role: '', id: 'w2', type: 'way'}]
            });
            var r2 = r1.updateMember({role: 'inner', id: 'w2', type: 'way'}, 1);
            var base = iD.coreGraph([w1, w2, r1]);
            var head = base.replace(r2);
            var diff = iD.coreDifference(base, head);

            expect(diff.complete().w2).to.equal(w2);
        });

        it('includes parent ways of modified nodes', function () {
            var n1   = iD.osmNode({id: 'n'});
            var n2   = n1.move([1, 2]);
            var way  = iD.osmWay({id: 'w', nodes: ['n']});
            var base = iD.coreGraph([n1, way]);
            var head = base.replace(n2);
            var diff = iD.coreDifference(base, head);

            expect(diff.complete().w).to.equal(way);
        });

        it('includes parent relations of modified entities', function () {
            var n1   = iD.osmNode({id: 'n'});
            var n2   = n1.move([1, 2]);
            var rel  = iD.osmRelation({id: 'r', members: [{id: 'n'}]});
            var base = iD.coreGraph([n1, rel]);
            var head = base.replace(n2);
            var diff = iD.coreDifference(base, head);

            expect(diff.complete().r).to.equal(rel);
        });

        it('includes parent relations of modified entities, recursively', function () {
            var n1   = iD.osmNode({id: 'n'});
            var n2   = n1.move([1, 2]);
            var rel1 = iD.osmRelation({id: 'r1', members: [{id: 'n'}]});
            var rel2 = iD.osmRelation({id: 'r2', members: [{id: 'r1'}]});
            var base = iD.coreGraph([n1, rel1, rel2]);
            var head = base.replace(n2);
            var diff = iD.coreDifference(base, head);

            expect(diff.complete().r2).to.equal(rel2);
        });

        it('includes parent relations of parent ways of modified nodes', function () {
            var n1   = iD.osmNode({id: 'n'});
            var n2   = n1.move([1, 2]);
            var way  = iD.osmWay({id: 'w', nodes: ['n']});
            var rel  = iD.osmRelation({id: 'r', members: [{id: 'w'}]});
            var base = iD.coreGraph([n1, way, rel]);
            var head = base.replace(n2);
            var diff = iD.coreDifference(base, head);

            expect(diff.complete().r).to.equal(rel);
        });

        it('copes with recursive relations', function () {
            var node = iD.osmNode({id: 'n'});
            var rel1 = iD.osmRelation({id: 'r1', members: [{id: 'n'}, {id: 'r2'}]});
            var rel2 = iD.osmRelation({id: 'r2', members: [{id: 'r1'}]});
            var base = iD.coreGraph([node, rel1, rel2]);
            var head = base.replace(node.move([1, 2]));
            var diff = iD.coreDifference(base, head);

            expect(diff.complete()).to.be.ok;
        });

        it('limits changes to those within a given extent');
    });
});
