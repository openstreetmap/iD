describe("iD.svg.MemberClasses", function () {
    var selection;

    beforeEach(function () {
        selection = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    });

    it("adds no classes to elements that aren't a member of any relations", function() {
        var node = iD.Node(),
            graph = iD.Graph([node]);

        selection
            .datum(node)
            .call(iD.svg.MemberClasses(graph));

        expect(selection.attr('class')).to.equal(null);
    });

    it("adds tags for member, role, and type", function() {
        var node = iD.Node(),
            relation = iD.Relation({members: [{id: node.id, role: 'r'}], tags: {type: 't'}}),
            graph = iD.Graph([node, relation]);

        selection
            .datum(node)
            .call(iD.svg.MemberClasses(graph));

        expect(selection.attr('class')).to.equal('member member-type-t member-role-r');
    });

    it('removes classes for tags that are no longer present', function() {
        var node = iD.Entity(),
            graph = iD.Graph([node]);

        selection
            .attr('class', 'member member-type-t member-role-r')
            .datum(node)
            .call(iD.svg.MemberClasses(graph));

        expect(selection.attr('class')).to.equal('');
    });

    it("preserves existing non-'member-'-prefixed classes", function() {
        var node = iD.Entity(),
            graph = iD.Graph([node]);

        selection
            .attr('class', 'selected')
            .datum(node)
            .call(iD.svg.MemberClasses(graph));

        expect(selection.attr('class')).to.equal('selected');
    });
});
