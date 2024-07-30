describe('iD.actionConnect', function() {
    it('merges tags', function() {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', tags: { highway: 'traffic_signals' }}),
            iD.osmNode({id: 'b', tags: { crossing: 'marked' }}),
        ]);

        graph = iD.actionConnect(['a', 'b'])(graph);
        expect(graph.hasEntity('a')).not.to.be.ok;

        var survivor = graph.hasEntity('b');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
        expect(survivor.tags).to.eql({ highway: 'traffic_signals', crossing: 'marked' }, 'merge all tags');
    });

    it('chooses the oldest node as the survivor', function() {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'n3'}),
            iD.osmNode({id: 'n-1'}),
            iD.osmNode({id: 'n2'}),
            iD.osmNode({id: 'n4'})
        ]);

        graph = iD.actionConnect(['n3', 'n-1', 'n2', 'n4'])(graph);
        expect(graph.hasEntity('n3')).not.to.be.ok;
        expect(graph.hasEntity('n-1')).not.to.be.ok;
        expect(graph.hasEntity('n2')).to.be.ok;
        expect(graph.hasEntity('n4')).not.to.be.ok;
    });

    it('chooses the oldest interesting node as the survivor', function() {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'n3'}),
            iD.osmNode({id: 'n1'}),
            iD.osmNode({id: 'n2', tags: { highway: 'traffic_signals' }}),
            iD.osmNode({id: 'n4', tags: { crossing: 'marked' }})
        ]);

        graph = iD.actionConnect(['n3', 'n1', 'n2', 'n4'])(graph);

        expect(graph.hasEntity('n3')).not.to.be.ok;
        expect(graph.hasEntity('n1')).not.to.be.ok;
        expect(graph.hasEntity('n4')).not.to.be.ok;

        var survivor = graph.hasEntity('n2');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
        expect(survivor.tags).to.eql({ highway: 'traffic_signals', crossing: 'marked' }, 'merge all tags');
    });

    it('chooses an existing node as the survivor', function() {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'n3'}),
            iD.osmNode({id: 'n-1'}),
            iD.osmNode({id: 'n-2', tags: { highway: 'traffic_signals' }}),
            iD.osmNode({id: 'n-4', tags: { crossing: 'marked' }})
        ]);

        graph = iD.actionConnect(['n3', 'n-1', 'n-2', 'n-4'])(graph);

        expect(graph.hasEntity('n-1')).not.to.be.ok;
        expect(graph.hasEntity('n-2')).not.to.be.ok;
        expect(graph.hasEntity('n-4')).not.to.be.ok;

        var survivor = graph.hasEntity('n3');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
        expect(survivor.tags).to.eql({ highway: 'traffic_signals', crossing: 'marked' }, 'merge all tags');
    });

    it('chooses the last node as the survivor when all are new', function() {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', tags: { highway: 'traffic_signals' }}),
            iD.osmNode({id: 'b', tags: { crossing: 'marked' }}),
            iD.osmNode({id: 'c'})
        ]);

        graph = iD.actionConnect(['a', 'b', 'c'])(graph);
        expect(graph.hasEntity('a')).not.to.be.ok;
        expect(graph.hasEntity('b')).not.to.be.ok;

        var survivor = graph.hasEntity('c');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
        expect(survivor.tags).to.eql({ highway: 'traffic_signals', crossing: 'marked' }, 'merge all tags');
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
        it('returns falsy when connecting members of the same relation and same roles', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmRelation({id: 'r1', members: [
                    { id: 'b', type: 'node', role: 'foo' },
                    { id: 'c', type: 'node', role: 'foo' }
                ]})
            ]);

            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.be.not.ok;
        });

        it('returns falsy when connecting members of different relation and different roles', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmRelation({id: 'r1', members: [{ id: 'b', type: 'node', role: 'foo' } ]}),
                iD.osmRelation({id: 'r2', members: [{ id: 'c', type: 'node', role: 'bar' } ]})
            ]);

            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.be.not.ok;
        });

        it('returns \'relation\' when connecting members of the same relation but different roles', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmRelation({id: 'r1', members: [
                    { id: 'b', type: 'node', role: 'foo' },
                    { id: 'c', type: 'node', role: 'bar' }
                ]})
            ]);

            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.eql('relation');
        });

        it('returns falsy when connecting a node unrelated to the restriction', function () {
            //
            //  a --- b   d ~~~ e        r1:  `no_right_turn`
            //        |                        FROM '-'
            //        |                        VIA  'b'
            //        c                        TO   '|'
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmNode({id: 'e'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '|', nodes: ['b', 'c']}),
                iD.osmWay({id: '~', nodes: ['d', 'e']}),
                iD.osmRelation({id: 'r1', tags: { type: 'restriction', restriction: 'no_right_turn' }, members: [
                    { id: '-', type: 'way', role: 'from' },
                    { id: 'b', type: 'node', role: 'via' },
                    { id: '|', type: 'way', role: 'to' }
                ]})
            ]);

            expect(iD.actionConnect(['a', 'd']).disabled(graph)).to.be.not.ok;
            expect(iD.actionConnect(['b', 'd']).disabled(graph)).to.be.not.ok;
            expect(iD.actionConnect(['c', 'd']).disabled(graph)).to.be.not.ok;
        });

        it('returns falsy when connecting nodes that would not break a via-node restriction', function () {
            //
            //  a --- b --- c      r1:  `no_right_turn`
            //              |            FROM '-'
            //              d            VIA  'c'
            //              |            TO   '|'
            //              e
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmNode({id: 'e'}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmWay({id: '|', nodes: ['c', 'd', 'e']}),
                iD.osmRelation({id: 'r1', tags: { type: 'restriction', restriction: 'no_right_turn' }, members: [
                    { id: '-', type: 'way', role: 'from' },
                    { id: 'c', type: 'node', role: 'via' },
                    { id: '|', type: 'way', role: 'to' }
                ]})
            ]);

            // allowed: adjacent connections that don't destroy a way
            expect(iD.actionConnect(['a', 'b']).disabled(graph)).to.be.not.ok;
            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.be.not.ok;
            expect(iD.actionConnect(['c', 'd']).disabled(graph)).to.be.not.ok;
            expect(iD.actionConnect(['d', 'e']).disabled(graph)).to.be.not.ok;
        });

        it('returns falsy when connecting nodes that would not break a via-way restriction', function () {
            //
            //  a --- b --- c      r1:  `no_u_turn`
            //              |            FROM '='
            //              d            VIA  '|'
            //              |            TO   '-'
            //  g === f === e
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmNode({id: 'e'}),
                iD.osmNode({id: 'f'}),
                iD.osmNode({id: 'g'}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmWay({id: '|', nodes: ['c', 'd', 'e']}),
                iD.osmWay({id: '=', nodes: ['e', 'f', 'g']}),
                iD.osmRelation({id: 'r1', tags: { type: 'restriction', restriction: 'no_u_turn' }, members: [
                    { id: '=', type: 'way', role: 'from' },
                    { id: '|', type: 'way', role: 'via' },
                    { id: '-', type: 'way', role: 'to' }
                ]})
            ]);

            // allowed: adjacent connections that don't destroy a way
            expect(iD.actionConnect(['a', 'b']).disabled(graph)).to.be.not.ok;
            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.be.not.ok;
            expect(iD.actionConnect(['c', 'd']).disabled(graph)).to.be.not.ok;
            expect(iD.actionConnect(['d', 'e']).disabled(graph)).to.be.not.ok;
            expect(iD.actionConnect(['e', 'f']).disabled(graph)).to.be.not.ok;
            expect(iD.actionConnect(['f', 'g']).disabled(graph)).to.be.not.ok;
        });

        it('returns \'restriction\' when connecting nodes that would break a via-node restriction', function () {
            //
            //  a --- b --- c      r1:  `no_right_turn`
            //              |            FROM '-'
            //              d            VIA  'c'
            //              |            TO   '|'
            //              e
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmNode({id: 'e'}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmWay({id: '|', nodes: ['c', 'd', 'e']}),
                iD.osmRelation({id: 'r1', tags: { type: 'restriction', restriction: 'no_right_turn' }, members: [
                    { id: '-', type: 'way', role: 'from' },
                    { id: 'c', type: 'node', role: 'via' },
                    { id: '|', type: 'way', role: 'to' }
                ]})
            ]);

            // prevented:
            // extra connections to the VIA node, or any connections between distinct FROM and TO
            expect(iD.actionConnect(['a', 'c']).disabled(graph)).to.eql('restriction', 'extra connection FROM-VIA');
            expect(iD.actionConnect(['e', 'c']).disabled(graph)).to.eql('restriction', 'extra connection TO-VIA');
            expect(iD.actionConnect(['b', 'd']).disabled(graph)).to.eql('restriction', 'extra connection FROM-TO');
        });

        it('returns falsy when connecting nodes on a via-node u_turn restriction', function () {
            //
            //  a --- b --- c      r1:  `no_u_turn`
            //              |            FROM '-'
            //              d            VIA  'c'
            //              |            TO   '-'
            //              e
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmNode({id: 'e'}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmWay({id: '|', nodes: ['c', 'd', 'e']}),
                iD.osmRelation({id: 'r1', tags: { type: 'restriction', restriction: 'no_u_turn' }, members: [
                    { id: '-', type: 'way', role: 'from' },
                    { id: 'c', type: 'node', role: 'via' },
                    { id: '-', type: 'way', role: 'to' }
                ]})
            ]);

            // The u-turn case is one where a connection between FROM-TO should be allowed
            expect(iD.actionConnect(['a', 'b']).disabled(graph)).to.be.not.ok;
            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.be.not.ok;
        });

        it('returns \'restriction\' when connecting nodes that would break a via-way restriction', function () {
            //
            //  a --- b --- c      r1:  `no_u_turn`
            //              |            FROM '='
            //              d            VIA  '|'
            //              |            TO   '-'
            //  g === f === e
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmNode({id: 'e'}),
                iD.osmNode({id: 'f'}),
                iD.osmNode({id: 'g'}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmWay({id: '|', nodes: ['c', 'd', 'e']}),
                iD.osmWay({id: '=', nodes: ['e', 'f', 'g']}),
                iD.osmRelation({id: 'r1', tags: { type: 'restriction', restriction: 'no_u_turn' }, members: [
                    { id: '=', type: 'way', role: 'from' },
                    { id: '|', type: 'way', role: 'via' },
                    { id: '-', type: 'way', role: 'to' }
                ]})
            ]);

            // prevented:
            // extra connections to any node along VIA way
            expect(iD.actionConnect(['a', 'c']).disabled(graph)).to.eql('restriction', 'extra connection TO-VIA c');
            expect(iD.actionConnect(['b', 'd']).disabled(graph)).to.eql('restriction', 'extra connection TO-VIA d');
            expect(iD.actionConnect(['b', 'e']).disabled(graph)).to.eql('restriction', 'extra connection TO-VIA e');
            expect(iD.actionConnect(['c', 'e']).disabled(graph)).to.eql('restriction', 'extra connection VIA-VIA');
            expect(iD.actionConnect(['f', 'c']).disabled(graph)).to.eql('restriction', 'extra connection FROM-VIA c');
            expect(iD.actionConnect(['f', 'd']).disabled(graph)).to.eql('restriction', 'extra connection FROM-VIA d');
            expect(iD.actionConnect(['g', 'e']).disabled(graph)).to.eql('restriction', 'extra connection FROM-VIA e');
        });

        it('returns \'restriction\' when connecting would destroy a way in a via-node restriction', function () {
            //
            //  a --- b      r1:  `no_right_turn`
            //        |            FROM '-'
            //        |            VIA  'b'
            //        c            TO   '|'
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '|', nodes: ['b', 'c']}),
                iD.osmRelation({id: 'r1', tags: { type: 'restriction', restriction: 'no_right_turn' }, members: [
                    { id: '-', type: 'way', role: 'from' },
                    { id: 'b', type: 'node', role: 'via' },
                    { id: '|', type: 'way', role: 'to' }
                ]})
            ]);

            expect(iD.actionConnect(['a', 'b']).disabled(graph)).to.eql('restriction', 'destroy FROM');
            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.eql('restriction', 'destroy TO');
        });

        it('returns \'restriction\' when connecting would destroy a way in via-way restriction', function () {
            //
            //  a --- b      r1:  `no_u_turn`
            //        |            FROM '='
            //        |            VIA  '|'
            //  d === c            TO   '-'
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '|', nodes: ['b', 'c']}),
                iD.osmWay({id: '=', nodes: ['c', 'd']}),
                iD.osmRelation({id: 'r1', tags: { type: 'restriction', restriction: 'no_u_turn' }, members: [
                    { id: '=', type: 'way', role: 'from' },
                    { id: '|', type: 'way', role: 'via' },
                    { id: '-', type: 'way', role: 'to' }
                ]})
            ]);

            expect(iD.actionConnect(['a', 'b']).disabled(graph)).to.eql('restriction', 'destroy TO');
            expect(iD.actionConnect(['b', 'c']).disabled(graph)).to.eql('restriction', 'destroy VIA');
            expect(iD.actionConnect(['c', 'd']).disabled(graph)).to.eql('restriction', 'destroy FROM');
        });

    });
});
