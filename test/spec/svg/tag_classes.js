describe("iD.svg.TagClasses", function () {
    var selection;

    beforeEach(function () {
        selection = d3.select(document.createElement('div'));
    });

    it('adds no classes to elements whose datum has no tags', function() {
        selection
            .datum(iD.Entity())
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal(null);
    });

    it('adds classes for highway tags', function() {
        selection
            .datum(iD.Entity({tags: {highway: 'primary'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary');
    });

    it('adds no bridge=no tags', function() {
        selection
            .datum(iD.Entity({tags: {bridge: 'no'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal(null);
    });

    it('adds tags based on the result of the `tags` accessor', function() {
        selection
            .datum(iD.Entity())
            .call(iD.svg.TagClasses().tags(d3.functor({highway: 'primary'})));
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary');
    });

    it('removes classes for tags that are no longer present', function() {
        selection
            .attr('class', 'tag-highway tag-highway-primary')
            .datum(iD.Entity())
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('');
    });

    it('preserves existing non-"tag-"-prefixed classes', function() {
        selection
            .attr('class', 'selected')
            .datum(iD.Entity())
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('selected');
    });

    it('works on SVG elements', function() {
        selection = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
        selection
            .datum(iD.Entity())
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal(null);
    });
});
