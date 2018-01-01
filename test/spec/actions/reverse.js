describe('iD.actionReverse', function () {
    it('reverses the order of nodes in the way', function () {
        var node1 = iD.Node(),
            node2 = iD.Node(),
            way = iD.Way({nodes: [node1.id, node2.id]}),
            graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, way]));
        expect(graph.entity(way.id).nodes).to.eql([node2.id, node1.id]);
    });

    it('preserves non-directional tags', function () {
        var way = iD.Way({tags: {'highway': 'residential'}}),
            graph = iD.Graph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'highway': 'residential'});
    });

    it('preserves oneway tags', function () {
        var way = iD.Way({tags: {'oneway': 'yes'}}),
            graph = iD.Graph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'oneway': 'yes'});
    });

    it('reverses oneway tags if reverseOneway: true is provided', function () {
        var graph = iD.Graph([
                iD.Way({id: 'yes', tags: {oneway: 'yes'}}),
                iD.Way({id: 'no', tags: {oneway: 'no'}}),
                iD.Way({id: '1', tags: {oneway: '1'}}),
                iD.Way({id: '-1', tags: {oneway: '-1'}})
            ]);

        expect(iD.actionReverse('yes', {reverseOneway: true})(graph)
            .entity('yes').tags).to.eql({oneway: '-1'});
        expect(iD.actionReverse('no', {reverseOneway: true})(graph)
            .entity('no').tags).to.eql({oneway: 'no'});
        expect(iD.actionReverse('1', {reverseOneway: true})(graph)
            .entity('1').tags).to.eql({oneway: '-1'});
        expect(iD.actionReverse('-1', {reverseOneway: true})(graph)
            .entity('-1').tags).to.eql({oneway: 'yes'});
    });

    it('transforms *:right=* ⟺ *:left=*', function () {
        var way = iD.Way({tags: {'cycleway:right': 'lane'}}),
            graph = iD.Graph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'cycleway:left': 'lane'});

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'cycleway:right': 'lane'});
    });

    it('transforms *:forward=* ⟺ *:backward=*', function () {
        var way = iD.Way({tags: {'maxspeed:forward': '25'}}),
            graph = iD.Graph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'maxspeed:backward': '25'});

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'maxspeed:forward': '25'});
    });

    it('transforms direction=up ⟺ direction=down', function () {
        var way = iD.Way({tags: {'incline': 'up'}}),
            graph = iD.Graph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': 'down'});

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': 'up'});
    });

    it('transforms incline=up ⟺ incline=down', function () {
        var way = iD.Way({tags: {'incline': 'up'}}),
            graph = iD.Graph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': 'down'});

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': 'up'});
    });

    it('negates numeric-valued incline tags', function () {
        var way = iD.Way({tags: {'incline': '5%'}}),
            graph = iD.Graph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': '-5%'});

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': '5%'});

        way = iD.Way({tags: {'incline': '.8°'}});
        graph = iD.Graph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': '-.8°'});
    });

    it('transforms *=right ⟺ *=left', function () {
        var way = iD.Way({tags: {'sidewalk': 'right'}}),
            graph = iD.Graph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'sidewalk': 'left'});

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'sidewalk': 'right'});
    });

    it('transforms multiple directional tags', function () {
        var way = iD.Way({tags: {'maxspeed:forward': '25', 'maxspeed:backward': '30'}}),
            graph = iD.Graph([way]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'maxspeed:backward': '25', 'maxspeed:forward': '30'});
    });

    it('transforms role=forward ⟺ role=backward in member relations', function () {
        var way = iD.Way({tags: {highway: 'residential'}}),
            relation = iD.Relation({members: [{type: 'way', id: way.id, role: 'forward'}]}),
            graph = iD.Graph([way, relation]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('backward');

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('forward');
    });

    it('transforms role=north ⟺ role=south in member relations', function () {
        var way = iD.Way({tags: {highway: 'residential'}}),
            relation = iD.Relation({members: [{type: 'way', id: way.id, role: 'north'}]}),
            graph = iD.Graph([way, relation]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('south');

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('north');
    });

    it('transforms role=east ⟺ role=west in member relations', function () {
        var way = iD.Way({tags: {highway: 'residential'}}),
            relation = iD.Relation({members: [{type: 'way', id: way.id, role: 'east'}]}),
            graph = iD.Graph([way, relation]);

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('west');

        graph = iD.actionReverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('east');
    });

    // For issue #3076
    it('reverses the direction of a forward facing stop sign on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node();
        var node3 = iD.Node();
        // Attach a forward facing stop sign to node 2
        node2.tags = { 'direction': 'forward', 'highway': 'stop' };
        // Create our way
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        // Act - reverse the way
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        // Assert - confirm that the stop sign on node 2 has changed direction
        var target = graph.entity(node2.id);
        expect(target.tags.direction).to.eql('backward');
    });

    it('reverses the direction of a backward facing stop sign on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node();
        var node3 = iD.Node();
        // Attach a backward facing stop sign to node 2
        node2.tags = { 'direction': 'backward', 'highway': 'stop' };
        // Create our way
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        // Act - reverse the way
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        // Assert - confirm that the stop sign on node 2 has changed direction
        var target = graph.entity(node2.id);
        expect(target.tags.direction).to.eql('forward');
    });

   it('reverses the direction of a left facing stop sign on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node();
        var node3 = iD.Node();
        // Attach a left facing stop sign to node 2 (not sure this is a real situation,
        // but allows us to test)
        node2.tags = { 'direction': 'left', 'highway': 'stop' };
        // Create our way
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        // Act - reverse the way
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        // Assert - confirm that the stop sign on node 2 has changed direction
        var target = graph.entity(node2.id);
        expect(target.tags.direction).to.eql('right');
    });

    it('reverses the direction of a right facing stop sign on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node();
        var node3 = iD.Node();
        // Attach a right facing stop sign to node 2 (not sure this is a real situation,
        // but allows us to test)
        node2.tags = { 'direction': 'right', 'highway': 'stop' };
        // Create our way
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        // Act - reverse the way
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        // Assert - confirm that the stop sign on node 2 has changed direction
        var target = graph.entity(node2.id);
        expect(target.tags.direction).to.eql('left');
    });

    it('does not assign a direction to a directionless stop sign on the way during a reverse', function () {
        var node1 = iD.Node();
        var node2 = iD.Node();
        var node3 = iD.Node();
        // Attach a stop sign to node 2 with no direction specified
        node2.tags = { 'highway': 'stop' };
        // Create our way
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        // Act - reverse the way
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        // Assert - confirm that the stop sign on node 2 has not gained a direction tag
        var target = graph.entity(node2.id);
        expect(target.tags.direction).to.be.undefined;
    });

    it('ignores directions other than forward or backward on attached stop sign during a reverse', function () {
        var node1 = iD.Node();
        var node2 = iD.Node();
        var node3 = iD.Node();
        // Attach a stop sign to node 2 with a non-standard direction
        node2.tags = { 'direction': 'empty', 'highway': 'stop' };
        // Create our way
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        // Act - reverse the way
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        // Assert - confirm that the stop sign on node 2 has not had its direction tag altered
        var target = graph.entity(node2.id);
        expect(target.tags.direction).to.eql('empty');
    });

    it('reverses the direction of a forward facing traffic sign on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node();
        var node3 = iD.Node();
        // Attach a forward facing stop sign to node 2 using the traffic_sign approach
        node2.tags = { 'traffic_sign:forward': 'stop' };
        // Create our way
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        // Act - reverse the way
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        // Assert - confirm that the stop sign on node 2 has changed direction
        var target = graph.entity(node2.id);
        expect(target.tags['traffic_sign:backward']).to.eql('stop');
    });

    it('reverses the direction of a backward facing stop sign on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node();
        var node3 = iD.Node();
       // Attach a backward facing stop sign to node 2 using the traffic_sign approach
        node2.tags = { 'traffic_sign:backward': 'stop' };
        // Create our way
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        // Act - reverse the way
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        // Assert - confirm that the stop sign on node 2 has changed direction
        var target = graph.entity(node2.id);
        expect(target.tags['traffic_sign:forward']).to.eql('stop');
    });

    it('reverses the direction of a left facing traffic sign on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node();
        var node3 = iD.Node();
        // Attach a left facing stop sign to node 2 using the traffic_sign approach
        node2.tags = { 'traffic_sign:left': 'stop' };
        // Create our way
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        // Act - reverse the way
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        // Assert - confirm that the stop sign on node 2 has changed direction
        var target = graph.entity(node2.id);
        expect(target.tags['traffic_sign:right']).to.eql('stop');
    });

    it('reverses the direction of a right facing stop sign on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node();
        var node3 = iD.Node();
        // Attach a right facing stop sign to node 2 using the traffic_sign approach
        node2.tags = { 'traffic_sign:right': 'stop' };
        // Create our way
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        // Act - reverse the way
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        // Assert - confirm that the stop sign on node 2 has changed direction
        var target = graph.entity(node2.id);
        expect(target.tags['traffic_sign:left']).to.eql('stop');
    });

    // For issue #4595
    it('reverses the direction of a forward facing traffic_signals on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node({tags: { 'traffic_signals:direction': 'forward', 'highway': 'traffic_signals' }});
        var node3 = iD.Node();
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        var target = graph.entity(node2.id);
        expect(target.tags['traffic_signals:direction']).to.eql('backward');
    });

    it('reverses the direction of a backward facing traffic_signals on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node({tags: { 'traffic_signals:direction': 'backward', 'highway': 'traffic_signals' }});
        var node3 = iD.Node();
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        var target = graph.entity(node2.id);
        expect(target.tags['traffic_signals:direction']).to.eql('forward');
    });

   it('reverses the direction of a left facing traffic_signals on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node({tags: { 'traffic_signals:direction': 'left', 'highway': 'traffic_signals' }});
        var node3 = iD.Node();
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        var target = graph.entity(node2.id);
        expect(target.tags['traffic_signals:direction']).to.eql('right');
    });

    it('reverses the direction of a right facing traffic_signals on the way', function () {
        var node1 = iD.Node();
        var node2 = iD.Node({tags: { 'traffic_signals:direction': 'right', 'highway': 'traffic_signals' }});
        var node3 = iD.Node();
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        var target = graph.entity(node2.id);
        expect(target.tags['traffic_signals:direction']).to.eql('left');
    });

    it('does not assign a direction to a directionless traffic_signals on the way during a reverse', function () {
        var node1 = iD.Node();
        var node2 = iD.Node({tags: { 'highway': 'traffic_signals' }});
        var node3 = iD.Node();
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        var target = graph.entity(node2.id);
        expect(target.tags['traffic_signals:direction']).to.be.undefined;
    });

    it('ignores directions other than forward or backward on attached traffic_signals during a reverse', function () {
        var node1 = iD.Node();
        var node2 = iD.Node({tags: { 'traffic_signals:direction': 'empty', 'highway': 'traffic_signals' }});
        var node3 = iD.Node();
        var way = iD.Way({nodes: [node1.id, node2.id, node3.id]});
        var graph = iD.actionReverse(way.id)(iD.Graph([node1, node2, node3, way]));
        var target = graph.entity(node2.id);
        expect(target.tags['traffic_signals:direction']).to.eql('empty');
    });


});
