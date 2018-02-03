describe('iD.actionRestrictTurn', function() {
    var projection = d3.geoMercator().scale(250 / Math.PI);

    describe('via node', function() {

        it('adds a via node restriction to an unrestricted turn', function() {
            // u====*--->w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: '*'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', '*']}),
                iD.osmWay({id: '-', nodes: ['*', 'w']})
            ]);
            var action = iD.actionRestrictTurn({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'},
                restriction: 'no_right_turn'
            }, projection, 'r');

            graph = action(graph);

            var r = graph.entity('r');
            expect(r.tags).to.eql({type: 'restriction', restriction: 'no_right_turn'});

            var f = r.memberByRole('from');
            expect(f.id).to.eql('=');
            expect(f.type).to.eql('way');

            var v = r.memberByRole('via');
            expect(v.id).to.eql('*');
            expect(v.type).to.eql('node');

            var t = r.memberByRole('to');
            expect(t.id).to.eql('-');
            expect(t.type).to.eql('way');
        });

//TODO?
        it.skip('infers the restriction type based on the turn angle', function() {
            // u====*~~~~w
            //      |
            //      x
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u', loc: [-1,  0]}),
                iD.osmNode({id: '*', loc: [ 0,  0]}),
                iD.osmNode({id: 'w', loc: [ 1,  0]}),
                iD.osmNode({id: 'x', loc: [ 0, -1]}),
                iD.osmWay({id: '=', nodes: ['u', '*']}),
                iD.osmWay({id: '-', nodes: ['*', 'x']}),
                iD.osmWay({id: '~', nodes: ['*', 'w']})
            ]);

            var r1 = iD.actionRestrictTurn({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'x', way: '-'}
            }, projection, 'r')(graph);
            expect(r1.entity('r').tags.restriction).to.equal('no_right_turn');

            var r2 = iD.actionRestrictTurn({
                from: {node: 'x', way: '-'},
                via:  {node: '*'},
                to:   {node: 'w', way: '~'}
            }, projection, 'r')(graph);
            expect(r2.entity('r').tags.restriction).to.equal('no_right_turn');

            var l1 = iD.actionRestrictTurn({
                from: {node: 'x', way: '-'},
                via:  {node: '*'},
                to:   {node: 'u', way: '='}
            }, projection, 'r')(graph);
            expect(l1.entity('r').tags.restriction).to.equal('no_left_turn');

            var l2 = iD.actionRestrictTurn({
                from: {node: 'w', way: '~'},
                via:  {node: '*'},
                to:   {node: 'x', way: '-'}
            }, projection, 'r')(graph);
            expect(l2.entity('r').tags.restriction).to.equal('no_left_turn');

            var s = iD.actionRestrictTurn({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '~'}
            }, projection, 'r')(graph);
            expect(s.entity('r').tags.restriction).to.equal('no_straight_on');

            var u = iD.actionRestrictTurn({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='}
            }, projection, 'r')(graph);
            expect(u.entity('r').tags.restriction).to.equal('no_u_turn');
        });

//TODO?
        it.skip('infers no_u_turn from acute angle made by forward oneways', function() {
            //      *
            //     / \
            //  w2/   \w1
            //   /     \
            //  u       x
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u', loc: [-1, -20]}),
                iD.osmNode({id: '*', loc: [ 0,   0]}),
                iD.osmNode({id: 'x', loc: [ 1, -20]}),
                iD.osmWay({id: 'w1', nodes: ['x', '*'], tags: {oneway: 'yes'}}),
                iD.osmWay({id: 'w2', nodes: ['*', 'u'], tags: {oneway: 'yes'}})
            ]);

            var r = iD.actionRestrictTurn({
                from: {node: 'x', way: 'w1'},
                via:  {node: '*'},
                to:   {node: 'u', way: 'w2'}
            }, projection, 'r')(graph);
            expect(r.entity('r').tags.restriction).to.equal('no_u_turn');
        });

