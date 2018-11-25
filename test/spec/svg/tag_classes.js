describe('iD.svgTagClasses', function () {
    var selection;

    beforeEach(function () {
        selection = d3.select(document.createElement('div'));
    });

    it('adds no classes to elements whose datum has no tags', function() {
        selection
            .datum(iD.osmEntity())
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal(null);
    });

    it('adds classes for primary tag key and key-value', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'primary'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary');
    });

    it('adds only one primary tag', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'primary', railway: 'rail'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary');
    });

    it('orders primary tags', function() {
        selection
            .datum(iD.osmEntity({tags: {railway: 'rail', highway: 'primary'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary');
    });

    it('adds status tag when status in primary value (`railway=abandoned`)', function() {
        selection
            .datum(iD.osmEntity({tags: {railway: 'abandoned'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-railway tag-status tag-status-abandoned');
    });

    it('adds status tag when status in key and value matches "yes" (railway=rail + abandoned=yes)', function() {
        selection
            .datum(iD.osmEntity({tags: {railway: 'rail', abandoned: 'yes'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-railway tag-railway-rail tag-status tag-status-abandoned');
    });

    it('adds status tag when status in key and value matches primary (railway=rail + abandoned=railway)', function() {
        selection
            .datum(iD.osmEntity({tags: {railway: 'rail', abandoned: 'railway'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-railway tag-railway-rail tag-status tag-status-abandoned');
    });

    it('adds primary and status tag when status in key and no primary (abandoned=railway)', function() {
        selection
            .datum(iD.osmEntity({tags: {abandoned: 'railway'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-railway tag-status tag-status-abandoned');
    });

    it('does not add status tag for different primary tag (highway=path + abandoned=railway)', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'path', abandoned: 'railway'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-path');
    });

    it('adds secondary tags', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'primary', bridge: 'yes'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary tag-bridge tag-bridge-yes');
    });

    it('adds no bridge=no tags', function() {
        selection
            .datum(iD.osmEntity({tags: {bridge: 'no'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal(null);
    });

    it('adds tag-unpaved for highway=track with no surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'track'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.true;
    });

    it('does not add tag-unpaved for highway=track with explicit paved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'track', surface: 'asphalt'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;

        selection
            .datum(iD.osmEntity({tags: {highway: 'track', tracktype: 'grade1'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
    });

    it('adds tag-unpaved for highway=track with explicit unpaved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'track', surface: 'dirt'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.true;

        selection
            .datum(iD.osmEntity({tags: {highway: 'track', tracktype: 'grade3'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.true;
    });

    it('does not add tag-unpaved for other highway types with no surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'tertiary'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;

        selection
            .datum(iD.osmEntity({tags: {highway: 'foo'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
    });

    it('does not add tag-unpaved for other highway types with explicit paved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'tertiary', surface: 'asphalt'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;

        selection
            .datum(iD.osmEntity({tags: {highway: 'foo', tracktype: 'grade1'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
    });

    it('does not add tag-unpaved for other aeroway types with explicit paved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {aeroway: 'taxiway', surface: 'asphalt'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;

        selection
            .datum(iD.osmEntity({tags: {aeroway: 'runway', surface: 'paved'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
    });

    it('adds tag-unpaved for other highway types with explicit unpaved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'tertiary', surface: 'dirt'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.true;

        selection
            .datum(iD.osmEntity({tags: {highway: 'foo', tracktype: 'grade3'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.true;
    });

    it('adds tag-unpaved for other aeroway types with explicit unpaved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {aeroway: 'taxiway', surface: 'dirt'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.true;

        selection
            .datum(iD.osmEntity({tags: {aeroway: 'runway', surface: 'unpaved'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.true;
    });

    it('does not add tag-unpaved for non-highways/aeroways', function() {
        selection
            .datum(iD.osmEntity({tags: {railway: 'abandoned', surface: 'gravel'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;

        selection
            .datum(iD.osmEntity({tags: {amenity: 'parking', surface: 'dirt'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
    });

    it('adds tags based on the result of the `tags` accessor', function() {
        var primary = function () { return { highway: 'primary'}; };
        selection
            .datum(iD.osmEntity())
            .call(iD.svgTagClasses().tags(primary));
        expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary');
    });

    it('removes classes for tags that are no longer present', function() {
        selection
            .attr('class', 'tag-highway tag-highway-primary')
            .datum(iD.osmEntity())
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('');
    });

    it('preserves existing non-"tag-"-prefixed classes', function() {
        selection
            .attr('class', 'selected')
            .datum(iD.osmEntity())
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('selected');
    });

    it('works on SVG elements', function() {
        selection = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
        selection
            .datum(iD.osmEntity())
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal(null);
    });
});
