describe('iD.osmJoinWays', function() {
    function getIDs(objects) {
        return objects.map(function(node) { return node.id; });
    }

    it('returns an array of members with nodes properties', function() {
        var node = iD.osmNode({id: 'a', loc: [0, 0]});
        var way  = iD.osmWay({id: '-', nodes: ['a']});
        var member = {id: '-', type: 'way'};
        var graph = iD.coreGraph([node, way]);

        var result = iD.osmJoinWays([member], graph);

        expect(result.length).to.equal(1);
        expect(result.actions).to.eql([]);
        expect(getIDs(result[0].nodes)).to.eql(['a']);
        expect(result[0].length).to.equal(1);
        expect(result[0][0]).to.eql(member);
    });

    it('joins ways (ordered - w1, w2)', function() {
        //
        //  a ---> b ===> c
        //
        var a = iD.osmNode({id: 'a', loc: [0, 0]});
        var b = iD.osmNode({id: 'b', loc: [1, 0]});
        var c = iD.osmNode({id: 'c', loc: [2, 0]});
        var w1 = iD.osmWay({id: '-', nodes: ['a', 'b']});
        var w2 = iD.osmWay({id: '=', nodes: ['b', 'c']});
        var graph = iD.coreGraph([a, b, c, w1, w2]);

        var result = iD.osmJoinWays([w1, w2], graph);
        expect(result.length).to.equal(1);
        expect(result.actions).to.eql([]);
        expect(getIDs(result[0].nodes)).to.eql(['a', 'b', 'c']);
        expect(result[0].length).to.equal(2);
        expect(result[0][0]).to.eql(w1);
        expect(result[0][1]).to.eql(w2);
    });

    it('joins ways (unordered - w2, w1)', function() {
        //
        //  a ---> b ===> c
        //
        var a = iD.osmNode({id: 'a', loc: [0, 0]});
        var b = iD.osmNode({id: 'b', loc: [1, 0]});
        var c = iD.osmNode({id: 'c', loc: [2, 0]});
        var w1 = iD.osmWay({id: '-', nodes: ['a', 'b']});
        var w2 = iD.osmWay({id: '=', nodes: ['b', 'c']});
        var graph = iD.coreGraph([a, b, c, w1, w2]);

        var result = iD.osmJoinWays([w2, w1], graph);
        expect(result.length).to.equal(1);
        expect(result.actions).to.eql([]);
        expect(getIDs(result[0].nodes)).to.eql(['a', 'b', 'c']);
        expect(result[0].length).to.equal(2);
        expect(result[0][0]).to.eql(w1);
        expect(result[0][1]).to.eql(w2);
    });

    it('joins relation members (ordered -, =)', function() {
        //
        //  a ---> b ===> c
        //  r: ['-', '=']
        //
        var a = iD.osmNode({id: 'a', loc: [0, 0]});
        var b = iD.osmNode({id: 'b', loc: [1, 0]});
        var c = iD.osmNode({id: 'c', loc: [2, 0]});
        var w1 = iD.osmWay({id: '-', nodes: ['a', 'b']});
        var w2 = iD.osmWay({id: '=', nodes: ['b', 'c']});
        var r = iD.osmRelation({id: 'r', members: [
            {id: '-', type: 'way'},
            {id: '=', type: 'way'}
        ]});
        var graph = iD.coreGraph([a, b, c, w1, w2, r]);

        var result = iD.osmJoinWays(r.members, graph);
        expect(result.length).to.equal(1);
        expect(result.actions).to.eql([]);
        expect(getIDs(result[0].nodes)).to.eql(['a', 'b', 'c']);
        expect(result[0].length).to.equal(2);
        expect(result[0][0]).to.eql({id: '-', type: 'way'});
        expect(result[0][1]).to.eql({id: '=', type: 'way'});
    });

    it('joins relation members (ordered =, -)', function() {
        //
        //  a ---> b ===> c
        //  r: ['=', '-']
        //
        var a = iD.osmNode({id: 'a', loc: [0, 0]});
        var b = iD.osmNode({id: 'b', loc: [1, 0]});
        var c = iD.osmNode({id: 'c', loc: [2, 0]});
        var w1 = iD.osmWay({id: '-', nodes: ['a', 'b']});
        var w2 = iD.osmWay({id: '=', nodes: ['b', 'c']});
        var r = iD.osmRelation({id: 'r', members: [
            {id: '=', type: 'way'},
            {id: '-', type: 'way'}
        ]});
        var graph = iD.coreGraph([a, b, c, w1, w2, r]);

        var result = iD.osmJoinWays(r.members, graph);
        expect(result.length).to.equal(1);
        expect(result.actions.length).to.equal(2);
        expect(getIDs(result[0].nodes)).to.eql(['c', 'b', 'a']);
        expect(result[0].length).to.equal(2);
        expect(result[0][0]).to.eql({id: '=', type: 'way'});
        expect(result[0][1]).to.eql({id: '-', type: 'way'});
    });

    it('returns joined members in the correct order', function() {
        //
        //  a <=== b ---> c ~~~> d
        //  r: ['-', '~', '=']
        //
        var a = iD.osmNode({id: 'a', loc: [0, 0]});
        var b = iD.osmNode({id: 'b', loc: [1, 0]});
        var c = iD.osmNode({id: 'c', loc: [2, 0]});
        var d = iD.osmNode({id: 'd', loc: [3, 0]});
        var w1 = iD.osmWay({id: '-', nodes: ['b', 'c']});
        var w2 = iD.osmWay({id: '=', nodes: ['b', 'a']});
        var w3 = iD.osmWay({id: '~', nodes: ['c', 'd']});
        var r = iD.osmRelation({id: 'r', members: [
            {id: '-', type: 'way'},
            {id: '~', type: 'way'},
            {id: '=', type: 'way'}
        ]});
        var graph = iD.coreGraph([a, b, c, d, w1, w2, w3, r]);

        var result = iD.osmJoinWays(r.members, graph);
        expect(result.length).to.equal(1);
        expect(result.actions.length).to.equal(1);
        expect(getIDs(result[0].nodes)).to.eql(['a', 'b', 'c', 'd']);
        expect(result[0].length).to.equal(3);
        expect(result[0][0]).to.eql({id: '=', type: 'way'});
        expect(result[0][1]).to.eql({id: '-', type: 'way'});
        expect(result[0][2]).to.eql({id: '~', type: 'way'});
    });

    it('reverses member tags of reversed segements', function() {
        //
        // Source:
        //   a ---> b <=== c
        // Result:
        //   a ---> b ===> c    (and tags on === reversed)
        //
        var a = iD.osmNode({id: 'a', loc: [0, 0]});
        var b = iD.osmNode({id: 'b', loc: [1, 0]});
        var c = iD.osmNode({id: 'c', loc: [2, 0]});
        var w1 = iD.osmWay({id: '-', nodes: ['a', 'b']});
        var w2 = iD.osmWay({id: '=', nodes: ['c', 'b'], tags: {'oneway': 'yes', 'lanes:forward': 2}});
        var graph = iD.coreGraph([a, b, c, w1, w2]);

        var result = iD.osmJoinWays([w1, w2], graph);
        expect(result.length).to.equal(1);
        expect(result.actions.length).to.equal(1);
        expect(getIDs(result[0].nodes)).to.eql(['a', 'b', 'c']);
        expect(result[0].length).to.equal(2);
        expect(result[0][0]).to.be.an.instanceof(iD.osmWay);
        expect(result[0][0].nodes).to.eql(['a', 'b']);
        expect(result[0][1]).to.be.an.instanceof(iD.osmWay);
        expect(result[0][1].nodes).to.eql(['b', 'c']);
        expect(result[0][1].tags).to.eql({'oneway': '-1', 'lanes:backward': 2});
    });

    it('reverses the initial segment to preserve member order when joining relation members', function() {
        //
        // Source:
        //   a <--- b ===> c
        // Result:
        //   a ---> b ===> c   (and --- reversed)
        //
        var a = iD.osmNode({id: 'a', loc: [0, 0]});
        var b = iD.osmNode({id: 'b', loc: [1, 0]});
        var c = iD.osmNode({id: 'c', loc: [2, 0]});
        var w1 = iD.osmWay({id: '-', nodes: ['b', 'a'], tags: {'oneway': 'yes', 'lanes:forward': 2}});
        var w2 = iD.osmWay({id: '=', nodes: ['b', 'c']});
        var r = iD.osmRelation({id: 'r', members: [
            {id: '-', type: 'way'},
            {id: '=', type: 'way'}
        ]});
        var graph = iD.coreGraph([a, b, c, w1, w2, r]);

        var result = iD.osmJoinWays(r.members, graph);
        expect(result.length).to.equal(1);
        expect(result.actions.length).to.equal(1);
        expect(getIDs(result[0].nodes)).to.eql(['a', 'b', 'c']);
        expect(result[0].length).to.equal(2);
        expect(result[0][0]).to.eql({id: '-', type: 'way'});
        expect(result[0][1]).to.eql({id: '=', type: 'way'});
    });

    it('ignores non-way members', function() {
        var node = iD.osmNode({loc: [0, 0]});
        var member = {id: 'n', type: 'node'};
        var graph = iD.coreGraph([node]);
        expect(iD.osmJoinWays([member], graph)).to.eql([]);
    });

    it('ignores incomplete members', function() {
        var member = {id: 'w', type: 'way'};
        var graph = iD.coreGraph();
        expect(iD.osmJoinWays([member], graph)).to.eql([]);
    });

    it('returns multiple arrays for disjoint ways', function() {
        //
        //     b
        //    / \
        //   a   c     d ---> e ===> f
        //
        var a = iD.osmNode({id: 'a', loc: [0, 0]});
        var b = iD.osmNode({id: 'b', loc: [1, 1]});
        var c = iD.osmNode({id: 'c', loc: [2, 0]});
        var d = iD.osmNode({id: 'd', loc: [5, 0]});
        var e = iD.osmNode({id: 'e', loc: [6, 0]});
        var f = iD.osmNode({id: 'f', loc: [7, 0]});
        var w1 = iD.osmWay({id: '/', nodes: ['a', 'b']});
        var w2 = iD.osmWay({id: '\\', nodes: ['b', 'c']});
        var w3 = iD.osmWay({id: '-', nodes: ['d', 'e']});
        var w4 = iD.osmWay({id: '=', nodes: ['e', 'f']});
        var graph = iD.coreGraph([a, b, c, d, e, f, w1, w2, w3, w4]);

        var result = iD.osmJoinWays([w1, w2, w3, w4], graph);

        expect(result.length).to.equal(2);
        expect(result.actions).to.eql([]);

        expect(result[0].length).to.equal(2);
        expect(getIDs(result[0].nodes)).to.eql(['a', 'b', 'c']);
        expect(result[0][0]).to.eql(w1);
        expect(result[0][1]).to.eql(w2);

        expect(result[1].length).to.equal(2);
        expect(getIDs(result[1].nodes)).to.eql(['d', 'e', 'f']);
        expect(result[1][0]).to.eql(w3);
        expect(result[1][1]).to.eql(w4);
    });

    it('returns multiple arrays for disjoint relations', function() {
        //
        //     b
        //    / \
        //   a   c     d ---> e ===> f
        //
        //   r: ['/', '\', '-', '=']
        //
        var a = iD.osmNode({id: 'a', loc: [0, 0]});
        var b = iD.osmNode({id: 'b', loc: [1, 1]});
        var c = iD.osmNode({id: 'c', loc: [2, 0]});
        var d = iD.osmNode({id: 'd', loc: [5, 0]});
        var e = iD.osmNode({id: 'e', loc: [6, 0]});
        var f = iD.osmNode({id: 'f', loc: [7, 0]});
        var w1 = iD.osmWay({id: '/', nodes: ['a', 'b']});
        var w2 = iD.osmWay({id: '\\', nodes: ['b', 'c']});
        var w3 = iD.osmWay({id: '-', nodes: ['d', 'e']});
        var w4 = iD.osmWay({id: '=', nodes: ['e', 'f']});
        var r = iD.osmRelation({id: 'r', members: [
            {id: '/', type: 'way'},
            {id: '\\', type: 'way'},
            {id: '-', type: 'way'},
            {id: '=', type: 'way'}
        ]});
        var graph = iD.coreGraph([a, b, c, d, e, f, w1, w2, w3, w4, r]);
        var result = iD.osmJoinWays(r.members, graph);

        expect(result.length).to.equal(2);
        expect(result.actions).to.eql([]);

        expect(result[0].length).to.equal(2);
        expect(getIDs(result[0].nodes)).to.eql(['a', 'b', 'c']);
        expect(result[0][0]).to.eql({id: '/', type: 'way'});
        expect(result[0][1]).to.eql({id: '\\', type: 'way'});

        expect(result[1].length).to.equal(2);
        expect(getIDs(result[1].nodes)).to.eql(['d', 'e', 'f']);
        expect(result[1][0]).to.eql({id: '-', type: 'way'});
        expect(result[1][1]).to.eql({id: '=', type: 'way'});
    });

    it('understands doubled-back relation members', function() {
        //
        //                    e
        //                  /   \
        //   a <=== b ---> c ~~~> d
        //
        //   r: ['=', '-', '~', '\', '/', '-', '=']
        //
        var a = iD.osmNode({id: 'a', loc: [0, 0]});
        var b = iD.osmNode({id: 'b', loc: [1, 0]});
        var c = iD.osmNode({id: 'c', loc: [2, 0]});
        var d = iD.osmNode({id: 'd', loc: [4, 0]});
        var e = iD.osmNode({id: 'e', loc: [3, 1]});
        var w1 = iD.osmWay({id: '=', nodes: ['b', 'a']});
        var w2 = iD.osmWay({id: '-', nodes: ['b', 'c']});
        var w3 = iD.osmWay({id: '~', nodes: ['c', 'd']});
        var w4 = iD.osmWay({id: '\\', nodes: ['d', 'e']});
        var w5 = iD.osmWay({id: '/', nodes: ['c', 'e']});
        var r = iD.osmRelation({id: 'r', members: [
            {id: '=', type: 'way'},
            {id: '-', type: 'way'},
            {id: '~', type: 'way'},
            {id: '\\', type: 'way'},
            {id: '/', type: 'way'},
            {id: '-', type: 'way'},
            {id: '=', type: 'way'}
        ]});
        var graph = iD.coreGraph([a, b, c, d, e, w1, w2, w3, w4, w5, r]);

        var result = iD.osmJoinWays(r.members, graph);
        expect(result.length).to.equal(1);
        expect(result.actions.length).to.equal(3);

        expect(getIDs(result[0].nodes)).to.eql(['a', 'b', 'c', 'd', 'e', 'c', 'b', 'a']);
        expect(result[0].length).to.equal(7);
        expect(result[0][0]).to.eql({id: '=', type: 'way'});
        expect(result[0][1]).to.eql({id: '-', type: 'way'});
        expect(result[0][2]).to.eql({id: '~', type: 'way'});
        expect(result[0][3]).to.eql({id: '\\', type: 'way'});
        expect(result[0][4]).to.eql({id: '/', type: 'way'});
        expect(result[0][5]).to.eql({id: '-', type: 'way'});
        expect(result[0][6]).to.eql({id: '=', type: 'way'});
    });

});
