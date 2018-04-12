describe('iD.actionConnect', function() {
    it('chooses the first non-new node as the survivor', function() {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b', version: '1'}),
            iD.osmNode({id: 'c', version: '1'})
        ]);

        graph = iD.actionConnect(['a', 'b', 'c'])(graph);
        expect(graph.hasEntity('a')).not.to.be.ok;
        expect(graph.hasEntity('b')).to.be.ok;
        expect(graph.hasEntity('c')).not.to.be.ok;
    });

    it('chooses the last node as the survivor when all are new', function() {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'})
        ]);

        graph = iD.actionConnect(['a', 'b', 'c'])(graph);
        expect(graph.hasEntity('a')).not.to.be.ok;
        expect(graph.hasEntity('b')).not.to.be.ok;
        expect(graph.hasEntity('c')).to.be.ok;
    });


    it('replaces non-surviving nodes in parent ways', function() {
        // a --- b --- c
        //
        //       e
        //       |
        //       d
        //
        // Connect [e, b].
        //
        // Expected result:
        //
        // a --- b --- c
        //       |
        //       d
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmNode({id: 'd'}),
            iD.osmNode({id: 'e'}),
            iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
            iD.osmWay({id: '|', nodes: ['d', 'e']})
        ]);

        graph = iD.actionConnect(['e', 'b'])(graph);
        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('|').nodes).to.eql(['d', 'b']);
    });

    it('handles circular ways', function() {
        // c -- a   d === e
        // |   /
        // |  /
        // | /
        // b
        //
        // Connect [a, d].
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmNode({id: 'd'}),
            iD.osmNode({id: 'e'}),
            iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'a']}),
            iD.osmWay({id: '=', nodes: ['d', 'e']})
        ]);

        graph = iD.actionConnect(['a', 'd'])(graph);
        expect(graph.entity('-').nodes).to.eql(['d', 'b', 'c', 'd']);
    });

    it('merges adjacent nodes', function() {
        // a --- b --- c
        //
        // Connect [b, c]
        //
        // Expected result:
        //
        // a --- c
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmWay({id: '-', nodes: ['a', 'b', 'c']})
        ]);

        graph = iD.actionConnect(['b', 'c'])(graph);
        expect(graph.entity('-').nodes).to.eql(['a', 'c']);
        expect(graph.hasEntity('b')).to.be.undefined;
    });

    it('merges adjacent nodes with connections', function() {
        // a --- b --- c
        //       |
        //       d
        //
        // Connect [b, c]
        //
        // Expected result:
        //
        // a --- c
        //       |
        //       d
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmNode({id: 'c'}),
            iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
            iD.osmWay({id: '|', nodes: ['b', 'd']})
        ]);

        graph = iD.actionConnect(['b', 'c'])(graph);
        expect(graph.entity('-').nodes).to.eql(['a', 'c']);
        expect(graph.entity('|').nodes).to.eql(['c', 'd']);
        expect(graph.hasEntity('b')).to.be.undefined;
    });

    it('deletes a degenerate way', function() {
        // a --- b
        //
        // Connect [a, b]
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmWay({id: '-', nodes: ['a', 'b']})
        ]);

        graph = iD.actionConnect(['a', 'b'])(graph);
        expect(graph.hasEntity('a')).to.be.undefined;
        expect(graph.hasEntity('-')).to.be.undefined;
    });

    it('merges tags to the surviving node', function() {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', tags: {a: 'a'}}),
            iD.osmNode({id: 'b', tags: {b: 'b'}}),
            iD.osmNode({id: 'c', tags: {c: 'c'}})
        ]);

        graph = iD.actionConnect(['a', 'b', 'c'])(graph);
        expect(graph.entity('c').tags).to.eql({a: 'a', b: 'b', c: 'c'});
    });

    it('merges memberships to the surviving node', function() {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmNode({id: 'c'}),
            iD.osmWay({id: '-', nodes: ['a', 'b']}),
            iD.osmWay({id: '=', nodes: ['c', 'd']}),
            iD.osmRelation({id: 'r1', members: [{id: 'b', role: 'r1', type: 'node'}]}),
            iD.osmRelation({id: 'r2', members: [{id: 'b', role: 'r2', type: 'node'}, {id: 'c', role: 'r2', type: 'node'}]})
        ]);

        graph = iD.actionConnect(['b', 'c'])(graph);
        expect(graph.entity('r1').members).to.eql([{id: 'c', role: 'r1', type: 'node'}]);
        expect(graph.entity('r2').members).to.eql([{id: 'c', role: 'r2', type: 'node'}]);
    });


    describe('#disabled', function () {
        it('returns falsy when connecting members of the same relation and same roles (different ways)', function () {
            //
            //  "Route 1"   "Route 1"
            //  'forward'   'forward'
            //  a ----- b   c ===== d
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['c', 'd']}),
                iD.osmRelation({id: 'r1', tags: { name: 'Route 1'}, members: [
                    { id: '-', type: 'way', role: 'forward' },
                    { id: '=', type: 'way', role: 'forward' }
                ]})
            ]);

            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.be.not.ok;
        });

        it('returns falsy when connecting members of the different relation and different roles (different ways)', function () {
            //
            //  "Route 1"   "Route 2"
            //  'forward'   'backward'
            //  a ----- b   c ===== d
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['c', 'd']}),
                iD.osmRelation({id: 'r1', tags: { name: 'Route 1'}, members: [
                    { id: '-', type: 'way', role: 'forward' }
                ]}),
                iD.osmRelation({id: 'r2', tags: { name: 'Route 2'}, members: [
                    { id: '=', type: 'way', role: 'backward' }
                ]})
            ]);

            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.be.not.ok;
        });

        it('returns \'relation\' when connecting members of the same relation but different roles (different ways)', function () {
            //
            //  "Route 1"   "Route 1"
            //  'forward'   'backward'
            //  a ----- b   c ===== d
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['c', 'd']}),
                iD.osmRelation({id: 'r1', tags: { name: 'Route 1'}, members: [
                    { id: '-', type: 'way', role: 'forward' },
                    { id: '=', type: 'way', role: 'backward' }
                ]})
            ]);

            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.eql('relation');
        });

        it('returns \'relation\' when connecting members of the same relation but different roles (joined way)', function () {
            //
            //   from   via    to
            //  a --- b === c ~~~ d
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmWay({id: '~', nodes: ['c', 'd']}),
                iD.osmRelation({id: 'r', members: [
                    { id: '-', type: 'way', role: 'from' },
                    { id: '=', type: 'way', role: 'via' },
                    { id: '~', type: 'way', role: 'to' }
                ]})
            ]);

            expect(iD.actionConnect(['a', 'b']).disabled(graph)).to.eql('relation');
            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.eql('relation');
            expect(iD.actionConnect(['c', 'd']).disabled(graph)).to.eql('relation');
        });
    });

});
