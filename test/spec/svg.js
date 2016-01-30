describe("iD.svg.RelationMemberTags", function() {
    it("includes tags from parent multipolygon relations", function() {
        var graph = iD.Graph([
            iD.Way({id: 'w'}),
            iD.Relation({id: 'r', members: [{id: 'w'}], tags: {type: 'multipolygon'}}),
        ]);

        expect(iD.svg.RelationMemberTags(graph)(graph.entity('w')))
            .to.eql({type: 'multipolygon'});
    });

    it("includes tags from parent boundary relations", function() {
        var graph = iD.Graph([
            iD.Way({id: 'w'}),
            iD.Relation({id: 'r', members: [{id: 'w'}], tags: {type: 'boundary'}}),
        ]);

        expect(iD.svg.RelationMemberTags(graph)(graph.entity('w')))
            .to.eql({type: 'boundary'});
    });
});
