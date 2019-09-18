describe('iD.actionReverse', function () {
    it('reverses the order of nodes in the way', function () {
        var node1 = iD.osmNode();
        var node2 = iD.osmNode();
        var way = iD.osmWay({nodes: [node1.id, node2.id]});
        var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, way]));
        expect(graph.entity(way.id).nodes).to.eql([node2.id, node1.id]);
    });

    it('preserves non-directional tags', function () {
        var way = iD.osmWay({tags: {'highway': 'residential'}});
        var graph = iD.coreGraph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'highway': 'residential'});
    });

    describe('reverses directional tags on nodes', function () {
        it('reverses relative directions', function () {
            var node1 = iD.osmNode({ tags: { 'direction': 'forward' } });
            var graph = iD.actionReverse(node1.id)(iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).to.eql({ 'direction': 'backward' });
        });

        it('reverses relative directions for arbitrary direction tags', function () {
            var node1 = iD.osmNode({ tags: { 'traffic_sign:direction': 'forward' } });
            var graph = iD.actionReverse(node1.id)(iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).to.eql({ 'traffic_sign:direction': 'backward' });
        });

        it('reverses absolute directions, cardinal compass points', function () {
            var node1 = iD.osmNode({ tags: { 'direction': 'E' } });
            var graph = iD.actionReverse(node1.id)(iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).to.eql({ 'direction': 'W' });
        });

        it('reverses absolute directions, intercardinal compass points', function () {
            var node1 = iD.osmNode({ tags: { 'direction': 'SE' } });
            var graph = iD.actionReverse(node1.id)(iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).to.eql({ 'direction': 'NW' });
        });

        it('reverses absolute directions, secondary intercardinal compass points', function () {
            var node1 = iD.osmNode({ tags: { 'direction': 'NNE' } });
            var graph = iD.actionReverse(node1.id)(iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).to.eql({ 'direction': 'SSW' });
        });

        it('reverses absolute directions, 0 degrees', function () {
            var node1 = iD.osmNode({ tags: { 'direction': '0' } });
            var graph = iD.actionReverse(node1.id)(iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).to.eql({ 'direction': '180' });
        });

        it('reverses absolute directions, positive degrees', function () {
            var node1 = iD.osmNode({ tags: { 'direction': '85.5' } });
            var graph = iD.actionReverse(node1.id)(iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).to.eql({ 'direction': '265.5' });
        });

        it('reverses absolute directions, positive degrees > 360', function () {
            var node1 = iD.osmNode({ tags: { 'direction': '385.5' } });
            var graph = iD.actionReverse(node1.id)(iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).to.eql({ 'direction': '205.5' });
        });

        it('reverses absolute directions, negative degrees', function () {
            var node1 = iD.osmNode({ tags: { 'direction': '-85.5' } });
            var graph = iD.actionReverse(node1.id)(iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).to.eql({ 'direction': '94.5' });
        });

        it('preserves non-directional tags', function () {
            var node1 = iD.osmNode({ tags: { 'traffic_sign': 'maxspeed' } });
            var graph = iD.actionReverse(node1.id)(iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).to.eql({ 'traffic_sign': 'maxspeed' });
        });

        it('preserves non-reversible direction tags', function () {
            var node1 = iD.osmNode({ tags: { 'direction': 'both' } });
            var graph = iD.actionReverse(node1.id)(iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).to.eql({ 'direction': 'both' });
        });
    });

    describe('reverses oneway', function () {
        it('preserves oneway tags', function () {
            var way = iD.osmWay({tags: {'oneway': 'yes'}});
            var graph = iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'oneway': 'yes'});
        });

        it('reverses oneway tags if reverseOneway: true is provided', function () {
            var graph = iD.coreGraph([
                iD.osmWay({id: 'yes', tags: {oneway: 'yes'}}),
                iD.osmWay({id: 'no', tags: {oneway: 'no'}}),
                iD.osmWay({id: '1', tags: {oneway: '1'}}),
                iD.osmWay({id: '-1', tags: {oneway: '-1'}})
            ]);

            expect(iD.actionReverse('yes', {reverseOneway: true})(graph)
                .entity('yes').tags).to.eql({oneway: '-1'}, 'yes');
            expect(iD.actionReverse('no', {reverseOneway: true})(graph)
                .entity('no').tags).to.eql({oneway: 'no'}, 'no');
            expect(iD.actionReverse('1', {reverseOneway: true})(graph)
                .entity('1').tags).to.eql({oneway: '-1'}, '1');
            expect(iD.actionReverse('-1', {reverseOneway: true})(graph)
                .entity('-1').tags).to.eql({oneway: 'yes'}, '-1');
        });

        it('ignores other oneway tags', function () {
            var graph = iD.coreGraph([
                iD.osmWay({id: 'alternating', tags: {oneway: 'alternating'}}),
                iD.osmWay({id: 'reversible', tags: {oneway: 'reversible'}}),
                iD.osmWay({id: 'dummy', tags: {oneway: 'dummy'}})
            ]);

            expect(iD.actionReverse('alternating', {reverseOneway: true})(graph)
                .entity('alternating').tags).to.eql({oneway: 'alternating'}, 'alternating');
            expect(iD.actionReverse('reversible', {reverseOneway: true})(graph)
                .entity('reversible').tags).to.eql({oneway: 'reversible'}, 'reversible');
            expect(iD.actionReverse('dummy', {reverseOneway: true})(graph)
                .entity('dummy').tags).to.eql({oneway: 'dummy'}, 'dummy');
        });
    });


    describe('reverses incline', function () {
        it('transforms incline=up ⟺ incline=down', function () {
            var way = iD.osmWay({tags: {'incline': 'up'}});
            var graph = iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'incline': 'down'});

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'incline': 'up'});
        });

        it('negates numeric-valued incline tags', function () {
            var way = iD.osmWay({tags: {'incline': '5%'}});
            var graph = iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'incline': '-5%'});

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'incline': '5%'});

            way = iD.osmWay({tags: {'incline': '.8°'}});
            graph = iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'incline': '-.8°'});
        });
    });


    describe('reverses directional keys on ways', function () {
        it('transforms *:right=* ⟺ *:left=*', function () {
            var way = iD.osmWay({tags: {'cycleway:right': 'lane'}});
            var graph = iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'cycleway:left': 'lane'});

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'cycleway:right': 'lane'});
        });

        it('transforms *:right:*=* ⟺ *:left:*=*', function () {
            var way = iD.osmWay({tags: {'cycleway:right:surface': 'paved'}});
            var graph = iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'cycleway:left:surface': 'paved'});

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'cycleway:right:surface': 'paved'});
        });

        it('transforms *:forward=* ⟺ *:backward=*', function () {
            var way = iD.osmWay({tags: {'maxspeed:forward': '25'}});
            var graph = iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'maxspeed:backward': '25'});

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'maxspeed:forward': '25'});
        });

        it('transforms multiple directional tags', function () {
            var way = iD.osmWay({tags: {'maxspeed:forward': '25', 'maxspeed:backward': '30'}});
            var graph = iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).to.eql({'maxspeed:backward': '25', 'maxspeed:forward': '30'});
        });
    });


    describe('reverses directional values on ways', function () {
        it('transforms *=up ⟺ *=down', function () {
            var graph = iD.coreGraph([
                iD.osmWay({id: 'inclineU', tags: {incline: 'up'}}),
                iD.osmWay({id: 'directionU', tags: {direction: 'up'}}),
                iD.osmWay({id: 'inclineD', tags: {incline: 'down'}}),
                iD.osmWay({id: 'directionD', tags: {direction: 'down'}})
            ]);

            expect(iD.actionReverse('inclineU')(graph)
                .entity('inclineU').tags).to.eql({incline: 'down'}, 'inclineU');
            expect(iD.actionReverse('directionU')(graph)
                .entity('directionU').tags).to.eql({direction: 'down'}, 'directionU');

            expect(iD.actionReverse('inclineD')(graph)
                .entity('inclineD').tags).to.eql({incline: 'up'}, 'inclineD');
            expect(iD.actionReverse('directionD')(graph)
                .entity('directionD').tags).to.eql({direction: 'up'}, 'directionD');
        });

        it('skips *=up ⟺ *=down for ignored tags', function () {
            var graph = iD.coreGraph([
                iD.osmWay({id: 'name', tags: {name: 'up'}}),
                iD.osmWay({id: 'note', tags: {note: 'up'}}),
                iD.osmWay({id: 'ref', tags: {ref: 'down'}}),
                iD.osmWay({id: 'description', tags: {description: 'down'}})
            ]);

            expect(iD.actionReverse('name')(graph)
                .entity('name').tags).to.eql({name: 'up'}, 'name');
            expect(iD.actionReverse('note')(graph)
                .entity('note').tags).to.eql({note: 'up'}, 'note');
            expect(iD.actionReverse('ref')(graph)
                .entity('ref').tags).to.eql({ref: 'down'}, 'ref');
            expect(iD.actionReverse('description')(graph)
                .entity('description').tags).to.eql({description: 'down'}, 'description');
        });

        it('transforms *=forward ⟺ *=backward', function () {
            var graph = iD.coreGraph([
                iD.osmWay({id: 'conveyingF', tags: {conveying: 'forward'}}),
                iD.osmWay({id: 'directionF', tags: {direction: 'forward'}}),
                iD.osmWay({id: 'priorityF', tags: {priority: 'forward'}}),
                iD.osmWay({id: 'trolley_wireF', tags: {trolley_wire: 'forward'}}),
                iD.osmWay({id: 'conveyingB', tags: {conveying: 'backward'}}),
                iD.osmWay({id: 'directionB', tags: {direction: 'backward'}}),
                iD.osmWay({id: 'priorityB', tags: {priority: 'backward'}}),
                iD.osmWay({id: 'trolley_wireB', tags: {trolley_wire: 'backward'}})
            ]);

            expect(iD.actionReverse('conveyingF')(graph)
                .entity('conveyingF').tags).to.eql({conveying: 'backward'}, 'conveyingF');
            expect(iD.actionReverse('directionF')(graph)
                .entity('directionF').tags).to.eql({direction: 'backward'}, 'directionF');
            expect(iD.actionReverse('priorityF')(graph)
                .entity('priorityF').tags).to.eql({priority: 'backward'}, 'priorityF');
            expect(iD.actionReverse('trolley_wireF')(graph)
                .entity('trolley_wireF').tags).to.eql({trolley_wire: 'backward'}, 'trolley_wireF');

            expect(iD.actionReverse('conveyingB')(graph)
                .entity('conveyingB').tags).to.eql({conveying: 'forward'}, 'conveyingB');
            expect(iD.actionReverse('directionB')(graph)
                .entity('directionB').tags).to.eql({direction: 'forward'}, 'directionB');
            expect(iD.actionReverse('priorityB')(graph)
                .entity('priorityB').tags).to.eql({priority: 'forward'}, 'priorityB');
            expect(iD.actionReverse('trolley_wireB')(graph)
                .entity('trolley_wireB').tags).to.eql({trolley_wire: 'forward'}, 'trolley_wireB');
        });

        it('drops "s" from forwards/backwards when reversing', function () {
            var graph = iD.coreGraph([
                iD.osmWay({id: 'conveyingF', tags: {conveying: 'forwards'}}),
                iD.osmWay({id: 'conveyingB', tags: {conveying: 'backwards'}})
            ]);

            expect(iD.actionReverse('conveyingF')(graph)
                .entity('conveyingF').tags).to.eql({conveying: 'backward'}, 'conveyingF');
            expect(iD.actionReverse('conveyingB')(graph)
                .entity('conveyingB').tags).to.eql({conveying: 'forward'}, 'conveyingB');
        });

        it('skips *=forward ⟺ *=backward for ignored tags', function () {
            var graph = iD.coreGraph([
                iD.osmWay({id: 'name', tags: {name: 'forward'}}),
                iD.osmWay({id: 'note', tags: {note: 'forwards'}}),
                iD.osmWay({id: 'ref', tags: {ref: 'backward'}}),
                iD.osmWay({id: 'description', tags: {description: 'backwards'}})
            ]);

            expect(iD.actionReverse('name')(graph)
                .entity('name').tags).to.eql({name: 'forward'}, 'name');
            expect(iD.actionReverse('note')(graph)
                .entity('note').tags).to.eql({note: 'forwards'}, 'note');
            expect(iD.actionReverse('ref')(graph)
                .entity('ref').tags).to.eql({ref: 'backward'}, 'ref');
            expect(iD.actionReverse('description')(graph)
                .entity('description').tags).to.eql({description: 'backwards'}, 'description');
        });

        it('transforms *=right ⟺ *=left', function () {
            var graph = iD.coreGraph([
                iD.osmWay({id: 'sidewalkR', tags: {sidewalk: 'right'}}),
                iD.osmWay({id: 'sidewalkL', tags: {sidewalk: 'left'}})
            ]);

            expect(iD.actionReverse('sidewalkR')(graph)
                .entity('sidewalkR').tags).to.eql({sidewalk: 'left'}, 'sidewalkR');
            expect(iD.actionReverse('sidewalkL')(graph)
                .entity('sidewalkL').tags).to.eql({sidewalk: 'right'}, 'sidewalkL');
        });

        it('skips *=right ⟺ *=left for ignored tags', function () {
            var graph = iD.coreGraph([
                iD.osmWay({id: 'name', tags: {name: 'right'}}),
                iD.osmWay({id: 'note', tags: {note: 'right'}}),
                iD.osmWay({id: 'ref', tags: {ref: 'left'}}),
                iD.osmWay({id: 'description', tags: {description: 'left'}})
            ]);

            expect(iD.actionReverse('name')(graph)
                .entity('name').tags).to.eql({name: 'right'}, 'name');
            expect(iD.actionReverse('note')(graph)
                .entity('note').tags).to.eql({note: 'right'}, 'note');
            expect(iD.actionReverse('ref')(graph)
                .entity('ref').tags).to.eql({ref: 'left'}, 'ref');
            expect(iD.actionReverse('description')(graph)
                .entity('description').tags).to.eql({description: 'left'}, 'description');
        });
    });


    describe('reverses relation roles', function () {
        it('transforms role=forward ⟺ role=backward in member relations', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'n1'}),
                iD.osmNode({id: 'n2'}),
                iD.osmWay({id: 'w1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}}),
                iD.osmRelation({id: 'forward', members: [{type: 'way', id: 'w1', role: 'forward'}]}),
                iD.osmRelation({id: 'backward', members: [{type: 'way', id: 'w1', role: 'backward'}]})
            ]);

            expect(iD.actionReverse('w1')(graph)
                .entity('forward').members[0].role).to.eql('backward', 'forward');
            expect(iD.actionReverse('w1')(graph)
                .entity('backward').members[0].role).to.eql('forward', 'backward');
        });

        it('drops "s" from forwards/backwards when reversing', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'n1'}),
                iD.osmNode({id: 'n2'}),
                iD.osmWay({id: 'w1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}}),
                iD.osmRelation({id: 'forwards', members: [{type: 'way', id: 'w1', role: 'forwards'}]}),
                iD.osmRelation({id: 'backwards', members: [{type: 'way', id: 'w1', role: 'backwards'}]})
            ]);

            expect(iD.actionReverse('w1')(graph)
                .entity('forwards').members[0].role).to.eql('backward', 'forwards');
            expect(iD.actionReverse('w1')(graph)
                .entity('backwards').members[0].role).to.eql('forward', 'backwards');
        });

        it('doesn\'t transform role=north ⟺ role=south in member relations', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'n1'}),
                iD.osmNode({id: 'n2'}),
                iD.osmWay({id: 'w1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}}),
                iD.osmRelation({id: 'north', members: [{type: 'way', id: 'w1', role: 'north'}]}),
                iD.osmRelation({id: 'south', members: [{type: 'way', id: 'w1', role: 'south'}]})
            ]);

            expect(iD.actionReverse('w1')(graph)
                .entity('north').members[0].role).to.eql('north', 'north');
            expect(iD.actionReverse('w1')(graph)
                .entity('south').members[0].role).to.eql('south', 'south');
        });

        it('doesn\'t transform role=east ⟺ role=west in member relations', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'n1'}),
                iD.osmNode({id: 'n2'}),
                iD.osmWay({id: 'w1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}}),
                iD.osmRelation({id: 'east', members: [{type: 'way', id: 'w1', role: 'east'}]}),
                iD.osmRelation({id: 'west', members: [{type: 'way', id: 'w1', role: 'west'}]})
            ]);

            expect(iD.actionReverse('w1')(graph)
                .entity('east').members[0].role).to.eql('east', 'east');
            expect(iD.actionReverse('w1')(graph)
                .entity('west').members[0].role).to.eql('west', 'west');
        });

        it('ignores directionless roles in member relations', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'n1'}),
                iD.osmNode({id: 'n2'}),
                iD.osmWay({id: 'w1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}}),
                iD.osmRelation({id: 'ignore', members: [{type: 'way', id: 'w1', role: 'ignore'}]}),
                iD.osmRelation({id: 'empty', members: [{type: 'way', id: 'w1', role: ''}]})
            ]);

            expect(iD.actionReverse('w1')(graph)
                .entity('ignore').members[0].role).to.eql('ignore', 'ignore');
            expect(iD.actionReverse('w1')(graph)
                .entity('empty').members[0].role).to.eql('', 'empty');
        });
    });


    describe('reverses directional values on childnodes', function () {
        // For issue #3076
        it('reverses the direction of a forward facing stop sign on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: {'direction': 'forward', 'highway': 'stop'}});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).to.eql('backward');
        });

        it('reverses the direction of a backward facing stop sign on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: {'direction': 'backward', 'highway': 'stop'}});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).to.eql('forward');
        });

       it('reverses the direction of a left facing stop sign on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: {'direction': 'left', 'highway': 'stop'}});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).to.eql('right');
        });

        it('reverses the direction of a right facing stop sign on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: {'direction': 'right', 'highway': 'stop'}});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).to.eql('left');
        });

        it('does not assign a direction to a directionless stop sign on the way during a reverse', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: {'highway': 'stop'}});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).to.be.undefined;
        });

        it('ignores directions other than forward or backward on attached stop sign during a reverse', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: {'direction': 'empty', 'highway': 'stop'}});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).to.eql('empty');
        });
    });


    describe('reverses directional keys on childnodes', function () {
        it('reverses the direction of a forward facing traffic sign on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: {'traffic_sign:forward': 'stop'}});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_sign:backward']).to.eql('stop');
        });

        it('reverses the direction of a backward facing stop sign on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: {'traffic_sign:backward': 'stop'}});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_sign:forward']).to.eql('stop');
        });

        it('reverses the direction of a left facing traffic sign on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: {'traffic_sign:left': 'stop'}});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_sign:right']).to.eql('stop');
        });

        it('reverses the direction of a right facing stop sign on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: {'traffic_sign:right': 'stop'}});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_sign:left']).to.eql('stop');
        });

        // For issue #4595
        it('reverses the direction of a forward facing traffic_signals on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: { 'traffic_signals:direction': 'forward', 'highway': 'traffic_signals' }});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).to.eql('backward');
        });

        it('reverses the direction of a backward facing traffic_signals on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: { 'traffic_signals:direction': 'backward', 'highway': 'traffic_signals' }});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).to.eql('forward');
        });

       it('reverses the direction of a left facing traffic_signals on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: { 'traffic_signals:direction': 'left', 'highway': 'traffic_signals' }});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).to.eql('right');
        });

        it('reverses the direction of a right facing traffic_signals on the way', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: { 'traffic_signals:direction': 'right', 'highway': 'traffic_signals' }});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).to.eql('left');
        });

        it('does not assign a direction to a directionless traffic_signals on the way during a reverse', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: { 'highway': 'traffic_signals' }});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).to.be.undefined;
        });

        it('ignores directions other than forward or backward on attached traffic_signals during a reverse', function () {
            var node1 = iD.osmNode();
            var node2 = iD.osmNode({tags: { 'traffic_signals:direction': 'empty', 'highway': 'traffic_signals' }});
            var node3 = iD.osmNode();
            var way = iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).to.eql('empty');
        });
    });

});
