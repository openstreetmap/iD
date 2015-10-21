describe("iD.actions.RestrictTurn", function() {
    var projection = d3.geo.mercator().scale(250 / Math.PI);

    it('adds a restriction to an unrestricted turn', function() {
        // u====*--->w
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', '*']}),
                iD.Way({id: '-', nodes: ['*', 'w']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'},
                restriction: 'no_right_turn'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_right_turn'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '=', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '-', type: 'way'});
    });

    it('splits the from way when necessary (forward)', function() {
        // u====*===>w
        //      |
        //      x
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Node({id: 'x'}),
                iD.Way({id: '=', nodes: ['u', '*', 'w']}),
                iD.Way({id: '-', nodes: ['*', 'x']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'x', way: '-'},
                restriction: 'no_right_turn'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_right_turn'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '=', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '-', type: 'way'});
    });

    it('splits the from way when necessary (backward)', function() {
        // u====*===>w
        //      |
        //      x
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Node({id: 'x'}),
                iD.Way({id: '=', nodes: ['u', '*', 'w']}),
                iD.Way({id: '-', nodes: ['*', 'x']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'w', way: '=', newID: '=='},
                via:  {node: '*'},
                to:   {node: 'x', way: '-'},
                restriction: 'no_left_turn'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_left_turn'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '==', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '-', type: 'way'});
    });

    it('splits the from way when necessary (straight on forward)', function() {
        // u====*===>w
        //      |
        //      x
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Node({id: 'x'}),
                iD.Way({id: '=', nodes: ['u', '*', 'w']}),
                iD.Way({id: '-', nodes: ['*', 'x']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'u', way: '=', newID: '=='},
                via:  {node: '*'},
                to:   {node: 'w', way: '='},
                restriction: 'no_straight_on'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_straight_on'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '=', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '==', type: 'way'});
    });

    it('splits the from way when necessary (straight on backward)', function() {
        // u<===*====w
        //      |
        //      x
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Node({id: 'x'}),
                iD.Way({id: '=', nodes: ['w', '*', 'u']}),
                iD.Way({id: '-', nodes: ['*', 'x']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'u', way: '=', newID: '=='},
                via:  {node: '*'},
                to:   {node: 'w', way: '='},
                restriction: 'no_straight_on'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_straight_on'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '==', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '=', type: 'way'});
    });

    it('splits the from way when necessary (vertex closes from)', function() {
        //
        //  b -- c
        //  |    |
        //  a -- * === w
        //
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [-1, 0]}),
                iD.Node({id: 'b', loc: [-1, 1]}),
                iD.Node({id: 'c', loc: [ 0, 1]}),
                iD.Node({id: '*', loc: [ 0, 0]}),
                iD.Node({id: 'w', loc: [ 1, 0]}),
                iD.Way({id: '-', nodes: ['*', 'a', 'b', 'c', '*']}),
                iD.Way({id: '=', nodes: ['*', 'w']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'c', way: '-', newID: '--'},
                via:  {node: '*'},
                to:   {node: 'w', way: '='},
                restriction: 'no_left_turn'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_left_turn'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '--', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '=', type: 'way'});
    });

    it('splits the from/to way when necessary (vertex closes from/to)', function() {
        //
        //  b -- c
        //  |    |
        //  a -- * === w
        //
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [-1, 0]}),
                iD.Node({id: 'b', loc: [-1, 1]}),
                iD.Node({id: 'c', loc: [ 0, 1]}),
                iD.Node({id: '*', loc: [ 0, 0]}),
                iD.Node({id: 'w', loc: [ 1, 0]}),
                iD.Way({id: '-', nodes: ['*', 'a', 'b', 'c', '*']}),
                iD.Way({id: '=', nodes: ['*', 'w']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'a', way: '-', newID: '--'},
                via:  {node: '*'},
                to:   {node: 'c', way: '-'},
                restriction: 'no_left_turn'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_left_turn'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '-', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '--', type: 'way'});
    });

    it('splits the to way when necessary (forward)', function() {
        // u====*===>w
        //      |
        //      x
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Node({id: 'x'}),
                iD.Way({id: '=', nodes: ['u', '*', 'w']}),
                iD.Way({id: '-', nodes: ['*', 'x']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'x', way: '-'},
                via:  {node: '*'},
                to:   {node: 'w', way: '=', newID: '=='},
                restriction: 'no_right_turn'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_right_turn'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '-', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '==', type: 'way'});
    });

    it('splits the to way when necessary (backward)', function() {
        // u====*===>w
        //      |
        //      x
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Node({id: 'x'}),
                iD.Way({id: '=', nodes: ['u', '*', 'w']}),
                iD.Way({id: '-', nodes: ['*', 'x']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'x', way: '-'},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                restriction: 'no_left_turn'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_left_turn'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '-', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '=', type: 'way'});
    });

    it('splits the to way when necessary (vertex closes to)', function() {
        //
        //  b -- c
        //  |    |
        //  a -- * === w
        //
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [-1, 0]}),
                iD.Node({id: 'b', loc: [-1, 1]}),
                iD.Node({id: 'c', loc: [ 0, 1]}),
                iD.Node({id: '*', loc: [ 0, 0]}),
                iD.Node({id: 'w', loc: [ 1, 0]}),
                iD.Way({id: '-', nodes: ['*', 'a', 'b', 'c', '*']}),
                iD.Way({id: '=', nodes: ['*', 'w']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'w', way: '='},
                via:  {node: '*'},
                to:   {node: 'c', way: '-', newID: '--'},
                restriction: 'no_right_turn'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_right_turn'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '=', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '--', type: 'way'});
    });

    it('splits the from/to way of a U-turn (forward)', function() {
        // u====*===>w
        //      |
        //      x
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Node({id: 'x'}),
                iD.Way({id: '=', nodes: ['u', '*', 'w']}),
                iD.Way({id: '-', nodes: ['*', 'x']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                restriction: 'no_u_turn'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_u_turn'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '=', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '=', type: 'way'});
    });

    it('splits the from/to way of a U-turn (backward)', function() {
        // u====*===>w
        //      |
        //      x
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Node({id: 'x'}),
                iD.Way({id: '=', nodes: ['u', '*', 'w']}),
                iD.Way({id: '-', nodes: ['*', 'x']})
            ]),
            action = iD.actions.RestrictTurn({
                from: {node: 'w', way: '=', newID: '=='},
                via:  {node: '*'},
                to:   {node: 'w', way: '=', newID: '~~'},
                restriction: 'no_u_turn'
            }, projection, 'r');

        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).to.eql({type: 'restriction', restriction: 'no_u_turn'});
        expect(_.pick(r.memberByRole('from'), 'id', 'type')).to.eql({id: '==', type: 'way'});
        expect(_.pick(r.memberByRole('via'), 'id', 'type')).to.eql({id: '*', type: 'node'});
        expect(_.pick(r.memberByRole('to'), 'id', 'type')).to.eql({id: '==', type: 'way'});
    });

    it('infers the restriction type based on the turn angle', function() {
        // u====*~~~~w
        //      |
        //      x
        var graph = iD.Graph([
                iD.Node({id: 'u', loc: [-1,  0]}),
                iD.Node({id: '*', loc: [ 0,  0]}),
                iD.Node({id: 'w', loc: [ 1,  0]}),
                iD.Node({id: 'x', loc: [ 0, -1]}),
                iD.Way({id: '=', nodes: ['u', '*']}),
                iD.Way({id: '-', nodes: ['*', 'x']}),
                iD.Way({id: '~', nodes: ['*', 'w']})
            ]);

        var r1 = iD.actions.RestrictTurn({
            from: {node: 'u', way: '='},
            via:  {node: '*'},
            to:   {node: 'x', way: '-'}
        }, projection, 'r')(graph);
        expect(r1.entity('r').tags.restriction).to.equal('no_right_turn');

        var r2 = iD.actions.RestrictTurn({
            from: {node: 'x', way: '-'},
            via:  {node: '*'},
            to:   {node: 'w', way: '~'}
        }, projection, 'r')(graph);
        expect(r2.entity('r').tags.restriction).to.equal('no_right_turn');

        var l1 = iD.actions.RestrictTurn({
            from: {node: 'x', way: '-'},
            via:  {node: '*'},
            to:   {node: 'u', way: '='}
        }, projection, 'r')(graph);
        expect(l1.entity('r').tags.restriction).to.equal('no_left_turn');

        var l2 = iD.actions.RestrictTurn({
            from: {node: 'w', way: '~'},
            via:  {node: '*'},
            to:   {node: 'x', way: '-'}
        }, projection, 'r')(graph);
        expect(l2.entity('r').tags.restriction).to.equal('no_left_turn');

        var s = iD.actions.RestrictTurn({
            from: {node: 'u', way: '='},
            via:  {node: '*'},
            to:   {node: 'w', way: '~'}
        }, projection, 'r')(graph);
        expect(s.entity('r').tags.restriction).to.equal('no_straight_on');

        var u = iD.actions.RestrictTurn({
            from: {node: 'u', way: '='},
            via:  {node: '*'},
            to:   {node: 'u', way: '='}
        }, projection, 'r')(graph);
        expect(u.entity('r').tags.restriction).to.equal('no_u_turn');
    });

    it('infers no_u_turn from acute angle made by forward oneways', function() {
        //      *
        //     / \
        //  w2/   \w1
        //   /     \
        //  u       x
        var graph = iD.Graph([
                iD.Node({id: 'u', loc: [-1, -20]}),
                iD.Node({id: '*', loc: [ 0,   0]}),
                iD.Node({id: 'x', loc: [ 1, -20]}),
                iD.Way({id: 'w1', nodes: ['x', '*'], tags: {oneway: 'yes'}}),
                iD.Way({id: 'w2', nodes: ['*', 'u'], tags: {oneway: 'yes'}})
            ]);

        var r = iD.actions.RestrictTurn({
            from: {node: 'x', way: 'w1'},
            via:  {node: '*'},
            to:   {node: 'u', way: 'w2'}
        }, projection, 'r')(graph);
        expect(r.entity('r').tags.restriction).to.equal('no_u_turn');
    });

    it('infers no_u_turn from acute angle made by reverse oneways', function() {
        //      *
        //     / \
        //  w2/   \w1
        //   /     \
        //  u       x
        var graph = iD.Graph([
                iD.Node({id: 'u', loc: [-1, -20]}),
                iD.Node({id: '*', loc: [ 0,   0]}),
                iD.Node({id: 'x', loc: [ 1, -20]}),
                iD.Way({id: 'w1', nodes: ['*', 'x'], tags: {oneway: '-1'}}),
                iD.Way({id: 'w2', nodes: ['u', '*'], tags: {oneway: '-1'}})
            ]);

        var r = iD.actions.RestrictTurn({
            from: {node: 'x', way: 'w1'},
            via:  {node: '*'},
            to:   {node: 'u', way: 'w2'}
        }, projection, 'r')(graph);
        expect(r.entity('r').tags.restriction).to.equal('no_u_turn');
    });

});
