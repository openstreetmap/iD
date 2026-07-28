describe('iD.actionReverse', function () {
    beforeEach(() => {
        iD.fileFetcher.cache().preset_fields = {
            direction: { key: 'direction', type: 'combo' },
            'prefixed:direction': { key: 'prefixed:direction', type: 'combo' }
        };
        iD.fileFetcher.cache().preset_presets = {
            'Give Way Sign': {
                 // this preset has direction as a normal field
                tags: { highway: 'give_way' },
                geometry: ['point', 'vertex'],
                fields: ['direction']
            },
            'Advance Stop Line': {
                // this preset has direction under moreFields
                tags: { cycleway: 'asl' },
                geometry: ['point', 'vertex'],
                moreFields: ['direction']
            },
            'Traffic Lights': {
                // this preset uses a prefixed direction tag
                tags: { highway: 'traffic_signals' },
                geometry: ['point', 'vertex'],
                moreFields: ['prefixed:direction']
            },
        };
    });

    it('reverses the order of nodes in the way', function () {
        var node1 = new iD.osmNode();
        var node2 = new iD.osmNode();
        var way = new iD.osmWay({nodes: [node1.id, node2.id]});
        var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, way]));
        expect(graph.entity(way.id).nodes).toEqual([node2.id, node1.id]);
    });

    it('preserves non-directional tags', function () {
        var way = new iD.osmWay({tags: {'highway': 'residential'}});
        var graph = new iD.coreGraph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).toEqual({'highway': 'residential'});
    });


    describe('reverses directional tags on nodes', function () {
        it('reverses relative directions', function () {
            var node1 = new iD.osmNode({ tags: { 'direction': 'forward' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'direction': 'backward' });
        });

        it('reverses relative directions for arbitrary direction tags', function () {
            var node1 = new iD.osmNode({ tags: { 'traffic_sign:direction': 'forward' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'traffic_sign:direction': 'backward' });
        });

        it('reverses absolute directions, cardinal compass points', function () {
            var node1 = new iD.osmNode({ tags: { 'direction': 'E' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'direction': 'W' });
        });

        it('reverses absolute directions, intercardinal compass points', function () {
            var node1 = new iD.osmNode({ tags: { 'direction': 'SE' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'direction': 'NW' });
        });

        it('reverses absolute directions, secondary intercardinal compass points', function () {
            var node1 = new iD.osmNode({ tags: { 'direction': 'NNE' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'direction': 'SSW' });
        });

        it('reverses absolute directions, 0 degrees', function () {
            var node1 = new iD.osmNode({ tags: { 'direction': '0' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'direction': '180' });
        });

        it('reverses absolute directions, positive degrees', function () {
            var node1 = new iD.osmNode({ tags: { 'direction': '85.5' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'direction': '265.5' });
        });

        it('reverses absolute directions, positive degrees > 360', function () {
            var node1 = new iD.osmNode({ tags: { 'direction': '385.5' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'direction': '205.5' });
        });

        it('reverses absolute directions, negative degrees', function () {
            var node1 = new iD.osmNode({ tags: { 'direction': '-85.5' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'direction': '94.5' });
        });

        it('reverses directions with multiple semicolon separated values', function () {
            var node1 = new iD.osmNode({ tags: { 'direction': 'N;90' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'direction': 'S;270' });
        });

        it('reverses directions with multiple semicolon separated values, preserves non-directional part', function () {
            var node1 = new iD.osmNode({ tags: { 'direction': '0;error' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'direction': '180;error' });
        });

        it('preserves non-directional tags', function () {
            var node1 = new iD.osmNode({ tags: { 'traffic_sign': 'maxspeed' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'traffic_sign': 'maxspeed' });
        });

        it('preserves non-reversible direction tags', function () {
            var node1 = new iD.osmNode({ tags: { 'direction': 'both' } });
            var graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
            expect(graph.entity(node1.id).tags).toEqual({ 'direction': 'both' });
        });

        describe('directionless nodes', () => {
            it('adds a direction tag to directionless nodes if the preset has a direction field', async () => {
                await iD.presetManager.ensureLoaded(true);
                const node1 = new iD.osmNode({ tags: { highway: 'give_way' } });
                const graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
                expect(graph.entity(node1.id).tags).toEqual({ highway: 'give_way', direction: 'forward' });
            });

            it('adds a direction tag to directionless nodes if the preset has a direction field under moreFields', async () => {
                await iD.presetManager.ensureLoaded(true);
                const node1 = new iD.osmNode({ tags: { cycleway: 'asl' } });
                const graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
                expect(graph.entity(node1.id).tags).toEqual({ cycleway: 'asl', direction: 'forward' });
            });

            it('does not add a direction tag to directionless nodes if the preset has no direction field', async () => {
                await iD.presetManager.ensureLoaded(true);
                const node1 = new iD.osmNode({ tags: { amenity: 'ferry_terminal' } });
                const graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
                expect(graph.entity(node1.id).tags).toEqual({ amenity: 'ferry_terminal' });
            });

            it('adds a custom direction tag to directionless nodes if the preset has a custom direction field', async () => {
                await iD.presetManager.ensureLoaded(true);
                const node1 = new iD.osmNode({ tags: { highway: 'traffic_signals' } });
                const graph = iD.actionReverse(node1.id)(new iD.coreGraph([node1]));
                expect(graph.entity(node1.id).tags).toEqual({ highway: 'traffic_signals', 'prefixed:direction': 'forward' });
            });
        });
    });


    describe('reverses oneway', function () {
        it('preserves oneway tags', function () {
            var way = new iD.osmWay({tags: {'oneway': 'yes'}});
            var graph = new iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'oneway': 'yes'});
        });

        it('reverses oneway tags if reverseOneway: true is provided', function () {
            var graph = new iD.coreGraph([
                new iD.osmWay({id: 'yes', tags: {oneway: 'yes'}}),
                new iD.osmWay({id: 'no', tags: {oneway: 'no'}}),
                new iD.osmWay({id: '1', tags: {oneway: '1'}}),
                new iD.osmWay({id: '-1', tags: {oneway: '-1'}})
            ]);

            expect(iD.actionReverse('yes', {reverseOneway: true})(graph)
                .entity('yes').tags).toEqual({oneway: '-1'}, 'yes');
            expect(iD.actionReverse('no', {reverseOneway: true})(graph)
                .entity('no').tags).toEqual({oneway: 'no'}, 'no');
            expect(iD.actionReverse('1', {reverseOneway: true})(graph)
                .entity('1').tags).toEqual({oneway: '-1'}, '1');
            expect(iD.actionReverse('-1', {reverseOneway: true})(graph)
                .entity('-1').tags).toEqual({oneway: 'yes'}, '-1');
        });

        it('ignores other oneway tags', function () {
            var graph = new iD.coreGraph([
                new iD.osmWay({id: 'alternating', tags: {oneway: 'alternating'}}),
                new iD.osmWay({id: 'reversible', tags: {oneway: 'reversible'}}),
                new iD.osmWay({id: 'dummy', tags: {oneway: 'dummy'}})
            ]);

            expect(iD.actionReverse('alternating', {reverseOneway: true})(graph)
                .entity('alternating').tags).toEqual({oneway: 'alternating'}, 'alternating');
            expect(iD.actionReverse('reversible', {reverseOneway: true})(graph)
                .entity('reversible').tags).toEqual({oneway: 'reversible'}, 'reversible');
            expect(iD.actionReverse('dummy', {reverseOneway: true})(graph)
                .entity('dummy').tags).toEqual({oneway: 'dummy'}, 'dummy');
        });
    });


    describe('reverses incline', function () {
        it('transforms incline=up ⟺ incline=down', function () {
            var way = new iD.osmWay({tags: {'incline': 'up'}});
            var graph = new iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'incline': 'down'});

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'incline': 'up'});
        });

        it('negates numeric-valued incline tags', function () {
            var way = new iD.osmWay({tags: {'incline': '5%'}});
            var graph = new iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'incline': '-5%'});

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'incline': '5%'});

            way = new iD.osmWay({tags: {'incline': '.8°'}});
            graph = new iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'incline': '-.8°'});
        });
    });


    describe('reverses directional keys on ways', function () {
        it('transforms *:right=* ⟺ *:left=*', function () {
            var way = new iD.osmWay({tags: {'cycleway:right': 'lane'}});
            var graph = new iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'cycleway:left': 'lane'});

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'cycleway:right': 'lane'});
        });

        it('transforms *:right:*=* ⟺ *:left:*=*', function () {
            var way = new iD.osmWay({tags: {'cycleway:right:surface': 'paved'}});
            var graph = new iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'cycleway:left:surface': 'paved'});

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'cycleway:right:surface': 'paved'});
        });

        it('transforms *:forward=* ⟺ *:backward=*', function () {
            var way = new iD.osmWay({tags: {'maxspeed:forward': '25'}});
            var graph = new iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'maxspeed:backward': '25'});

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'maxspeed:forward': '25'});
        });

        it('transforms multiple directional tags', function () {
            var way = new iD.osmWay({tags: {'maxspeed:forward': '25', 'maxspeed:backward': '30'}});
            var graph = new iD.coreGraph([way]);

            graph = iD.actionReverse(way.id)(graph);
            expect(graph.entity(way.id).tags).toEqual({'maxspeed:backward': '25', 'maxspeed:forward': '30'});
        });
    });


    describe('reverses directional values on ways', function () {
        it('transforms *=up ⟺ *=down', function () {
            var graph = new iD.coreGraph([
                new iD.osmWay({id: 'inclineU', tags: {incline: 'up'}}),
                new iD.osmWay({id: 'directionU', tags: {direction: 'up'}}),
                new iD.osmWay({id: 'inclineD', tags: {incline: 'down'}}),
                new iD.osmWay({id: 'directionD', tags: {direction: 'down'}})
            ]);

            expect(iD.actionReverse('inclineU')(graph)
                .entity('inclineU').tags).toEqual({incline: 'down'}, 'inclineU');
            expect(iD.actionReverse('directionU')(graph)
                .entity('directionU').tags).toEqual({direction: 'down'}, 'directionU');

            expect(iD.actionReverse('inclineD')(graph)
                .entity('inclineD').tags).toEqual({incline: 'up'}, 'inclineD');
            expect(iD.actionReverse('directionD')(graph)
                .entity('directionD').tags).toEqual({direction: 'up'}, 'directionD');
        });

        it('skips *=up ⟺ *=down for ignored tags', function () {
            var graph = new iD.coreGraph([
                new iD.osmWay({id: 'name', tags: {name: 'up'}}),
                new iD.osmWay({id: 'note', tags: {note: 'up'}}),
                new iD.osmWay({id: 'ref', tags: {ref: 'down'}}),
                new iD.osmWay({id: 'description', tags: {description: 'down'}})
            ]);

            expect(iD.actionReverse('name')(graph)
                .entity('name').tags).toEqual({name: 'up'}, 'name');
            expect(iD.actionReverse('note')(graph)
                .entity('note').tags).toEqual({note: 'up'}, 'note');
            expect(iD.actionReverse('ref')(graph)
                .entity('ref').tags).toEqual({ref: 'down'}, 'ref');
            expect(iD.actionReverse('description')(graph)
                .entity('description').tags).toEqual({description: 'down'}, 'description');
        });

        it('transforms *=forward ⟺ *=backward', function () {
            var graph = new iD.coreGraph([
                new iD.osmWay({id: 'conveyingF', tags: {conveying: 'forward'}}),
                new iD.osmWay({id: 'directionF', tags: {direction: 'forward'}}),
                new iD.osmWay({id: 'priorityF', tags: {priority: 'forward'}}),
                new iD.osmWay({id: 'trolley_wireF', tags: {trolley_wire: 'forward'}}),
                new iD.osmWay({id: 'conveyingB', tags: {conveying: 'backward'}}),
                new iD.osmWay({id: 'directionB', tags: {direction: 'backward'}}),
                new iD.osmWay({id: 'priorityB', tags: {priority: 'backward'}}),
                new iD.osmWay({id: 'trolley_wireB', tags: {trolley_wire: 'backward'}})
            ]);

            expect(iD.actionReverse('conveyingF')(graph)
                .entity('conveyingF').tags).toEqual({conveying: 'backward'}, 'conveyingF');
            expect(iD.actionReverse('directionF')(graph)
                .entity('directionF').tags).toEqual({direction: 'backward'}, 'directionF');
            expect(iD.actionReverse('priorityF')(graph)
                .entity('priorityF').tags).toEqual({priority: 'backward'}, 'priorityF');
            expect(iD.actionReverse('trolley_wireF')(graph)
                .entity('trolley_wireF').tags).toEqual({trolley_wire: 'backward'}, 'trolley_wireF');

            expect(iD.actionReverse('conveyingB')(graph)
                .entity('conveyingB').tags).toEqual({conveying: 'forward'}, 'conveyingB');
            expect(iD.actionReverse('directionB')(graph)
                .entity('directionB').tags).toEqual({direction: 'forward'}, 'directionB');
            expect(iD.actionReverse('priorityB')(graph)
                .entity('priorityB').tags).toEqual({priority: 'forward'}, 'priorityB');
            expect(iD.actionReverse('trolley_wireB')(graph)
                .entity('trolley_wireB').tags).toEqual({trolley_wire: 'forward'}, 'trolley_wireB');
        });

        it('drops "s" from forwards/backwards when reversing', function () {
            var graph = new iD.coreGraph([
                new iD.osmWay({id: 'conveyingF', tags: {conveying: 'forwards'}}),
                new iD.osmWay({id: 'conveyingB', tags: {conveying: 'backwards'}})
            ]);

            expect(iD.actionReverse('conveyingF')(graph)
                .entity('conveyingF').tags).toEqual({conveying: 'backward'}, 'conveyingF');
            expect(iD.actionReverse('conveyingB')(graph)
                .entity('conveyingB').tags).toEqual({conveying: 'forward'}, 'conveyingB');
        });

        it('skips *=forward ⟺ *=backward for ignored tags', function () {
            var graph = new iD.coreGraph([
                new iD.osmWay({id: 'name', tags: {name: 'forward'}}),
                new iD.osmWay({id: 'note', tags: {note: 'forwards'}}),
                new iD.osmWay({id: 'ref', tags: {ref: 'backward'}}),
                new iD.osmWay({id: 'description', tags: {description: 'backwards'}})
            ]);

            expect(iD.actionReverse('name')(graph)
                .entity('name').tags).toEqual({name: 'forward'}, 'name');
            expect(iD.actionReverse('note')(graph)
                .entity('note').tags).toEqual({note: 'forwards'}, 'note');
            expect(iD.actionReverse('ref')(graph)
                .entity('ref').tags).toEqual({ref: 'backward'}, 'ref');
            expect(iD.actionReverse('description')(graph)
                .entity('description').tags).toEqual({description: 'backwards'}, 'description');
        });

        it('transforms *=right ⟺ *=left', function () {
            var graph = new iD.coreGraph([
                new iD.osmWay({id: 'sidewalkR', tags: {sidewalk: 'right'}}),
                new iD.osmWay({id: 'sidewalkL', tags: {sidewalk: 'left'}})
            ]);

            expect(iD.actionReverse('sidewalkR')(graph)
                .entity('sidewalkR').tags).toEqual({sidewalk: 'left'}, 'sidewalkR');
            expect(iD.actionReverse('sidewalkL')(graph)
                .entity('sidewalkL').tags).toEqual({sidewalk: 'right'}, 'sidewalkL');
        });

        it('skips *=right ⟺ *=left for ignored tags', function () {
            var graph = new iD.coreGraph([
                new iD.osmWay({id: 'name', tags: {name: 'right'}}),
                new iD.osmWay({id: 'note', tags: {note: 'right'}}),
                new iD.osmWay({id: 'ref', tags: {ref: 'left'}}),
                new iD.osmWay({id: 'description', tags: {description: 'left'}})
            ]);

            expect(iD.actionReverse('name')(graph)
                .entity('name').tags).toEqual({name: 'right'}, 'name');
            expect(iD.actionReverse('note')(graph)
                .entity('note').tags).toEqual({note: 'right'}, 'note');
            expect(iD.actionReverse('ref')(graph)
                .entity('ref').tags).toEqual({ref: 'left'}, 'ref');
            expect(iD.actionReverse('description')(graph)
                .entity('description').tags).toEqual({description: 'left'}, 'description');
        });
    });


    describe('reverses relation roles', function () {
        it('transforms role=forward ⟺ role=backward in member relations', function () {
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'n1'}),
                new iD.osmNode({id: 'n2'}),
                new iD.osmWay({id: 'w1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}}),
                new iD.osmRelation({id: 'forward', members: [{type: 'way', id: 'w1', role: 'forward'}]}),
                new iD.osmRelation({id: 'backward', members: [{type: 'way', id: 'w1', role: 'backward'}]})
            ]);

            expect(iD.actionReverse('w1')(graph)
                .entity('forward').members[0].role).toEqual('backward', 'forward');
            expect(iD.actionReverse('w1')(graph)
                .entity('backward').members[0].role).toEqual('forward', 'backward');
        });

        it('drops "s" from forwards/backwards when reversing', function () {
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'n1'}),
                new iD.osmNode({id: 'n2'}),
                new iD.osmWay({id: 'w1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}}),
                new iD.osmRelation({id: 'forwards', members: [{type: 'way', id: 'w1', role: 'forwards'}]}),
                new iD.osmRelation({id: 'backwards', members: [{type: 'way', id: 'w1', role: 'backwards'}]})
            ]);

            expect(iD.actionReverse('w1')(graph)
                .entity('forwards').members[0].role).toEqual('backward', 'forwards');
            expect(iD.actionReverse('w1')(graph)
                .entity('backwards').members[0].role).toEqual('forward', 'backwards');
        });

        it('doesn\'t transform role=north ⟺ role=south in member relations', function () {
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'n1'}),
                new iD.osmNode({id: 'n2'}),
                new iD.osmWay({id: 'w1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}}),
                new iD.osmRelation({id: 'north', members: [{type: 'way', id: 'w1', role: 'north'}]}),
                new iD.osmRelation({id: 'south', members: [{type: 'way', id: 'w1', role: 'south'}]})
            ]);

            expect(iD.actionReverse('w1')(graph)
                .entity('north').members[0].role).toEqual('north', 'north');
            expect(iD.actionReverse('w1')(graph)
                .entity('south').members[0].role).toEqual('south', 'south');
        });

        it('doesn\'t transform role=east ⟺ role=west in member relations', function () {
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'n1'}),
                new iD.osmNode({id: 'n2'}),
                new iD.osmWay({id: 'w1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}}),
                new iD.osmRelation({id: 'east', members: [{type: 'way', id: 'w1', role: 'east'}]}),
                new iD.osmRelation({id: 'west', members: [{type: 'way', id: 'w1', role: 'west'}]})
            ]);

            expect(iD.actionReverse('w1')(graph)
                .entity('east').members[0].role).toEqual('east', 'east');
            expect(iD.actionReverse('w1')(graph)
                .entity('west').members[0].role).toEqual('west', 'west');
        });

        it('ignores directionless roles in member relations', function () {
            var graph = new iD.coreGraph([
                new iD.osmNode({id: 'n1'}),
                new iD.osmNode({id: 'n2'}),
                new iD.osmWay({id: 'w1', nodes: ['n1', 'n2'], tags: {highway: 'residential'}}),
                new iD.osmRelation({id: 'ignore', members: [{type: 'way', id: 'w1', role: 'ignore'}]}),
                new iD.osmRelation({id: 'empty', members: [{type: 'way', id: 'w1', role: ''}]})
            ]);

            expect(iD.actionReverse('w1')(graph)
                .entity('ignore').members[0].role).toEqual('ignore', 'ignore');
            expect(iD.actionReverse('w1')(graph)
                .entity('empty').members[0].role).toEqual('', 'empty');
        });
    });


    describe('reverses directional values on childnodes', function () {
        // For issue #3076
        it('reverses the direction of a forward facing stop sign on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {'direction': 'forward', 'highway': 'stop'}});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).toEqual('backward');
        });

        it('reverses the direction of a backward facing stop sign on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {'direction': 'backward', 'highway': 'stop'}});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).toEqual('forward');
        });

       it('reverses the direction of a left facing stop sign on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {'direction': 'left', 'highway': 'stop'}});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).toEqual('right');
        });

        it('reverses the direction of a right facing stop sign on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {'direction': 'right', 'highway': 'stop'}});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).toEqual('left');
        });

        it('does not assign a direction to a directionless stop sign on the way during a reverse', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {'highway': 'stop'}});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).toBeUndefined();
        });

        it('ignores directions other than forward or backward on attached stop sign during a reverse', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {'direction': 'empty', 'highway': 'stop'}});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).toEqual('empty');
        });
    });


    describe('reverses directional keys on childnodes', function () {
        it('reverses the direction of a forward facing traffic sign on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {'traffic_sign:forward': 'stop'}});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_sign:backward']).toEqual('stop');
        });

        it('reverses the direction of a backward facing stop sign on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {'traffic_sign:backward': 'stop'}});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_sign:forward']).toEqual('stop');
        });

        it('reverses the direction of a left facing traffic sign on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {'traffic_sign:left': 'stop'}});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_sign:right']).toEqual('stop');
        });

        it('reverses the direction of a right facing stop sign on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {'traffic_sign:right': 'stop'}});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_sign:left']).toEqual('stop');
        });

        // For issue #4595
        it('reverses the direction of a forward facing traffic_signals on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: { 'traffic_signals:direction': 'forward', 'highway': 'traffic_signals' }});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).toEqual('backward');
        });

        it('reverses the direction of a backward facing traffic_signals on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: { 'traffic_signals:direction': 'backward', 'highway': 'traffic_signals' }});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).toEqual('forward');
        });

       it('reverses the direction of a left facing traffic_signals on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: { 'traffic_signals:direction': 'left', 'highway': 'traffic_signals' }});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).toEqual('right');
        });

        it('reverses the direction of a right facing traffic_signals on the way', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: { 'traffic_signals:direction': 'right', 'highway': 'traffic_signals' }});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).toEqual('left');
        });

        it('does not assign a direction to a directionless traffic_signals on the way during a reverse', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: { 'highway': 'traffic_signals' }});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).toBeUndefined();
        });

        it('ignores directions other than forward or backward on attached traffic_signals during a reverse', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: { 'traffic_signals:direction': 'empty', 'highway': 'traffic_signals' }});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).toEqual('empty');
        });
    });


    describe('does not reverse values which are relative to another reversed tag', function () {
        it('preserves the turn direction of a single lane road', function () {
            var way = new iD.osmWay({tags: {'turn:lanes': 'right'}});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([way]));
            var target = graph.entity(way.id);
            expect(target.tags['turn:lanes']).toEqual('right');
        });

        it('preserves the turn directions of a multi-lane road', function () {
            var way = new iD.osmWay({tags: {'turn:lanes': 'through|through|right'}});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([way]));
            var target = graph.entity(way.id);
            expect(target.tags['turn:lanes']).toEqual('through|through|right');
        });

        // https://github.com/openstreetmap/iD/issues/5674
        it('preserves the turn direction of each direction with a single lane', function () {
            var way = new iD.osmWay({tags: {'turn:lanes:forward': 'right', 'turn:lanes:backward': 'left'}});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([way]));
            var target = graph.entity(way.id);
            expect(target.tags['turn:lanes:backward']).toEqual('right');
            expect(target.tags['turn:lanes:forward']).toEqual('left');
        });

        it('preserves the turn direction of each direction with multiple lanes', function () {
            var way = new iD.osmWay({tags: {'turn:lanes:forward': 'through|right', 'turn:lanes:backward': 'through|through|left'}});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([way]));
            var target = graph.entity(way.id);
            expect(target.tags['turn:lanes:backward']).toEqual('through|right');
            expect(target.tags['turn:lanes:forward']).toEqual('through|through|left');
        });

        it('preserves the turn direction of explicitly bidirectional turn lane values', function () {
            var way = new iD.osmWay({tags: {'turn:lanes:both_ways': 'left'}});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([way]));
            var target = graph.entity(way.id);
            expect(target.tags['turn:lanes:both_ways']).toEqual('left');
        });

        it('preserves the value of the side tag of a cycling waiting aid', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {
                'highway': 'cyclist_waiting_aid',
                'direction': 'forward',
                'side': 'right'
            }});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags.direction).toEqual('backward');
            expect(target.tags.side).toEqual('right');
        });

        it('preserves the value of railway:turnout_side', () => {
            const node1 = new iD.osmNode();
            const node2 = new iD.osmNode({ tags: { direction: 'forward', 'railway:turnout_side': 'right' } });
            const node3 = new iD.osmNode();
            const way = new iD.osmWay({ nodes: [node1.id, node2.id, node3.id] });
            const graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            const target = graph.entity(node2.id);
            expect(target.tags.direction).toBe('backward');
            expect(target.tags['railway:turnout_side']).toBe('right');
        });

        it('preserves the direction of a red turn at a traffic signal', function () {
            var node1 = new iD.osmNode();
            var node2 = new iD.osmNode({tags: {
                'highway': 'traffic_signals',
                'traffic_signals:direction': 'forward',
                'red_turn:right': 'no',
                'red_turn:right:bicycle': 'yes'
            }});
            var node3 = new iD.osmNode();
            var way = new iD.osmWay({nodes: [node1.id, node2.id, node3.id]});
            var graph = iD.actionReverse(way.id)(new iD.coreGraph([node1, node2, node3, way]));
            var target = graph.entity(node2.id);
            expect(target.tags['traffic_signals:direction']).toEqual('backward');
            expect(target.tags['red_turn:right']).toEqual('no');
            expect(target.tags['red_turn:right:bicycle']).toEqual('yes');
        });
    });
});
