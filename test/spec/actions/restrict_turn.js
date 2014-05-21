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

    it('guesses the restriction type based on the turn angle', function() {
        // u====*~~~~w
        //      |
        //      x
        var graph = iD.Graph([
                iD.Node({id: 'u', loc: [-1,  0]}),
                iD.Node({id: '*', loc: [ 0,  0]}),
                iD.Node({id: 'w', loc: [ 0,  1]}),
                iD.Node({id: 'x', loc: [ 0, -1]}),
                iD.Way({id: '=', nodes: ['u', '*']}),
                iD.Way({id: '-', nodes: ['*', 'x']}),
                iD.Way({id: '~', nodes: ['*', 'w']})
            ]);

        var r = iD.actions.RestrictTurn({
            from: {node: 'u', way: '='},
            via:  {node: '*'},
            to:   {node: 'x', way: '-'}
        }, projection, 'r')(graph);
        expect(r.entity('r').tags.restriction).to.equal('no_right_turn');

        var l = iD.actions.RestrictTurn({
            from: {node: 'x', way: '-'},
            via:  {node: '*'},
            to:   {node: 'u', way: '='}
        }, projection, 'r')(graph);
        expect(l.entity('r').tags.restriction).to.equal('no_left_turn');

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
});
