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
            .datum(iD.osmEntity({tags: {building: 'residential'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-building tag-building-residential');
    });

    it('adds only one primary tag', function() {
        selection
            .datum(iD.osmEntity({tags: {building: 'residential', railway: 'rail'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-building tag-building-residential');
    });

    it('orders primary tags', function() {
        selection
            .datum(iD.osmEntity({tags: {railway: 'rail', building: 'residential'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-building tag-building-residential');
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
            .datum(iD.osmEntity({tags: {railway: 'rail', bridge: 'yes'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-railway tag-railway-rail tag-bridge tag-bridge-yes');
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

    it('does not add tag-unpaved for non-track highways with no surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'tertiary'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;

        selection
            .datum(iD.osmEntity({tags: {highway: 'foo'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
    });

    it('does not add tag-unpaved for non-track highways with explicit paved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'tertiary', surface: 'asphalt'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;

        selection
            .datum(iD.osmEntity({tags: {highway: 'foo', tracktype: 'grade1'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
    });

    it('does not add tag-unpaved for aeroways with explicit paved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {aeroway: 'taxiway', surface: 'asphalt'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;

        selection
            .datum(iD.osmEntity({tags: {aeroway: 'runway', surface: 'paved'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
    });

    it('adds tag-unpaved for non-track highways with explicit unpaved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'tertiary', surface: 'dirt'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.true;

        selection
            .datum(iD.osmEntity({tags: {highway: 'foo', tracktype: 'grade3'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.true;
    });

    it('adds tag-semipaved for non-track highways with explicit semipaved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {highway: 'tertiary', surface: 'paving_stones'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
        expect(selection.classed('tag-semipaved')).to.be.true;

        selection
            .datum(iD.osmEntity({tags: {highway: 'foo', surface: 'wood'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
        expect(selection.classed('tag-semipaved')).to.be.true;
    });

    it('adds tag-unpaved for aeroways with explicit unpaved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {aeroway: 'taxiway', surface: 'dirt'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.true;

        selection
            .datum(iD.osmEntity({tags: {aeroway: 'runway', surface: 'unpaved'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.true;
    });

    it('adds tag-semipaved for aeroways with explicit semipaved surface tagging', function() {
        selection
            .datum(iD.osmEntity({tags: {aeroway: 'taxiway', surface: 'paving_stones'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
        expect(selection.classed('tag-semipaved')).to.be.true;

        selection
            .datum(iD.osmEntity({tags: {aeroway: 'runway', surface: 'wood'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-unpaved')).to.be.false;
        expect(selection.classed('tag-semipaved')).to.be.true;
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

    it('does not add tag-wikidata if no wikidata tag', function() {
        selection
            .datum(iD.osmEntity())
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-wikidata')).to.be.false;
    });

    it('adds tag-wikidata if entity has a wikidata tag', function() {
        selection
            .datum(iD.osmEntity({ tags: { wikidata: 'Q18275868' } }))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-wikidata')).to.be.true;
    });

    it('adds tag-wikidata if entity has a brand:wikidata tag', function() {
        selection
            .datum(iD.osmEntity({ tags: { 'brand:wikidata': 'Q18275868' } }))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-wikidata')).to.be.true;
    });

    it('adds tags based on the result of the `tags` accessor', function() {
        var primary = function () { return { railway: 'rail'}; };
        selection
            .datum(iD.osmEntity())
            .call(iD.svgTagClasses().tags(primary));
        expect(selection.attr('class')).to.equal('tag-railway tag-railway-rail');
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

    it('stroke overrides: renders areas with barriers as lines', function() {
        selection
            .attr('class', 'way area stroke')
            .datum(iD.osmEntity({tags: {landuse: 'residential', barrier: 'hedge'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('area')).to.be.false;
        expect(selection.classed('line')).to.be.true;
    });

    it('works on SVG elements', function() {
        selection = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
        selection
            .datum(iD.osmEntity())
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal(null);
    });
});
