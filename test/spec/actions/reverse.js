describe("iD.actions.Reverse", function () {
    it("reverses the order of nodes in the way", function () {
        var node1 = iD.Node(),
            node2 = iD.Node(),
            way = iD.Way({nodes: [node1.id, node2.id]}),
            graph = iD.actions.Reverse(way.id)(iD.Graph([node1, node2, way]));
        expect(graph.entity(way.id).nodes).to.eql([node2.id, node1.id]);
    });

    it("preserves non-directional tags", function () {
        var way = iD.Way({tags: {'highway': 'residential'}}),
            graph = iD.Graph([way]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'highway': 'residential'});
    });

    it("preserves oneway tags", function () {
        var way = iD.Way({tags: {'oneway': 'yes'}}),
            graph = iD.Graph([way]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'oneway': 'yes'});
    });

    it("reverses oneway tags if reverseOneway: true is provided", function () {
        var graph = iD.Graph([
                iD.Way({id: 'yes', tags: {oneway: 'yes'}}),
                iD.Way({id: 'no', tags: {oneway: 'no'}}),
                iD.Way({id: '1', tags: {oneway: '1'}}),
                iD.Way({id: '-1', tags: {oneway: '-1'}})
            ]);

        expect(iD.actions.Reverse('yes', {reverseOneway: true})(graph)
            .entity('yes').tags).to.eql({oneway: '-1'});
        expect(iD.actions.Reverse('no', {reverseOneway: true})(graph)
            .entity('no').tags).to.eql({oneway: 'no'});
        expect(iD.actions.Reverse('1', {reverseOneway: true})(graph)
            .entity('1').tags).to.eql({oneway: '-1'});
        expect(iD.actions.Reverse('-1', {reverseOneway: true})(graph)
            .entity('-1').tags).to.eql({oneway: 'yes'});
    });

    it("transforms *:right=* ⟺ *:left=*", function () {
        var way = iD.Way({tags: {'cycleway:right': 'lane'}}),
            graph = iD.Graph([way]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'cycleway:left': 'lane'});

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'cycleway:right': 'lane'});
    });

    it("transforms *:forward=* ⟺ *:backward=*", function () {
        var way = iD.Way({tags: {'maxspeed:forward': '25'}}),
            graph = iD.Graph([way]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'maxspeed:backward': '25'});

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'maxspeed:forward': '25'});
    });

    it("transforms direction=up ⟺ direction=down", function () {
        var way = iD.Way({tags: {'incline': 'up'}}),
            graph = iD.Graph([way]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': 'down'});

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': 'up'});
    });

    it("transforms incline=up ⟺ incline=down", function () {
        var way = iD.Way({tags: {'incline': 'up'}}),
            graph = iD.Graph([way]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': 'down'});

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': 'up'});
    });

    it("negates numeric-valued incline tags", function () {
        var way = iD.Way({tags: {'incline': '5%'}}),
            graph = iD.Graph([way]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': '-5%'});

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': '5%'});

        way = iD.Way({tags: {'incline': '.8°'}});
        graph = iD.Graph([way]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'incline': '-.8°'});
    });

    it("transforms *=right ⟺ *=left", function () {
        var way = iD.Way({tags: {'sidewalk': 'right'}}),
            graph = iD.Graph([way]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'sidewalk': 'left'});

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'sidewalk': 'right'});
    });

    it("transforms multiple directional tags", function () {
        var way = iD.Way({tags: {'maxspeed:forward': '25', 'maxspeed:backward': '30'}}),
            graph = iD.Graph([way]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(way.id).tags).to.eql({'maxspeed:backward': '25', 'maxspeed:forward': '30'});
    });

    it("transforms role=forward ⟺ role=backward in member relations", function () {
        var way = iD.Way({tags: {highway: 'residential'}}),
            relation = iD.Relation({members: [{type: 'way', id: way.id, role: 'forward'}]}),
            graph = iD.Graph([way, relation]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('backward');

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('forward');
    });

    it("transforms role=north ⟺ role=south in member relations", function () {
        var way = iD.Way({tags: {highway: 'residential'}}),
            relation = iD.Relation({members: [{type: 'way', id: way.id, role: 'north'}]}),
            graph = iD.Graph([way, relation]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('south');

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('north');
    });

    it("transforms role=east ⟺ role=west in member relations", function () {
        var way = iD.Way({tags: {highway: 'residential'}}),
            relation = iD.Relation({members: [{type: 'way', id: way.id, role: 'east'}]}),
            graph = iD.Graph([way, relation]);

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('west');

        graph = iD.actions.Reverse(way.id)(graph);
        expect(graph.entity(relation.id).members[0].role).to.eql('east');
    });
});
