describe('iD.actionMergeNodes', function () {

    function has(arr, findVal) {
        return arr.some(function(val) { return val === findVal; });
    }

    describe('#disabled', function () {
        it('enabled for both internal and endpoint nodes', function() {
            //
            // a --- b --- c
            //
            //       d
            //       |
            //       e
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [-2,  2] }),
                iD.osmNode({ id: 'b', loc: [ 0,  2] }),
                iD.osmNode({ id: 'c', loc: [ 2,  2] }),
                iD.osmNode({ id: 'd', loc: [ 0,  0] }),
                iD.osmNode({ id: 'e', loc: [ 0, -2] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] }),
                iD.osmWay({ id: '|', nodes: ['d', 'e'] })
            ]);

            expect(iD.actionMergeNodes(['b', 'e']).disabled(graph)).to.be.not.ok;
        });
    });


    it('merges two nodes along a single way', function() {
        //
        //  scenerio:         merge b,c:
        //
        //  a -- b -- c       a ---- c
        //
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [-2,  2] }),
            iD.osmNode({ id: 'b', loc: [ 0,  2] }),
            iD.osmNode({ id: 'c', loc: [ 2,  2] }),
            iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] })
        ]);

        graph = iD.actionMergeNodes(['b', 'c'])(graph);

        expect(graph.hasEntity('b')).to.be.undefined;

        var c = graph.hasEntity('c');
        expect(c).to.be.an.instanceof(iD.osmNode);
        expect(c.loc).to.eql([1, 2]);
        expect(graph.parentWays(c).length).to.equal(1);
    });


    it('merges two nodes from two ways', function() {
        //
        //  scenerio:        merge b,d:
        //
        //  a -- b -- c      a -_   _- c
        //                        d
        //       d                |
        //       |                |
        //       e                e
        //
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [-2,  2] }),
            iD.osmNode({ id: 'b', loc: [ 0,  2] }),
            iD.osmNode({ id: 'c', loc: [ 2,  2] }),
            iD.osmNode({ id: 'd', loc: [ 0,  0] }),
            iD.osmNode({ id: 'e', loc: [ 0, -2] }),
            iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] }),
            iD.osmWay({ id: '|', nodes: ['d', 'e'] })
        ]);

        graph = iD.actionMergeNodes(['b', 'd'])(graph);

        expect(graph.hasEntity('b')).to.be.undefined;

        var d = graph.hasEntity('d');
        expect(d).to.be.an.instanceof(iD.osmNode);
        expect(d.loc).to.eql([0, 1]);
        expect(graph.parentWays(d).length).to.equal(2);
    });


    it('merges three nodes from three ways', function () {
        //
        //  scenerio:        merge b,d:
        //
        //        c                c
        //        |                |
        //        d                |
        //                         |
        //  a --- b          a --- e
        //                         ‖
        //        e                ‖
        //        ‖                ‖
        //        f                f
        //
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [-2,  0] }),
            iD.osmNode({ id: 'b', loc: [ 0,  0] }),
            iD.osmNode({ id: 'c', loc: [ 0,  4] }),
            iD.osmNode({ id: 'd', loc: [ 0,  2] }),
            iD.osmNode({ id: 'e', loc: [ 0, -2] }),
            iD.osmNode({ id: 'f', loc: [ 0, -4] }),
            iD.osmWay({ id: '-', nodes: ['a', 'b'] }),
            iD.osmWay({ id: '|', nodes: ['c', 'd'] }),
            iD.osmWay({ id: '‖', nodes: ['e', 'f'] })
        ]);

        graph = iD.actionMergeNodes(['b', 'd', 'e'])(graph);

        expect(graph.hasEntity('b')).to.be.undefined;
        expect(graph.hasEntity('d')).to.be.undefined;

        var d = graph.hasEntity('e');
        expect(d).to.be.an.instanceof(iD.osmNode);
        expect(d.loc).to.eql([0, 2]);
        expect(graph.parentWays(d).length).to.equal(3);
    });


    it('merges tags of nodes', function() {
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [0, -2], tags: { highway: 'traffic_signals' } }),
            iD.osmNode({ id: 'b', loc: [0,  2], tags: { crossing: 'zebra' } })
        ]);
        graph = iD.actionMergeNodes(['a', 'b'])(graph);

        var b = graph.hasEntity('b');
        expect(b.loc).to.eql([0, 0]);
        expect(b.tags).to.eql({ highway: 'traffic_signals', crossing: 'zebra' });
    });
});
