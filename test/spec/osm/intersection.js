describe('iD.osmIntersection', function() {
    describe('highways', function() {
        it('excludes non-highways', function() {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*']}),
                iD.osmWay({id: '-', nodes: ['*', 'w']})
            ]);
            expect(iD.osmIntersection(graph, '*').ways).to.eql([]);
        });

        it('excludes degenerate highways', function() {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['*'], tags: {highway: 'residential'}})
            ]);
            var result = iD.osmIntersection(graph, '*').ways;
            expect(result.map(function(i) { return i.id; })).to.eql(['=']);
        });

        it('includes line highways', function() {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['*', 'w']})
            ]);
            var result = iD.osmIntersection(graph, '*').ways;
            expect(result.map(function(i) { return i.id; })).to.eql(['=']);
        });

        it('excludes area highways', function() {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*', 'w'], tags: {highway: 'pedestrian', area: 'yes'}})
            ]);
            expect(iD.osmIntersection(graph, '*').ways).to.eql([]);
        });

        it('auto-splits highways at the intersection', function() {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*', 'w'], tags: {highway: 'residential'}})
            ]);
            expect(iD.osmIntersection(graph, '*').ways.length).to.eql(2);
        });
    });

    describe('#turns', function() {
        it('permits turns onto a way forward', function() {
            // u====*--->w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_-');
            expect(turns[1].u).to.be.not.ok;
        });

        it('permits turns onto a way backward', function() {
            // u====*<---w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['w', '*'], tags: {highway: 'residential'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_-');
            expect(turns[1].u).to.be.not.ok;
        });

        it('permits turns from a way that must be split', function() {
            //     w
            //     |
            // u===*
            //     |
            //     x
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmNode({id: 'x'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['w', '*', 'x'], tags: {highway: 'residential'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('-');
            expect(turns.length).to.eql(3);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('-_*_=');
            expect(turns[0].u).to.be.not.ok;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('-_*_-');
            expect(turns[1].u).to.be.true;

            expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[2].key).to.match(/^-\_\*\_w-\d+$/);   // new way
            expect(turns[2].u).to.be.not.ok;
        });

        it('permits turns to a way that must be split', function() {
            //     w
            //     |
            // u===*
            //     |
            //     x
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmNode({id: 'x'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['w', '*', 'x'], tags: {highway: 'residential'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(3);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_-');
            expect(turns[1].u).to.be.not.ok;

            expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[2].key).to.match(/^=\_\*\_w-\d+$/);   // new way
            expect(turns[2].u).to.be.not.ok;
        });

        it('permits turns from a oneway forward', function() {
            // u===>v----w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential', oneway: 'yes'}}),
                iD.osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(1);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_-');
            expect(turns[0].u).to.be.not.ok;
        });

        it('permits turns from a reverse oneway backward', function() {
            // u<===*----w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential', oneway: '-1'}}),
                iD.osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(1);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_-');
            expect(turns[0].u).to.be.not.ok;
        });

        it('omits turns from a oneway backward', function() {
            // u<===*----w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential', oneway: 'yes'}}),
                iD.osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
            ]);
            expect(iD.osmIntersection(graph, '*').turns('u')).to.eql([]);
        });

        it('omits turns from a reverse oneway forward', function() {
            // u===>*----w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential', oneway: '-1'}}),
                iD.osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
            ]);
            expect(iD.osmIntersection(graph, '*').turns('u')).to.eql([]);
        });

        it('permits turns onto a oneway forward', function() {
            // u====*--->w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential', oneway: 'yes'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_-');
            expect(turns[1].u).to.be.not.ok;
        });

        it('permits turns onto a reverse oneway backward', function() {
            // u====*<---w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['w', '*'], tags: {highway: 'residential', oneway: '-1'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_-');
            expect(turns[1].u).to.be.not.ok;
        });

        it('omits turns onto a oneway backward', function() {
            // u====*<---w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['w', '*'], tags: {highway: 'residential', oneway: 'yes'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(1);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;
        });

        it('omits turns onto a reverse oneway forward', function() {
            // u====*--->w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential', oneway: '-1'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(1);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;
        });

        it('restricts turns with a restriction relation', function() {
            // u====*--->w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}}),
                iD.osmRelation({id: 'r', tags: {type: 'restriction'}, members: [
                    {id: '=', role: 'from', type: 'way'},
                    {id: '-', role: 'to', type: 'way'},
                    {id: '*', role: 'via', type: 'node'}
                ]})
            ]);
            var turns = iD.osmIntersection(graph, '*').turns('=');

            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_-');
            expect(turns[1].u).to.be.not.ok;
            expect(turns[1].restrictionID).to.eql('r');
            expect(turns[1].direct).to.be.true;
            expect(turns[1].only).to.be.not.ok;
        });

        it('restricts turns affected by an only_* restriction relation', function() {
            // u====*~~~~v
            //      |
            //      w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: 'v'}),
                iD.osmNode({id: 'w'}),
                iD.osmNode({id: '*'}),
                iD.osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '~', nodes: ['v', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '-', nodes: ['w', '*'], tags: {highway: 'residential'}}),
                iD.osmRelation({id: 'r', tags: {type: 'restriction', restriction: 'only_right_turn'}, members: [
                    {id: '=', role: 'from', type: 'way'},
                    {id: '-', role: 'to', type: 'way'},
                    {id: '*', role: 'via', type: 'node'}
                ]})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(3);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;
            expect(turns[1].direct).to.be.false;
            expect(turns[1].only).to.be.not.ok;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_~');
            expect(turns[1].restrictionID).to.eql('r');
            expect(turns[1].u).to.be.not.ok;
            expect(turns[1].direct).to.be.false;
            expect(turns[1].only).to.be.not.ok;

            expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[2].key).to.eql('=_*_-');
            expect(turns[2].restrictionID).to.eql('r');
            expect(turns[2].u).to.be.not.ok;
            expect(turns[2].direct).to.be.true;
            expect(turns[2].only).to.be.true;
        });

        it('permits turns to a circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'u'}),
                iD.osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(3);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_-');
            expect(turns[0].u).to.be.not.ok;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_=');
            expect(turns[1].u).to.be.true;

            expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[2].key).to.match(/^=\_\*\_w-\d+$/);   // new way
            expect(turns[2].u).to.be.not.ok;
        });

        it('permits turns from a circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'u'}),
                iD.osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential'}}),
                iD.osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('-');
            expect(turns.length).to.eql(3);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('-_*_-');
            expect(turns[0].u).to.be.true;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('-_*_=');
            expect(turns[1].u).to.be.not.ok;

            expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[2].key).to.match(/^-\_\*\_w-\d+$/);   // new way
            expect(turns[2].u).to.be.not.ok;
        });

        it('permits turns to a oneway circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'u'}),
                iD.osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: 'yes'}}),
                iD.osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_-');
            expect(turns[0].u).to.be.not.ok;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_=');
            expect(turns[1].u).to.be.true;
        });

        it('permits turns to a reverse oneway circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'u'}),
                iD.osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: '-1'}}),
                iD.osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
            ]);

            var turns = iD.osmIntersection(graph, '*').turns('=');
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_-');
            expect(turns[0].u).to.be.not.ok;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_=');
            expect(turns[1].u).to.be.true;
        });

        it('permits turns from a oneway circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'u'}),
                iD.osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: 'yes'}}),
                iD.osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
            ]);

            var intersection = iD.osmIntersection(graph, '*');
            var newWay = intersection.ways.find(function(w) { return /^w-\d+$/.test(w.id); });
            var turns = iD.osmIntersection(graph, '*').turns(newWay.id);
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql(newWay.id + '_*_-');
            expect(turns[0].u).to.be.not.ok;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql(newWay.id + '_*_=');
            expect(turns[1].u).to.be.not.ok;
        });

        it('permits turns from a reverse oneway circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'u'}),
                iD.osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: '-1'}}),
                iD.osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
            ]);

            var intersection = iD.osmIntersection(graph, '*');
            var newWay = intersection.ways.find(function(w) { return /^w-\d+$/.test(w.id); });
            var turns = iD.osmIntersection(graph, '*').turns(newWay.id);
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql(newWay.id + '_*_-');
            expect(turns[0].u).to.be.not.ok;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql(newWay.id + '_*_=');
            expect(turns[1].u).to.be.not.ok;
        });

    });
});