//TODO?
        it.skip('infers no_u_turn from acute angle made by reverse oneways', function() {
            //      *
            //     / \
            //  w2/   \w1
            //   /     \
            //  u       x
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u', loc: [-1, -20]}),
                iD.osmNode({id: '*', loc: [ 0,   0]}),
                iD.osmNode({id: 'x', loc: [ 1, -20]}),
                iD.osmWay({id: 'w1', nodes: ['*', 'x'], tags: {oneway: '-1'}}),
                iD.osmWay({id: 'w2', nodes: ['u', '*'], tags: {oneway: '-1'}})
            ]);

            var r = iD.actionRestrictTurn({
                from: {node: 'x', way: 'w1'},
                via:  {node: '*'},
                to:   {node: 'u', way: 'w2'}
            }, projection, 'r')(graph);
            expect(r.entity('r').tags.restriction).to.equal('no_u_turn');
        });
    });


    describe('via way', function() {

        it('adds a via way restriction to an unrestricted turn', function() {
            // u ==== VIA ---> w
            var graph = iD.coreGraph([
                iD.osmNode({id: 'u'}),
                iD.osmNode({id: 'V1'}),
                iD.osmNode({id: 'V2'}),
                iD.osmNode({id: 'w'}),
                iD.osmWay({id: '=', nodes: ['u', 'V1']}),
                iD.osmWay({id: 'VIA', nodes: ['V1', 'V2']}),
                iD.osmWay({id: '-', nodes: ['V2', 'w']})
            ]);
            var action = iD.actionRestrictTurn({
                from: {node: 'u', way: '='},
                via:  {ways: ['VIA']},
                to:   {node: 'w', way: '-'},
                restriction: 'no_u_turn'
            }, projection, 'r');

            graph = action(graph);

            var r = graph.entity('r');
            expect(r.tags).to.eql({type: 'restriction', restriction: 'no_u_turn'});

            var f = r.memberByRole('from');
            expect(f.id).to.eql('=');
            expect(f.type).to.eql('way');

            var v = r.memberByRole('via');
            expect(v.id).to.eql('VIA');
            expect(v.type).to.eql('way');

            var t = r.memberByRole('to');
            expect(t.id).to.eql('-');
            expect(t.type).to.eql('way');
        });


// TODO?

        // it('infers the restriction type based on the turn angle', function() {
        //     // u====*~~~~w
        //     //      |
        //     //      x
        //     var graph = iD.coreGraph([
        //             iD.osmNode({id: 'u', loc: [-1,  0]}),
        //             iD.osmNode({id: '*', loc: [ 0,  0]}),
        //             iD.osmNode({id: 'w', loc: [ 1,  0]}),
        //             iD.osmNode({id: 'x', loc: [ 0, -1]}),
        //             iD.osmWay({id: '=', nodes: ['u', '*']}),
        //             iD.osmWay({id: '-', nodes: ['*', 'x']}),
        //             iD.osmWay({id: '~', nodes: ['*', 'w']})
        //         ]);

        //     var r1 = iD.actionRestrictTurn({
        //         from: {node: 'u', way: '='},
        //         via:  {node: '*'},
        //         to:   {node: 'x', way: '-'}
        //     }, projection, 'r')(graph);
        //     expect(r1.entity('r').tags.restriction).to.equal('no_right_turn');

        //     var r2 = iD.actionRestrictTurn({
        //         from: {node: 'x', way: '-'},
        //         via:  {node: '*'},
        //         to:   {node: 'w', way: '~'}
        //     }, projection, 'r')(graph);
        //     expect(r2.entity('r').tags.restriction).to.equal('no_right_turn');

        //     var l1 = iD.actionRestrictTurn({
        //         from: {node: 'x', way: '-'},
        //         via:  {node: '*'},
        //         to:   {node: 'u', way: '='}
        //     }, projection, 'r')(graph);
        //     expect(l1.entity('r').tags.restriction).to.equal('no_left_turn');

        //     var l2 = iD.actionRestrictTurn({
        //         from: {node: 'w', way: '~'},
        //         via:  {node: '*'},
        //         to:   {node: 'x', way: '-'}
        //     }, projection, 'r')(graph);
        //     expect(l2.entity('r').tags.restriction).to.equal('no_left_turn');

        //     var s = iD.actionRestrictTurn({
        //         from: {node: 'u', way: '='},
        //         via:  {node: '*'},
        //         to:   {node: 'w', way: '~'}
        //     }, projection, 'r')(graph);
        //     expect(s.entity('r').tags.restriction).to.equal('no_straight_on');

        //     var u = iD.actionRestrictTurn({
        //         from: {node: 'u', way: '='},
        //         via:  {node: '*'},
        //         to:   {node: 'u', way: '='}
        //     }, projection, 'r')(graph);
        //     expect(u.entity('r').tags.restriction).to.equal('no_u_turn');
        // });

        // it('infers no_u_turn from acute angle made by forward oneways', function() {
        //     //      *
        //     //     / \
        //     //  w2/   \w1
        //     //   /     \
        //     //  u       x
        //     var graph = iD.coreGraph([
        //             iD.osmNode({id: 'u', loc: [-1, -20]}),
        //             iD.osmNode({id: '*', loc: [ 0,   0]}),
        //             iD.osmNode({id: 'x', loc: [ 1, -20]}),
        //             iD.osmWay({id: 'w1', nodes: ['x', '*'], tags: {oneway: 'yes'}}),
        //             iD.osmWay({id: 'w2', nodes: ['*', 'u'], tags: {oneway: 'yes'}})
        //         ]);

        //     var r = iD.actionRestrictTurn({
        //         from: {node: 'x', way: 'w1'},
        //         via:  {node: '*'},
        //         to:   {node: 'u', way: 'w2'}
        //     }, projection, 'r')(graph);
        //     expect(r.entity('r').tags.restriction).to.equal('no_u_turn');
        // });

        // it('infers no_u_turn from acute angle made by reverse oneways', function() {
        //     //      *
        //     //     / \
        //     //  w2/   \w1
        //     //   /     \
        //     //  u       x
        //     var graph = iD.coreGraph([
        //             iD.osmNode({id: 'u', loc: [-1, -20]}),
        //             iD.osmNode({id: '*', loc: [ 0,   0]}),
        //             iD.osmNode({id: 'x', loc: [ 1, -20]}),
        //             iD.osmWay({id: 'w1', nodes: ['*', 'x'], tags: {oneway: '-1'}}),
        //             iD.osmWay({id: 'w2', nodes: ['u', '*'], tags: {oneway: '-1'}})
        //         ]);

        //     var r = iD.actionRestrictTurn({
        //         from: {node: 'x', way: 'w1'},
        //         via:  {node: '*'},
        //         to:   {node: 'u', way: 'w2'}
        //     }, projection, 'r')(graph);
        //     expect(r.entity('r').tags.restriction).to.equal('no_u_turn');
        // });
    });
});
