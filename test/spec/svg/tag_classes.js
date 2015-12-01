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

    it('adds classes for primary tag key and key-value', function() {
        selection
            .datum(iD.Entity({tags: {highway: 'primary'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary');
    });

    it('adds only one primary tag', function() {
        selection
            .datum(iD.Entity({tags: {highway: 'primary', railway: 'rail'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary');
    });

    it('orders primary tags', function() {
        selection
            .datum(iD.Entity({tags: {railway: 'rail', highway: 'primary'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary');
    });

    it('adds status tag when status in primary value (`railway=abandoned`)', function() {
        selection
            .datum(iD.Entity({tags: {railway: 'abandoned'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('tag-railway tag-status tag-status-abandoned');
    });

    it('adds status tag when status in key and value matches "yes" (railway=rail + abandoned=yes)', function() {
        selection
            .datum(iD.Entity({tags: {railway: 'rail', abandoned: 'yes'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('tag-railway tag-railway-rail tag-status tag-status-abandoned');
    });

    it('adds status tag when status in key and value matches primary (railway=rail + abandoned=railway)', function() {
        selection
            .datum(iD.Entity({tags: {railway: 'rail', abandoned: 'railway'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('tag-railway tag-railway-rail tag-status tag-status-abandoned');
    });

    it('adds primary and status tag when status in key and no primary (abandoned=railway)', function() {
        selection
            .datum(iD.Entity({tags: {abandoned: 'railway'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('tag-railway tag-status tag-status-abandoned');
    });

    it('does not add status tag for different primary tag (highway=path + abandoned=railway)', function() {
        selection
            .datum(iD.Entity({tags: {highway: 'path', abandoned: 'railway'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-path');
    });

    it('adds secondary tags', function() {
        selection
            .datum(iD.Entity({tags: {highway: 'primary', bridge: 'yes'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary tag-bridge tag-bridge-yes');
    });

    it('adds no bridge=no tags', function() {
        selection
            .datum(iD.Entity({tags: {bridge: 'no'}}))
            .call(iD.svg.TagClasses());
        expect(selection.attr('class')).to.equal(null);
    });

    it('adds tag-unpaved for highway=track with no surface tagging', function() {
        selection
            .datum(iD.Entity({tags: {highway: 'track'}}))
            .call(iD.svg.TagClasses());
        expect(selection).to.be.classed('tag-unpaved');
    });

    it('does not add tag-unpaved for highway=track with explicit paved surface tagging', function() {
        selection
            .datum(iD.Entity({tags: {highway: 'track', surface: 'asphalt'}}))
            .call(iD.svg.TagClasses());
        expect(selection).not.to.be.classed('tag-unpaved');

        selection
            .datum(iD.Entity({tags: {highway: 'track', tracktype: 'grade1'}}))
            .call(iD.svg.TagClasses());
        expect(selection).not.to.be.classed('tag-unpaved');
    });

    it('adds tag-unpaved for highway=track with explicit unpaved surface tagging', function() {
        selection
            .datum(iD.Entity({tags: {highway: 'track', surface: 'dirt'}}))
            .call(iD.svg.TagClasses());
        expect(selection).to.be.classed('tag-unpaved');

        selection
            .datum(iD.Entity({tags: {highway: 'track', tracktype: 'grade3'}}))
            .call(iD.svg.TagClasses());
        expect(selection).to.be.classed('tag-unpaved');
    });

    it('does not add tag-unpaved for other highway types with no surface tagging', function() {
        selection
            .datum(iD.Entity({tags: {highway: 'tertiary'}}))
            .call(iD.svg.TagClasses());
        expect(selection).not.to.be.classed('tag-unpaved');

        selection
            .datum(iD.Entity({tags: {highway: 'foo'}}))
            .call(iD.svg.TagClasses());
        expect(selection).not.to.be.classed('tag-unpaved');
    });

    it('does not add tag-unpaved for other highway types with explicit paved surface tagging', function() {
        selection
            .datum(iD.Entity({tags: {highway: 'tertiary', surface: 'asphalt'}}))
            .call(iD.svg.TagClasses());
        expect(selection).not.to.be.classed('tag-unpaved');

        selection
            .datum(iD.Entity({tags: {highway: 'foo', tracktype: 'grade1'}}))
            .call(iD.svg.TagClasses());
        expect(selection).not.to.be.classed('tag-unpaved');
    });

    it('adds tag-unpaved for other highway types with explicit unpaved surface tagging', function() {
        selection
            .datum(iD.Entity({tags: {highway: 'tertiary', surface: 'dirt'}}))
            .call(iD.svg.TagClasses());
        expect(selection).to.be.classed('tag-unpaved');

        selection
            .datum(iD.Entity({tags: {highway: 'foo', tracktype: 'grade3'}}))
            .call(iD.svg.TagClasses());
        expect(selection).to.be.classed('tag-unpaved');
    });

    it('does not add tag-unpaved for non-highways', function() {
        selection
            .datum(iD.Entity({tags: {railway: 'abandoned', surface: 'gravel'}}))
            .call(iD.svg.TagClasses());
        expect(selection).not.to.be.classed('tag-unpaved');

        selection
            .datum(iD.Entity({tags: {amenity: 'parking', surface: 'dirt'}}))
            .call(iD.svg.TagClasses());
        expect(selection).not.to.be.classed('tag-unpaved');
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
