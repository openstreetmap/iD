describe('iD.actionSnap', function () {

    var graph;

    beforeEach(function() {
        //    d   h   l   p
        //
        //    c   g   k
        //
        //    b   f   j
        //
        //    a   e   i
        const entities = [
            iD.osmNode({
                id: 'a',
                loc: [0, 0]
            }),
            iD.osmNode({
                id: 'b',
                loc: [0, 1]
            }),
            iD.osmNode({
                id: 'c',
                loc: [0, 2]
            }),
            iD.osmNode({
                id: 'd',
                loc: [0, 3]
            }),
            iD.osmNode({
                id: 'e',
                loc: [1, 0]
            }),
            iD.osmNode({
                id: 'f',
                loc: [1, 1]
            }),
            iD.osmNode({
                id: 'g',
                loc: [1, 2]
            }),
            iD.osmNode({
                id: 'h',
                loc: [1, 3]
            }),
            iD.osmNode({
                id: 'i',
                loc: [2, 0]
            }),
            iD.osmNode({
                id: 'j',
                loc: [2, 1]
            }),
            iD.osmNode({
                id: 'k',
                loc: [2, 2]
            }),
            iD.osmNode({
                id: 'l',
                loc: [2, 3]
            }),
            iD.osmNode({
                id: 'p',
                loc: [3, 3]
            }),
            // we need tags on ways to activate connections (ways with no tags will not trigger isShared on their connected nodes):
            iD.osmWay({
                id: 'w1',
                nodes: ['a', 'b', 'c', 'd', ],
                tags: {
                    foo: 'bar'
                }
            }),
            iD.osmWay({
                id: 'w2',
                nodes: ['b', 'p', 'f', 'j', 'k', 'g', 'c'],
                tags: {
                    foo: 'bar'
                }
            }),
            iD.osmWay({
                id: 'w3',
                nodes: ['e', 'f', 'g'],
                tags: {
                    foo: 'bar'
                }
            }),
            iD.osmWay({
                id: 'w6',
                nodes: ['e', 'b', 'f', 'j', 'k', 'g', 'c', 'h'],
                tags: {
                    foo: 'bar'
                }
            }),
            iD.osmWay({
                id: 'w7',
                nodes: ['b', 'c'],
                tags: {
                    foo: 'bar'
                }
            })
        ];
        graph = iD.coreGraph(entities);
    });


    it('snap w1 onto w2', function() {
        var result = iD.actionSnap(['w1', 'w2'], false)(graph);
        expect(result.entity('w1').nodes).to.eql(['a', 'b', 'p', 'f', 'j', 'k', 'g', 'c', 'd']);
    });

    it('snap w2 onto w1', function() {
        var result = iD.actionSnap(['w2', 'w1'], false)(graph);
        expect(result.entity('w2').nodes).to.eql(['b', 'c']);
    });

    it('snap w7 onto w2 - snap a way with 2 nodes onto a longer way', function() {
        var result = iD.actionSnap(['w7', 'w2'], false)(graph);
        expect(result.entity('w7').nodes).to.eql(['b', 'p', 'f', 'j', 'k', 'g', 'c']);
    });

    it('snap w2 onto w7 - snap a way onto a way with only 2 nodes', function() {
        var result = iD.actionSnap(['w2', 'w7'], false)(graph);
        expect(result.entity('w2').nodes).to.eql(['b', 'c']);
        // this node is no longer in the graph
        expect(result.hasEntity('p')).to.be.not.ok;
        // these nodes are still in the graph because they are in w6
        expect(result.hasEntity('f')).to.be.ok;
        expect(result.hasEntity('j')).to.be.ok;
        expect(result.hasEntity('k')).to.be.ok;
        expect(result.hasEntity('g')).to.be.ok;
    });

});