describe('iD.osmInferRestriction', function() {
    var projection = d3.geoMercator().scale(250 / Math.PI);

    it('infers the restriction type based on the turn angle', function() {
        //
        //  u === * ~~~ w
        //        |
        //        x
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'u', loc: [-1,  0]}),
            iD.osmNode({id: '*', loc: [ 0,  0]}),
            iD.osmNode({id: 'w', loc: [ 1,  0]}),
            iD.osmNode({id: 'x', loc: [ 0, -1]}),
            iD.osmWay({id: '=', nodes: ['u', '*']}),
            iD.osmWay({id: '-', nodes: ['*', 'x']}),
            iD.osmWay({id: '~', nodes: ['*', 'w']})
        ]);

        var r1 = iD.osmInferRestriction(graph, {
            from: { node: 'u', way: '=', vertex: '*' },
            to:   { node: 'x', way: '-', vertex: '*' }
        }, projection);
        expect(r1).to.equal('no_right_turn');

        var r2 = iD.osmInferRestriction(graph, {
            from: { node: 'x', way: '-', vertex: '*' },
            to:   { node: 'w', way: '~', vertex: '*' }
        }, projection);
        expect(r2).to.equal('no_right_turn');

        var l1 = iD.osmInferRestriction(graph, {
            from: { node: 'x', way: '-', vertex: '*' },
            to:   { node: 'u', way: '=', vertex: '*' }
        }, projection);
        expect(l1).to.equal('no_left_turn');

        var l2 = iD.osmInferRestriction(graph, {
            from: { node: 'w', way: '~', vertex: '*' },
            to:   { node: 'x', way: '-', vertex: '*' }
        }, projection);
        expect(l2).to.equal('no_left_turn');

        var s = iD.osmInferRestriction(graph, {
            from: { node: 'u', way: '=', vertex: '*' },
            to:   { node: 'w', way: '~', vertex: '*' }
        }, projection);
        expect(s).to.equal('no_straight_on');

        var u = iD.osmInferRestriction(graph, {
            from: { node: 'u', way: '=', vertex: '*' },
            to:   { node: 'u', way: '=', vertex: '*' }
        }, projection);
        expect(u).to.equal('no_u_turn');
    });


    it('infers no_u_turn from sharply acute angle made by forward oneways', function() {
        //      *
        //     / \
        //  w2/   \w1        angle ≈22.6°
        //   /     \
        //  u       x
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'u', loc: [0, -5] }),
            iD.osmNode({ id: '*', loc: [1,  0] }),
            iD.osmNode({ id: 'x', loc: [2, -5] }),
            iD.osmWay({ id: 'w1', nodes: ['x', '*'], tags: { oneway: 'yes' } }),
            iD.osmWay({ id: 'w2', nodes: ['*', 'u'], tags: { oneway: 'yes' } })
        ]);

        var r = iD.osmInferRestriction(graph, {
            from: { node: 'x', way: 'w1', vertex: '*' },
            to:   { node: 'u', way: 'w2', vertex: '*' }
        }, projection);
        expect(r).to.equal('no_u_turn');
    });


    it('does not infer no_u_turn from widely acute angle made by forward oneways', function() {
        //      *
        //     / \
        //  w2/   \w1        angle ≈36.9°
        //   /     \
        //  u       x
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'u', loc: [0, -3] }),
            iD.osmNode({ id: '*', loc: [1,  0] }),
            iD.osmNode({ id: 'x', loc: [2, -3] }),
            iD.osmWay({ id: 'w1', nodes: ['x', '*'], tags: { oneway: 'yes' } }),
            iD.osmWay({ id: 'w2', nodes: ['*', 'u'], tags: { oneway: 'yes' } })
        ]);

        var r = iD.osmInferRestriction(graph, {
            from: { node: 'x', way: 'w1', vertex: '*' },
            to:   { node: 'u', way: 'w2', vertex: '*' }
        }, projection);
        expect(r).to.equal('no_left_turn');
    });


    it('infers no_u_turn from sharply acute angle made by forward oneways with a via way', function() {
        //      * -- +
        //     /      \
        //  w2/        \w1      angle ≈22.6°
        //   /          \
        //  u            x
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'u', loc: [0, -5] }),
            iD.osmNode({ id: '*', loc: [1,  0] }),
            iD.osmNode({ id: '+', loc: [2,  0] }),
            iD.osmNode({ id: 'x', loc: [3, -5] }),
            iD.osmWay({ id: 'w1', nodes: ['x', '+'], tags: { oneway: 'yes' } }),
            iD.osmWay({ id: 'w2', nodes: ['*', 'u'], tags: { oneway: 'yes' } }),
            iD.osmWay({ id: '-',  nodes: ['*', '+'] })
        ]);

        var r = iD.osmInferRestriction(graph, {
            from: { node: 'x', way: 'w1', vertex: '+' },
            to:   { node: 'u', way: 'w2', vertex: '*' }
        }, projection);
        expect(r).to.equal('no_u_turn');
    });


    it('infers no_u_turn from widely acute angle made by forward oneways with a via way', function() {
        //      * -- +
        //     /      \
        //  w2/        \w1      angle ≈36.9°
        //   /          \
        //  u            x
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'u', loc: [0, -3] }),
            iD.osmNode({ id: '*', loc: [1,  0] }),
            iD.osmNode({ id: '+', loc: [2,  0] }),
            iD.osmNode({ id: 'x', loc: [3, -3] }),
            iD.osmWay({ id: 'w1', nodes: ['x', '+'], tags: { oneway: 'yes' } }),
            iD.osmWay({ id: 'w2', nodes: ['*', 'u'], tags: { oneway: 'yes' } }),
            iD.osmWay({ id: '-',  nodes: ['*', '+'] })
        ]);

        var r = iD.osmInferRestriction(graph, {
            from: { node: 'x', way: 'w1', vertex: '+' },
            to:   { node: 'u', way: 'w2', vertex: '*' }
        }, projection);
        expect(r).to.equal('no_u_turn');
    });
});
