describe('iD.osmIntersection', function() {
    var maxDist = Infinity;

    describe('highways', function() {
        // u ==== * ---> w
        it('excludes non-highways', function() {
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'] }),
                iD.osmWay({ id: '-', nodes: ['*', 'w'] })
            ]);
            expect(iD.osmIntersection(graph, '*', maxDist).ways).to.eql([]);
        });

        it('excludes degenerate highways', function() {
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['*'], tags: { highway: 'residential' } })
            ]);
            var result = iD.osmIntersection(graph, '*', maxDist).ways;
            expect(result.map(function(i) { return i.id; })).to.eql(['=']);
        });

        it('includes line highways', function() {
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['*', 'w'] })
            ]);
            var result = iD.osmIntersection(graph, '*', maxDist).ways;
            expect(result.map(function(i) { return i.id; })).to.eql(['=']);
        });

        it('excludes area highways', function() {
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({id: '=', nodes: ['u', '*', 'w'], tags: { highway: 'pedestrian', area: 'yes' } })
            ]);
            expect(iD.osmIntersection(graph, '*', maxDist).ways).to.eql([]);
        });

        it('auto-splits highways at the intersection', function() {
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*', 'w'], tags: { highway: 'residential' } })
            ]);
            expect(iD.osmIntersection(graph, '*', maxDist).ways.length).to.eql(2);
        });
    });

    describe('#turns', function() {
        it('permits turns onto a way forward', function() {
            // u ==== * ---> w
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['*', 'w'], tags: { highway: 'residential' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_-');
            expect(turns[1].u).to.be.not.ok;
        });

        it('permits turns onto a way backward', function() {
            // u ==== * <--- w
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: {highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['w', '*'], tags: {highway: 'residential' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_-');
            expect(turns[1].u).to.be.not.ok;
        });

        it('permits turns from a way that must be split', function() {
            //       w
            //       |
            // u === *
            //       |
            //       x
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [1, 1] }),
                iD.osmNode({ id: 'x', loc: [1, -1] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: {highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['w', '*', 'x'], tags: {highway: 'residential' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('-');
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
            //       w
            //       |
            // u === *
            //       |
            //       x
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [1, 1] }),
                iD.osmNode({ id: 'x', loc: [1, -1] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['w', '*', 'x'], tags: { highway: 'residential' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
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
            // u ===> * ----w
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '-', nodes: ['*', 'w'], tags: { highway: 'residential' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
            expect(turns.length).to.eql(1);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_-');
            expect(turns[0].u).to.be.not.ok;
        });

        it('permits turns from a reverse oneway backward', function() {
            // u <=== * ---- w
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['*', 'u'], tags: { highway: 'residential', oneway: '-1' } }),
                iD.osmWay({ id: '-', nodes: ['*', 'w'], tags: { highway: 'residential' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
            expect(turns.length).to.eql(1);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_-');
            expect(turns[0].u).to.be.not.ok;
        });

        it('omits turns from a oneway backward', function() {
            // u <=== * ---- w
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['*', 'u'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '-', nodes: ['*', 'w'], tags: { highway: 'residential' } })
            ]);
            expect(iD.osmIntersection(graph, '*', maxDist).turns('u')).to.eql([]);
        });

        it('omits turns from a reverse oneway forward', function() {
            // u ===> * ---- w
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential', oneway: '-1' } }),
                iD.osmWay({ id: '-', nodes: ['*', 'w'], tags: { highway: 'residential' } })
            ]);
            expect(iD.osmIntersection(graph, '*', maxDist).turns('u')).to.eql([]);
        });

        it('permits turns onto a oneway forward', function() {
            // u ==== * ---> w
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['*', 'w'], tags: { highway: 'residential', oneway: 'yes' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_-');
            expect(turns[1].u).to.be.not.ok;
        });

        it('permits turns onto a reverse oneway backward', function() {
            // u ==== * <--- w
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['w', '*'], tags: { highway: 'residential', oneway: '-1' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql('=_*_-');
            expect(turns[1].u).to.be.not.ok;
        });

        it('omits turns onto a oneway backward', function() {
            // u ==== * <--- w
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['w', '*'], tags: { highway: 'residential', oneway: 'yes' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
            expect(turns.length).to.eql(1);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;
        });

        it('omits turns onto a reverse oneway forward', function() {
            // u ==== * ---> w
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['*', 'w'], tags: { highway: 'residential', oneway: '-1' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
            expect(turns.length).to.eql(1);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql('=_*_=');
            expect(turns[0].u).to.be.true;
        });

        it('restricts turns with a restriction relation', function() {
            // u ==== * ---> w
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'w', loc: [2, 0] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['*', 'w'], tags: { highway: 'residential' } }),
                iD.osmRelation({id: 'r', tags: { type: 'restriction' }, members: [
                    { id: '=', role: 'from', type: 'way' },
                    { id: '-', role: 'to', type: 'way' },
                    { id: '*', role: 'via', type: 'node' }
                ]})
            ]);
            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');

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
                iD.osmNode({ id: 'u', loc: [0, 0] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'v', loc: [2, 0] }),
                iD.osmNode({ id: 'w', loc: [1, -1] }),
                iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '~', nodes: ['v', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '-', nodes: ['w', '*'], tags: { highway: 'residential' } }),
                iD.osmRelation({ id: 'r', tags: { type: 'restriction', restriction: 'only_right_turn' }, members: [
                    { id: '=', role: 'from', type: 'way' },
                    { id: '-', role: 'to', type: 'way' },
                    { id: '*', role: 'via', type: 'node' }
                ]})
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
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
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [0, 1] }),
                iD.osmNode({ id: 'c', loc: [1, 1] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'u', loc: [2, 0] }),
                iD.osmWay({ id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '=', nodes: ['*', 'u'], tags: { highway: 'residential' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
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
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [0, 1] }),
                iD.osmNode({ id: 'c', loc: [1, 1] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'u', loc: [2, 0] }),
                iD.osmWay({ id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '=', nodes: ['*', 'u'], tags: { highway: 'residential' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('-');
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
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [0, 1] }),
                iD.osmNode({ id: 'c', loc: [1, 1] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'u', loc: [2, 0] }),
                iD.osmWay({ id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '=', nodes: ['*', 'u'], tags: { highway: 'residential' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
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
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [0, 1] }),
                iD.osmNode({ id: 'c', loc: [1, 1] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'u', loc: [2, 0] }),
                iD.osmWay({ id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: { highway: 'residential', oneway: '-1' } }),
                iD.osmWay({ id: '=', nodes: ['*', 'u'], tags: { highway: 'residential' } })
            ]);

            var turns = iD.osmIntersection(graph, '*', maxDist).turns('=');
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
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [0, 1] }),
                iD.osmNode({ id: 'c', loc: [1, 1] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'u', loc: [2, 0] }),
                iD.osmWay({ id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: 'yes'}}),
                iD.osmWay({ id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
            ]);

            var intersection = iD.osmIntersection(graph, '*', maxDist);
            var newWay = intersection.ways.find(function(w) { return /^w-\d+$/.test(w.id); });
            var turns = iD.osmIntersection(graph, '*', maxDist).turns(newWay.id);
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
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [0, 1] }),
                iD.osmNode({ id: 'c', loc: [1, 1] }),
                iD.osmNode({ id: '*', loc: [1, 0] }),
                iD.osmNode({ id: 'u', loc: [2, 0] }),
                iD.osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: { highway: 'residential', oneway: '-1' } }),
                iD.osmWay({id: '=', nodes: ['*', 'u'], tags: { highway: 'residential' } })
            ]);

            var intersection = iD.osmIntersection(graph, '*', maxDist);
            var newWay = intersection.ways.find(function(w) { return /^w-\d+$/.test(w.id); });
            var turns = iD.osmIntersection(graph, '*', maxDist).turns(newWay.id);
            expect(turns.length).to.eql(2);

            expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[0].key).to.eql(newWay.id + '_*_-');
            expect(turns[0].u).to.be.not.ok;

            expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
            expect(turns[1].key).to.eql(newWay.id + '_*_=');
            expect(turns[1].u).to.be.not.ok;
        });


        describe('complex intersection - without restrictions', function() {
            //
            //           g
            //          /
            //  a <--- b <=== c
            //         |
            //         |
            //  d ~~~> e ≈≈≈> f
            //          \
            //           h
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 1] }),
                iD.osmNode({ id: 'b', loc: [1, 1] }),
                iD.osmNode({ id: 'c', loc: [2, 1] }),
                iD.osmNode({ id: 'd', loc: [0,-1] }),
                iD.osmNode({ id: 'e', loc: [1,-1] }),
                iD.osmNode({ id: 'f', loc: [2,-1] }),
                iD.osmNode({ id: 'g', loc: [2, 2] }),
                iD.osmNode({ id: 'h', loc: [2,-2] }),
                iD.osmWay({ id: '-', nodes: ['b', 'a'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '=', nodes: ['c', 'b'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '~', nodes: ['d', 'e'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '≈', nodes: ['e', 'f'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '|', nodes: ['b', 'e'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '/', nodes: ['b', 'g'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '\\', nodes: ['e', 'h'], tags: { highway: 'residential' } })
            ]);

            it('no turns from a destination way', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('-', 1);
                expect(turns.length).to.eql(0);
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('≈', 1);
                expect(turns.length).to.eql(0);
            });

            it('allows via node and via way turns from a oneway', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('=', 1);
                expect(turns.length).to.eql(5);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('=_b_-');  // straight to -
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('=_b_|');  // left to |
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('=_b_|_e_≈');  // u-turn via | to ≈
                expect(turns[2].u).to.be.not.ok;

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('=_b_|_e_\\');  // left via | to \
                expect(turns[3].u).to.be.not.ok;

                expect(turns[4]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[4].key).to.eql('=_b_/');  // right to /
                expect(turns[4].u).to.be.not.ok;
            });

            it('allows via node and via way turns from a bidirectional', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('/', 1);
                expect(turns.length).to.eql(5);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('/_b_-');  // right to -
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('/_b_|');  // straight to |
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('/_b_|_e_≈');  // left via | to ≈
                expect(turns[2].u).to.be.not.ok;

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('/_b_|_e_\\');  // straight via | to \
                expect(turns[3].u).to.be.not.ok;

                expect(turns[4]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[4].key).to.eql('/_b_/');  // u-turn
                expect(turns[4].u).to.be.ok;
            });
        });


        describe('complex intersection - restricted turn via node', function() {
            //
            //           g
            //          /
            //  a <--- b <=== c
            //         |
            //         |           'r': `no_right_turn` FROM '|' VIA NODE 'e' TO '≈'
            //  d ~~~> e ≈≈≈> f
            //          \
            //           h
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 1] }),
                iD.osmNode({ id: 'b', loc: [1, 1] }),
                iD.osmNode({ id: 'c', loc: [2, 1] }),
                iD.osmNode({ id: 'd', loc: [0,-1] }),
                iD.osmNode({ id: 'e', loc: [1,-1] }),
                iD.osmNode({ id: 'f', loc: [2,-1] }),
                iD.osmNode({ id: 'g', loc: [2, 2] }),
                iD.osmNode({ id: 'h', loc: [2,-2] }),
                iD.osmWay({ id: '-', nodes: ['b', 'a'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '=', nodes: ['c', 'b'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '~', nodes: ['d', 'e'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '≈', nodes: ['e', 'f'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '|', nodes: ['b', 'e'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '/', nodes: ['b', 'g'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '\\', nodes: ['e', 'h'], tags: { highway: 'residential' } }),
                iD.osmRelation({
                    id: 'r',
                    tags: { type: 'restriction', restriction: 'no_right_turn' },
                    members: [
                        { role: 'from', id: '|', type: 'way' },
                        { role: 'via', id: 'e', type: 'node' },
                        { role: 'to', id: '≈', type: 'way' }
                    ]
                })
            ]);

            it('allows via node and via way turns from a oneway', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('=', 1);
                expect(turns.length).to.eql(5);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('=_b_-');  // straight to -
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('=_b_|');  // left to |
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('|_e_≈');  // right turn from | to ≈
                expect(turns[2].u).to.be.not.ok;
                expect(turns[2].restrictionID).to.eql('r');
                expect(turns[2].direct).to.be.false;        // indirect
                expect(turns[2].no).to.be.true;             // restricted!
                expect(turns[2].only).to.be.not.ok;

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('=_b_|_e_\\');  // left via | to \
                expect(turns[3].u).to.be.not.ok;

                expect(turns[4]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[4].key).to.eql('=_b_/');  // right to /
                expect(turns[4].u).to.be.not.ok;
            });

            it('allows via node and via way turns from a bidirectional', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('/', 1);
                expect(turns.length).to.eql(5);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('/_b_-');  // right to -
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('/_b_|');  // straight to |
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('|_e_≈');  // right turn from | to ≈
                expect(turns[2].u).to.be.not.ok;
                expect(turns[2].restrictionID).to.eql('r');
                expect(turns[2].direct).to.be.false;        // indirect
                expect(turns[2].no).to.be.true;             // restricted!
                expect(turns[2].only).to.be.not.ok;

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('/_b_|_e_\\');  // straight via | to \
                expect(turns[3].u).to.be.not.ok;

                expect(turns[4]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[4].key).to.eql('/_b_/');  // u-turn
                expect(turns[4].u).to.be.ok;
            });
        });


        describe('complex intersection - restricted turn via way', function() {
            //
            //           g     'r2': `no_right_turn` FROM '/' VIA WAY '|' TO '≈'
            //          /
            //  a <--- b <=== c    'r1': `no_u_turn` FROM '=' VIA WAY '|' TO '≈'
            //         |
            //         |
            //  d ~~~> e ≈≈≈> f
            //          \
            //           h
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 1] }),
                iD.osmNode({ id: 'b', loc: [1, 1] }),
                iD.osmNode({ id: 'c', loc: [2, 1] }),
                iD.osmNode({ id: 'd', loc: [0,-1] }),
                iD.osmNode({ id: 'e', loc: [1,-1] }),
                iD.osmNode({ id: 'f', loc: [2,-1] }),
                iD.osmNode({ id: 'g', loc: [2, 2] }),
                iD.osmNode({ id: 'h', loc: [2,-2] }),
                iD.osmWay({ id: '-', nodes: ['b', 'a'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '=', nodes: ['c', 'b'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '~', nodes: ['d', 'e'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '≈', nodes: ['e', 'f'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '|', nodes: ['b', 'e'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '/', nodes: ['b', 'g'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '\\', nodes: ['e', 'h'], tags: { highway: 'residential' } }),
                iD.osmRelation({
                    id: 'r1',
                    tags: { type: 'restriction', restriction: 'no_u_turn' },
                    members: [
                        { role: 'from', id: '=', type: 'way' },
                        { role: 'via', id: '|', type: 'way' },
                        { role: 'to', id: '≈', type: 'way' },
                    ]
                }),
                iD.osmRelation({
                    id: 'r2',
                    tags: { type: 'restriction', restriction: 'no_right_turn' },
                    members: [
                        { role: 'from', id: '/', type: 'way' },
                        { role: 'via', id: '|', type: 'way' },
                        { role: 'to', id: '≈', type: 'way' }
                    ]
                })
            ]);

            it('allows via node and via way turns from a oneway', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('=', 1);
                expect(turns.length).to.eql(5);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('=_b_-');  // straight to -
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('=_b_|');  // left to |
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('=_b_|_e_≈');  // u turn via | to ≈
                expect(turns[2].u).to.be.not.ok;
                expect(turns[2].restrictionID).to.eql('r1');
                expect(turns[2].direct).to.be.true;         // direct
                expect(turns[2].no).to.be.true;             // restricted!
                expect(turns[2].only).to.be.not.ok;

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('=_b_|_e_\\');  // left via | to \
                expect(turns[3].u).to.be.not.ok;

                expect(turns[4]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[4].key).to.eql('=_b_/');  // right to /
                expect(turns[4].u).to.be.not.ok;
            });

            it('allows via node and via way turns from a bidirectional', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('/', 1);
                expect(turns.length).to.eql(5);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('/_b_-');  // right to -
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('/_b_|');  // straight to |
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('/_b_|_e_≈');  // right turn from | to ≈
                expect(turns[2].u).to.be.not.ok;
                expect(turns[2].restrictionID).to.eql('r2');
                expect(turns[2].direct).to.be.true;         // direct
                expect(turns[2].no).to.be.true;             // restricted!
                expect(turns[2].only).to.be.not.ok;

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('/_b_|_e_\\');  // straight via | to \
                expect(turns[3].u).to.be.not.ok;

                expect(turns[4]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[4].key).to.eql('/_b_/');  // u-turn
                expect(turns[4].u).to.be.ok;
            });
        });


        describe('complex intersection - only turn via node', function() {
            //
            //           g
            //          /
            //  a <--- b <=== c
            //         |
            //         |           'r': `only_right_turn` FROM '|' VIA NODE 'e' TO '≈'
            //  d ~~~> e ≈≈≈> f
            //          \
            //           h
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 1] }),
                iD.osmNode({ id: 'b', loc: [1, 1] }),
                iD.osmNode({ id: 'c', loc: [2, 1] }),
                iD.osmNode({ id: 'd', loc: [0,-1] }),
                iD.osmNode({ id: 'e', loc: [1,-1] }),
                iD.osmNode({ id: 'f', loc: [2,-1] }),
                iD.osmNode({ id: 'g', loc: [2, 2] }),
                iD.osmNode({ id: 'h', loc: [2,-2] }),
                iD.osmWay({ id: '-', nodes: ['b', 'a'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '=', nodes: ['c', 'b'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '~', nodes: ['d', 'e'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '≈', nodes: ['e', 'f'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '|', nodes: ['b', 'e'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '/', nodes: ['b', 'g'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '\\', nodes: ['e', 'h'], tags: { highway: 'residential' } }),
                iD.osmRelation({
                    id: 'r',
                    tags: { type: 'restriction', restriction: 'only_right_turn' },
                    members: [
                        { role: 'from', id: '|', type: 'way' },
                        { role: 'via', id: 'e', type: 'node' },
                        { role: 'to', id: '≈', type: 'way' }
                    ]
                })
            ]);

            it('allows via node and via way turns from a oneway', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('=', 1);
                expect(turns.length).to.eql(5);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('=_b_-');  // straight to -
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('=_b_|');  // left to |
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('|_e_≈');  // right turn from | to ≈
                expect(turns[2].u).to.be.not.ok;
                expect(turns[2].restrictionID).to.eql('r');
                expect(turns[2].direct).to.be.false;        // indirect
                expect(turns[2].no).to.be.not.ok;
                expect(turns[2].only).to.be.true;           // only!

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('|_e_\\');  // straight from | to \
                expect(turns[3].u).to.be.not.ok;
                expect(turns[3].restrictionID).to.eql('r');
                expect(turns[3].direct).to.be.false;        // indirect
                expect(turns[3].no).to.be.true;             // restricted!
                expect(turns[3].only).to.be.not.ok;

                expect(turns[4]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[4].key).to.eql('=_b_/');  // right to /
                expect(turns[4].u).to.be.not.ok;
            });

            it('allows via node and via way turns from a bidirectional', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('/', 1);
                expect(turns.length).to.eql(5);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('/_b_-');  // right to -
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('/_b_|');  // straight to |
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('|_e_≈');  // right turn from | to ≈
                expect(turns[2].u).to.be.not.ok;
                expect(turns[2].restrictionID).to.eql('r');
                expect(turns[2].direct).to.be.false;        // indirect
                expect(turns[2].no).to.be.not.ok;
                expect(turns[2].only).to.be.true;           // only!

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('|_e_\\');  // straight from | to \
                expect(turns[3].u).to.be.not.ok;
                expect(turns[3].restrictionID).to.eql('r');
                expect(turns[3].direct).to.be.false;        // indirect
                expect(turns[3].no).to.be.true;             // restricted!
                expect(turns[3].only).to.be.not.ok;

                expect(turns[4]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[4].key).to.eql('/_b_/');  // u-turn
                expect(turns[4].u).to.be.ok;
            });

            it('`only_` restriction is only effective towards the via', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('|', 1);
                expect(turns.length).to.eql(6);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('|_b_-');  // left from | to - (away from only-via)
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('|_b_|');  // u-turn from | to | (away from only-via)
                expect(turns[1].u).to.be.true;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('|_b_/');  // straight from | to / (away from only-via)
                expect(turns[2].u).to.be.not.ok;

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('|_e_|');  // u-turn from | to | via e
                expect(turns[3].u).to.be.true;
                expect(turns[3].restrictionID).to.eql('r');
                expect(turns[3].direct).to.be.false;        // indirect
                expect(turns[3].no).to.be.true;             // restricted!
                expect(turns[3].only).to.be.not.ok;

                expect(turns[4]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[4].key).to.eql('|_e_≈');  // right turn from | to ≈
                expect(turns[4].u).to.be.not.ok;
                expect(turns[4].restrictionID).to.eql('r');
                expect(turns[4].direct).to.be.true;         // direct
                expect(turns[4].no).to.be.not.ok;
                expect(turns[4].only).to.be.true;           // only!

                expect(turns[5]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[5].key).to.eql('|_e_\\');  // straight from | to \
                expect(turns[5].u).to.be.not.ok;
                expect(turns[5].restrictionID).to.eql('r');
                expect(turns[5].direct).to.be.false;        // indirect
                expect(turns[5].no).to.be.true;             // restricted!
                expect(turns[5].only).to.be.not.ok;
            });
        });


        describe('complex intersection - only turn via way', function() {
            //
            //           j
            //           ‖
            //     i ≃≃≃ g     'r2': `only_right_turn` FROM '/' VIA WAY '|' TO '≈'
            //          /
            //  a <--- b <=== c    'r1': `only_u_turn` FROM '=' VIA WAY '|' TO '≈'
            //         |
            //         |
            //  d ~~~> e ≈≈≈> f
            //          \
            //           h
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 1] }),
                iD.osmNode({ id: 'b', loc: [1, 1] }),
                iD.osmNode({ id: 'c', loc: [2, 1] }),
                iD.osmNode({ id: 'd', loc: [0,-1] }),
                iD.osmNode({ id: 'e', loc: [1,-1] }),
                iD.osmNode({ id: 'f', loc: [2,-1] }),
                iD.osmNode({ id: 'g', loc: [2, 2] }),
                iD.osmNode({ id: 'h', loc: [2,-2] }),
                iD.osmNode({ id: 'i', loc: [0, 2] }),
                iD.osmNode({ id: 'j', loc: [2, 3] }),
                iD.osmWay({ id: '-', nodes: ['b', 'a'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '=', nodes: ['c', 'b'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '~', nodes: ['d', 'e'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '≈', nodes: ['e', 'f'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '|', nodes: ['b', 'e'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '/', nodes: ['b', 'g'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '\\', nodes: ['e', 'h'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '≃', nodes: ['g', 'i'], tags: {highway: 'residential' } }),
                iD.osmWay({ id: '‖', nodes: ['j', 'g'], tags: {highway: 'residential' } }),
                iD.osmRelation({
                    id: 'r1',
                    tags: { type: 'restriction', restriction: 'only_u_turn' },
                    members: [
                        { role: 'from', id: '=', type: 'way' },
                        { role: 'via', id: '|', type: 'way' },
                        { role: 'to', id: '≈', type: 'way' }
                    ]
                }),
                iD.osmRelation({
                    id: 'r2',
                    tags: { type: 'restriction', restriction: 'only_right_turn' },
                    members: [
                        { role: 'from', id: '/', type: 'way' },
                        { role: 'via', id: '|', type: 'way' },
                        { role: 'to', id: '≈', type: 'way' }
                    ]
                })
            ]);

            it('allows via node and via way turns from a oneway', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('=', 1);
                expect(turns.length).to.eql(5);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('=_b_-');       // straight to -
                expect(turns[0].u).to.be.not.ok;
                expect(turns[0].restrictionID).to.eql('r1');
                expect(turns[0].direct).to.be.false;        // indirect
                expect(turns[0].no).to.be.true;             // restricted!
                expect(turns[0].only).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('=_b_|');       // left to |
                expect(turns[1].u).to.be.not.ok;
                expect(turns[1].restrictionID).to.eql('r1');
                expect(turns[1].direct).to.be.false;        // indirect
                expect(turns[1].no).to.be.not.ok;
                expect(turns[1].only).to.be.true;           // only (along via path)

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('=_b_|_e_≈');   // u-turn to ≈ via |
                expect(turns[2].u).to.be.not.ok;
                expect(turns[2].restrictionID).to.eql('r1');
                expect(turns[2].direct).to.be.true;         // direct
                expect(turns[2].no).to.be.not.ok;
                expect(turns[2].only).to.be.true;           // only!

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('=_b_|_e_\\');  // left to \ via |
                expect(turns[3].u).to.be.not.ok;
                expect(turns[3].restrictionID).to.eql('r1');
                expect(turns[3].direct).to.be.false;        // indirect
                expect(turns[3].no).to.be.true;             // restricted!
                expect(turns[3].only).to.be.not.ok;

                expect(turns[4]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[4].key).to.eql('=_b_/');       // right to /
                expect(turns[4].u).to.be.not.ok;
                expect(turns[4].restrictionID).to.eql('r1');
                expect(turns[4].direct).to.be.false;        // indirect
                expect(turns[4].no).to.be.true;             // restricted!
                expect(turns[4].only).to.be.not.ok;
            });

            it('allows via node and via way turns from a bidirectional', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('/', 1);
                expect(turns.length).to.eql(8);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('/_b_-');       // right to -
                expect(turns[0].u).to.be.not.ok;
                expect(turns[0].restrictionID).to.eql('r2');
                expect(turns[0].direct).to.be.false;        // indirect
                expect(turns[0].no).to.be.true;             // restricted!
                expect(turns[0].only).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('/_b_|');       // straight to |
                expect(turns[1].u).to.be.not.ok;
                expect(turns[1].restrictionID).to.eql('r2');
                expect(turns[1].direct).to.be.false;        // indirect
                expect(turns[1].no).to.be.not.ok;
                expect(turns[1].only).to.be.true;           // only (along via path)

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('/_b_|_e_≈');   // right turn from | to ≈
                expect(turns[2].u).to.be.not.ok;
                expect(turns[2].restrictionID).to.eql('r2');
                expect(turns[2].direct).to.be.true;         // direct
                expect(turns[2].no).to.be.not.ok;
                expect(turns[2].only).to.be.true;           // only!

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('/_b_|_e_\\');  // straight from | to \
                expect(turns[3].u).to.be.not.ok;
                expect(turns[3].restrictionID).to.eql('r2');
                expect(turns[3].direct).to.be.false;        // indirect
                expect(turns[3].no).to.be.true;             // restricted!
                expect(turns[3].only).to.be.not.ok;

                expect(turns[4]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[4].key).to.eql('/_b_/');       // u-turn
                expect(turns[4].u).to.be.ok;
                expect(turns[4].restrictionID).to.eql('r2');
                expect(turns[4].direct).to.be.false;        // indirect
                expect(turns[4].no).to.be.true;             // restricted!
                expect(turns[4].only).to.be.not.ok;
            });

            it('`only_` restriction is only effective towards the via', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('/', 1);
                expect(turns.length).to.eql(8);

                expect(turns[5]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[5].key).to.eql('/_g_/');  // u-turn from / to / (away from only-via)
                expect(turns[5].u).to.be.true;

                expect(turns[6]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[6].key).to.eql('/_g_≃');  // left turn from / to ≃ (away from only-via)
                expect(turns[6].u).to.be.not.ok;

                expect(turns[7]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[7].key).to.eql('/_g_‖');  // straight from / to ‖ (away from only-via)
                expect(turns[7].u).to.be.not.ok;
            });
        });

        describe('complex intersection - via 2 ways', function() {
            //
            //  a <--- b <=== c
            //         |
            //         *
            //         ‖
            //  d ~~~> e ≈≈≈> f
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 2] }),
                iD.osmNode({ id: 'b', loc: [1, 2] }),
                iD.osmNode({ id: 'c', loc: [2, 2] }),
                iD.osmNode({ id: 'd', loc: [0, 0] }),
                iD.osmNode({ id: 'e', loc: [1, 0] }),
                iD.osmNode({ id: 'f', loc: [2, 0] }),
                iD.osmNode({ id: '*', loc: [1, 1] }),
                iD.osmWay({ id: '-', nodes: ['b', 'a'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '=', nodes: ['c', 'b'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '~', nodes: ['d', 'e'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '≈', nodes: ['e', 'f'], tags: { highway: 'residential', oneway: 'yes' } }),
                iD.osmWay({ id: '|', nodes: ['b', '*'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '‖', nodes: ['*', 'e'], tags: { highway: 'residential' } })
            ]);

            it('with no restrictions, allows via node and via way turns', function() {
                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('=', 2);
                expect(turns.length).to.eql(4);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('=_b_-');  // straight to -
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('=_b_|');  // left to |
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('=_b_|_*_‖');  // left to ‖ via |
                expect(turns[2].u).to.be.not.ok;

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('=_b_|_*_‖_e_≈');  // u-turn via |,‖ to ≈
                expect(turns[3].u).to.be.not.ok;
            });


            it('supports `no_` via 2 way restriction (ordered)', function() {
                //  'r1': `no_u_turn` FROM '=' VIA WAYS '|','‖' TO '≈'
                var r1 = iD.osmRelation({
                    id: 'r1',
                    tags: { type: 'restriction', restriction: 'no_u_turn' },
                    members: [
                        { role: 'from', id: '=', type: 'way' },
                        { role: 'via', id: '|', type: 'way' },
                        { role: 'via', id: '‖', type: 'way' },
                        { role: 'to', id: '≈', type: 'way' }
                    ]
                });
                graph = graph.replace(r1);

                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('=', 2);
                expect(turns.length).to.eql(4);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('=_b_-');  // straight to -
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('=_b_|');  // left to |
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('=_b_|_*_‖');  // left to ‖ via |
                expect(turns[2].u).to.be.not.ok;

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('=_b_|_*_‖_e_≈');  // u-turn via |,‖ to ≈
                expect(turns[3].u).to.be.not.ok;
                expect(turns[3].restrictionID).to.eql('r1');
                expect(turns[3].direct).to.be.true;         // direct
                expect(turns[3].no).to.be.true;             // restricted!
                expect(turns[3].only).to.be.not.ok;
            });


            it('supports `no_` via 2 way restriction (unordered)', function() {
                //  'r1': `no_u_turn` FROM '=' VIA WAYS '|','‖' TO '≈'
                var r1 = iD.osmRelation({
                    id: 'r1',
                    tags: { type: 'restriction', restriction: 'no_u_turn' },
                    members: [
                        { role: 'from', id: '=', type: 'way' },
                        { role: 'via', id: '‖', type: 'way' },   // out of order
                        { role: 'via', id: '|', type: 'way' },   // out of order
                        { role: 'to', id: '≈', type: 'way' }
                    ]
                });
                graph = graph.replace(r1);

                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('=', 2);
                expect(turns.length).to.eql(4);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('=_b_-');  // straight to -
                expect(turns[0].u).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('=_b_|');  // left to |
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('=_b_|_*_‖');  // left to ‖ via |
                expect(turns[2].u).to.be.not.ok;

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('=_b_|_*_‖_e_≈');  // u-turn via |,‖ to ≈
                expect(turns[3].u).to.be.not.ok;
                expect(turns[3].restrictionID).to.eql('r1');
                expect(turns[3].direct).to.be.true;         // direct
                expect(turns[3].no).to.be.true;             // restricted!
                expect(turns[3].only).to.be.not.ok;
            });


            it('supports `only_` via 2 way restriction (ordered)', function() {
                //  'r1': `only_u_turn` FROM '=' VIA WAYS '|','‖' TO '≈'
                var r1 = iD.osmRelation({
                    id: 'r1',
                    tags: { type: 'restriction', restriction: 'only_u_turn' },
                    members: [
                        { role: 'from', id: '=', type: 'way' },
                        { role: 'via', id: '|', type: 'way' },
                        { role: 'via', id: '‖', type: 'way' },
                        { role: 'to', id: '≈', type: 'way' }
                    ]
                });
                graph = graph.replace(r1);

                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('=', 2);
                expect(turns.length).to.eql(4);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('=_b_-');  // straight to -
                expect(turns[0].u).to.be.not.ok;
                expect(turns[0].restrictionID).to.eql('r1');
                expect(turns[0].direct).to.be.false;         // indirect
                expect(turns[0].no).to.be.true;              // restricted!
                expect(turns[0].only).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('=_b_|');  // left to |
                expect(turns[1].u).to.be.not.ok;
                expect(turns[1].restrictionID).to.eql('r1');
                expect(turns[1].direct).to.be.false;        // indirect
                expect(turns[1].no).to.be.not.ok;
                expect(turns[1].only).to.be.true;           // only (along via path)

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('=_b_|_*_‖');  // left to ‖ via |
                expect(turns[2].u).to.be.not.ok;
                expect(turns[2].restrictionID).to.eql('r1');
                expect(turns[2].direct).to.be.false;        // indirect
                expect(turns[2].no).to.be.not.ok;
                expect(turns[2].only).to.be.true;           // only (along via path)

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('=_b_|_*_‖_e_≈');  // u-turn via |,‖ to ≈
                expect(turns[3].u).to.be.not.ok;
                expect(turns[3].restrictionID).to.eql('r1');
                expect(turns[3].direct).to.be.true;         // direct
                expect(turns[3].no).to.be.not.ok;
                expect(turns[3].only).to.be.true;           // only!
            });

            it('supports `only_` via 2 way restriction (unordered)', function() {
                //  'r1': `only_u_turn` FROM '=' VIA WAYS '‖','|' TO '≈'
                var r1 = iD.osmRelation({
                    id: 'r1',
                    tags: { type: 'restriction', restriction: 'only_u_turn' },
                    members: [
                        { role: 'from', id: '=', type: 'way' },
                        { role: 'via', id: '‖', type: 'way' },   // out of order
                        { role: 'via', id: '|', type: 'way' },   // out of order
                        { role: 'to', id: '≈', type: 'way' }
                    ]
                });
                graph = graph.replace(r1);

                var turns;
                turns = iD.osmIntersection(graph, 'b', maxDist).turns('=', 2);
                expect(turns.length).to.eql(4);

                expect(turns[0]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[0].key).to.eql('=_b_-');  // straight to -
                expect(turns[0].u).to.be.not.ok;
                expect(turns[0].restrictionID).to.eql('r1');
                expect(turns[0].direct).to.be.false;         // indirect
                expect(turns[0].no).to.be.true;              // restricted!
                expect(turns[0].only).to.be.not.ok;

                expect(turns[1]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[1].key).to.eql('=_b_|');  // left to |
                expect(turns[1].u).to.be.not.ok;
                expect(turns[1].restrictionID).to.eql('r1');
                expect(turns[1].direct).to.be.false;        // indirect
                expect(turns[1].no).to.be.not.ok;
                expect(turns[1].only).to.be.true;           // only (along via path)

                expect(turns[2]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[2].key).to.eql('=_b_|_*_‖');  // left to ‖ via |
                expect(turns[2].u).to.be.not.ok;
                expect(turns[2].restrictionID).to.eql('r1');
                expect(turns[2].direct).to.be.false;        // indirect
                expect(turns[2].no).to.be.not.ok;
                expect(turns[2].only).to.be.true;           // only (along via path)

                expect(turns[3]).to.be.an.instanceOf(iD.osmTurn);
                expect(turns[3].key).to.eql('=_b_|_*_‖_e_≈');  // u-turn via |,‖ to ≈
                expect(turns[3].u).to.be.not.ok;
                expect(turns[3].restrictionID).to.eql('r1');
                expect(turns[3].direct).to.be.true;         // direct
                expect(turns[3].no).to.be.not.ok;
                expect(turns[3].only).to.be.true;           // only!
            });
        });


        describe('complex intersection - via 2 ways with loops - gotchas', function() {
            //
            //            e
            //           / \
            //          /   \
            //   a --- b === c ~~~ d
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmNode({ id: 'c', loc: [3, 0] }),
                iD.osmNode({ id: 'd', loc: [4, 0] }),
                iD.osmNode({ id: 'e', loc: [2, 2] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '=', nodes: ['b', 'c'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '~', nodes: ['c', 'd'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '/', nodes: ['b', 'e'], tags: { highway: 'residential' } }),
                iD.osmWay({ id: '\\', nodes: ['e', 'c'], tags: { highway: 'residential' } })
            ]);

            it('with no restrictions, finds all turns', function() {
                var turns = iD.osmIntersection(graph, 'c', maxDist).turns('=', 2);
                expect(turns.length).to.eql(10);

                expect(turns[0].key).to.eql('=_b_=');
                expect(turns[0].u).to.be.true;

                expect(turns[1].key).to.eql('=_b_/');
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2].key).to.eql('=_b_/_e_\\');
                expect(turns[2].u).to.be.not.ok;

                expect(turns[3].key).to.eql('=_b_/_e_\\_c_~');
                expect(turns[3].u).to.be.not.ok;

                expect(turns[4].key).to.eql('=_b_-');
                expect(turns[4].u).to.be.not.ok;

                expect(turns[5].key).to.eql('=_c_=');
                expect(turns[5].u).to.be.true;

                expect(turns[6].key).to.eql('=_c_~');
                expect(turns[6].u).to.be.not.ok;

                expect(turns[7].key).to.eql('=_c_\\');
                expect(turns[7].u).to.be.not.ok;

                expect(turns[8].key).to.eql('=_c_\\_e_/');
                expect(turns[8].u).to.be.not.ok;

                expect(turns[9].key).to.eql('=_c_\\_e_/_b_-');
                expect(turns[9].u).to.be.not.ok;
            });

            it('matches from-via-to strictly when alternate paths exist between from-via-to', function() {
                var r1 = iD.osmRelation({
                    id: 'r1',
                    tags: { type: 'restriction', restriction: 'no_straight_on' },
                    members: [
                        { role: 'from', id: '=', type: 'way' },
                        { role: 'via', id: 'c', type: 'node' },
                        { role: 'to', id: '~', type: 'way' }
                    ]
                });
                graph = graph.replace(r1);

                var turns = iD.osmIntersection(graph, 'c', maxDist).turns('=', 2);
                expect(turns.length).to.eql(10);

                expect(turns[0].key).to.eql('=_b_=');
                expect(turns[0].u).to.be.true;

                expect(turns[1].key).to.eql('=_b_/');
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2].key).to.eql('=_b_/_e_\\');
                expect(turns[2].u).to.be.not.ok;

                expect(turns[3].key).to.eql('=_b_/_e_\\_c_~');
                expect(turns[3].u).to.be.not.ok;
                expect(turns[3].restrictionID).to.be.undefined;   // the alternate path should not match
                expect(turns[3].direct).to.be.undefined;

                expect(turns[4].key).to.eql('=_b_-');
                expect(turns[4].u).to.be.not.ok;

                expect(turns[5].key).to.eql('=_c_=');
                expect(turns[5].u).to.be.true;

                expect(turns[6].key).to.eql('=_c_~');
                expect(turns[6].u).to.be.not.ok;
                expect(turns[6].restrictionID).to.eql('r1');
                expect(turns[6].direct).to.be.true;         // direct
                expect(turns[6].no).to.be.true;             // restricted!
                expect(turns[6].only).to.be.not.ok;

                expect(turns[7].key).to.eql('=_c_\\');
                expect(turns[7].u).to.be.not.ok;

                expect(turns[8].key).to.eql('=_c_\\_e_/');
                expect(turns[8].u).to.be.not.ok;

                expect(turns[9].key).to.eql('=_c_\\_e_/_b_-');
                expect(turns[9].u).to.be.not.ok;
            });


            it('`only_` restriction is only effective towards the via', function() {
                var r1 = iD.osmRelation({
                    id: 'r1',
                    tags: { type: 'restriction', restriction: 'only_straight_on' },
                    members: [
                        { role: 'from', id: '=', type: 'way' },
                        { role: 'via', id: 'c', type: 'node' },
                        { role: 'to', id: '~', type: 'way' }
                    ]
                });
                graph = graph.replace(r1);

                var turns = iD.osmIntersection(graph, 'c', maxDist).turns('=', 2);
                expect(turns.length).to.eql(8);

                expect(turns[0].key).to.eql('=_b_=');         // not towards via
                expect(turns[0].u).to.be.true;

                expect(turns[1].key).to.eql('=_b_/');         // not towards via
                expect(turns[1].u).to.be.not.ok;

                expect(turns[2].key).to.eql('=_b_/_e_\\');    // not towards via
                expect(turns[2].u).to.be.not.ok;

                expect(turns[3].key).to.eql('=_b_/_e_\\_c_~');    // not towards via
                expect(turns[3].u).to.be.not.ok;
                expect(turns[3].restrictionID).to.be.undefined;   // the alternate path should not match
                expect(turns[3].direct).to.be.undefined;

                expect(turns[4].key).to.eql('=_b_-');         // not towards via
                expect(turns[4].u).to.be.not.ok;

                expect(turns[5].key).to.eql('=_c_=');
                expect(turns[5].u).to.be.true;
                expect(turns[5].restrictionID).to.eql('r1');
                expect(turns[5].direct).to.be.false;         // indirect
                expect(turns[5].no).to.be.true;              // restricted!
                expect(turns[5].only).to.be.not.ok;

                expect(turns[6].key).to.eql('=_c_~');
                expect(turns[6].u).to.be.not.ok;
                expect(turns[6].restrictionID).to.eql('r1');
                expect(turns[6].direct).to.be.true;          // direct
                expect(turns[6].no).to.be.not.ok;
                expect(turns[6].only).to.be.true;            // only!

                expect(turns[7].key).to.eql('=_c_\\');
                expect(turns[7].u).to.be.not.ok;
                expect(turns[7].restrictionID).to.eql('r1');
                expect(turns[7].direct).to.be.false;         // indirect
                expect(turns[7].no).to.be.true;              // restricted!
                expect(turns[7].only).to.be.not.ok;
            });
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
        //   /     \         (no left turn)
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
        //   /          \       (no u turn)
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
        //   /          \       (no u turn)
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
