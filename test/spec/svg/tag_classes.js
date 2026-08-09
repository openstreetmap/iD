import { select as d3_select } from 'd3-selection';

describe('iD.svgTagClasses', function () {
    var selection;

    beforeEach(function () {
        selection = d3_select(document.createElement('div'));
    });

    it('adds no classes to elements whose datum has no tags', function() {
        selection
            .datum(new iD.osmWay())
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual(null);
    });

    it('adds classes for primary tag key and key-value', function() {
        selection
            .datum(new iD.osmWay({tags: {building: 'residential'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual('tag-building tag-building-residential');
    });

    it('adds only one primary tag', function() {
        selection
            .datum(new iD.osmWay({tags: {building: 'residential', railway: 'rail'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual('tag-building tag-building-residential');
    });

    it('orders primary tags', function() {
        selection
            .datum(new iD.osmWay({tags: {railway: 'rail', building: 'residential'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual('tag-building tag-building-residential');
    });

    it('adds status tag when status in primary value (`railway=abandoned`)', function() {
        selection
            .datum(new iD.osmWay({tags: {railway: 'abandoned'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual('tag-railway tag-status tag-status-abandoned');
    });

    it('adds status tag when status in key and value matches "yes" (railway=rail + abandoned=yes)', function() {
        selection
            .datum(new iD.osmWay({tags: {railway: 'rail', abandoned: 'yes'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual('tag-railway tag-railway-rail tag-status tag-status-abandoned');
    });

    it('adds status tag when status in key and value matches primary (railway=rail + abandoned=railway)', function() {
        selection
            .datum(new iD.osmWay({tags: {railway: 'rail', abandoned: 'railway'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual('tag-railway tag-railway-rail tag-status tag-status-abandoned');
    });

    it('adds primary and status tag when status in key and no primary (abandoned=railway)', function() {
        selection
            .datum(new iD.osmWay({tags: {abandoned: 'railway'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual('tag-railway tag-status tag-status-abandoned');
    });

    it('does not add status tag for different primary tag (highway=path + abandoned=railway)', function() {
        selection
            .datum(new iD.osmWay({tags: {highway: 'path', abandoned: 'railway'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual('tag-highway tag-highway-path');
    });

    it('adds secondary tags', function() {
        selection
            .datum(new iD.osmWay({tags: {railway: 'rail', bridge: 'yes'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual('tag-railway tag-railway-rail tag-bridge tag-bridge-yes');
    });

    it('adds no bridge=no tags', function() {
        selection
            .datum(new iD.osmWay({tags: {bridge: 'no'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual(null);
    });

    describe('surface paving', function() {
        it('does not add tag-unpaved for non-track highways with no surface tagging', function() {
            selection
                .datum(new iD.osmWay({tags: {highway: 'tertiary'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);

            selection
                .datum(new iD.osmWay({tags: {highway: 'foo'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);
        });

        it('does not add tag-unpaved for non-track highways with explicit paved surface tagging', function() {
            selection
                .datum(new iD.osmWay({tags: {highway: 'tertiary', surface: 'asphalt'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);

            selection
                .datum(new iD.osmWay({tags: {highway: 'foo', tracktype: 'grade1'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);
        });

        it('does not add tag-unpaved for aeroways with explicit paved surface tagging', function() {
            selection
                .datum(new iD.osmWay({tags: {aeroway: 'taxiway', surface: 'asphalt'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);

            selection
                .datum(new iD.osmWay({tags: {aeroway: 'runway', surface: 'paved'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);
        });

        it('adds tag-unpaved for non-track highways with explicit unpaved surface tagging', function() {
            selection
                .datum(new iD.osmWay({tags: {highway: 'tertiary', surface: 'dirt'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(true);

            selection
                .datum(new iD.osmWay({tags: {highway: 'foo', tracktype: 'grade3'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(true);
        });

        it('adds tag-semipaved for non-track highways with explicit semipaved surface tagging', function() {
            selection
                .datum(new iD.osmWay({tags: {highway: 'tertiary', surface: 'paving_stones'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);
            expect(selection.classed('tag-semipaved')).toBe(true);

            selection
                .datum(new iD.osmWay({tags: {highway: 'foo', surface: 'wood'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);
            expect(selection.classed('tag-semipaved')).toBe(true);
        });

        it('adds tag-unpaved for aeroways with explicit unpaved surface tagging', function() {
            selection
                .datum(new iD.osmWay({tags: {aeroway: 'taxiway', surface: 'dirt'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(true);

            selection
                .datum(new iD.osmWay({tags: {aeroway: 'runway', surface: 'unpaved'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(true);
        });

        it('adds tag-semipaved for aeroways with explicit semipaved surface tagging', function() {
            selection
                .datum(new iD.osmWay({tags: {aeroway: 'taxiway', surface: 'paving_stones'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);
            expect(selection.classed('tag-semipaved')).toBe(true);

            selection
                .datum(new iD.osmWay({tags: {aeroway: 'runway', surface: 'wood'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);
            expect(selection.classed('tag-semipaved')).toBe(true);
        });

        it('does not add tag-unpaved for non-highways/aeroways', function() {
            selection
                .datum(new iD.osmWay({tags: {railway: 'abandoned', surface: 'gravel'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);

            selection
                .datum(new iD.osmWay({tags: {amenity: 'parking', surface: 'dirt'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-unpaved')).toBe(false);
        });

        it('does not add tag-paved/tag-unpaved for highway=track regardless of surface tagging', function() {
            selection
                .datum(new iD.osmWay({tags: {highway: 'track'}})) // i.e. implied unpaved
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-paved')).toBe(false);
            expect(selection.classed('tag-unpaved')).toBe(false);

            selection
                .datum(new iD.osmWay({tags: {highway: 'track', surface: 'asphalt'}})) // i.e. paved
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-paved')).toBe(false);
            expect(selection.classed('tag-unpaved')).toBe(false);

            selection
                .datum(new iD.osmWay({tags: {highway: 'track', surface: 'gravel'}})) // i.e. unpaved
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-paved')).toBe(false);
            expect(selection.classed('tag-unpaved')).toBe(false);

            selection
                .datum(new iD.osmWay({tags: {highway: 'track', tracktype: 'grade1'}})) // i.e. paved
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-paved')).toBe(false);
            expect(selection.classed('tag-unpaved')).toBe(false);

            selection
                .datum(new iD.osmWay({tags: {highway: 'track', tracktype: 'grade3'}})) // i.e. unpaved
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-paved')).toBe(false);
            expect(selection.classed('tag-unpaved')).toBe(false);
        });
    });

    describe('track grading', function() {
        it('adds tag-ungraded for highway=track with no grade tagging', function () {
            selection
                .datum(new iD.osmWay({tags: {highway: 'track'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-ungraded')).toBe(true);
        });

        it('adds tag-ungraded for highway=track with unknown grade tagging', function () {
            selection
                .datum(new iD.osmWay({tags: {highway: 'track', tracktype: 'superb_grade'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-ungraded')).toBe(true);
        });

        it('does not add tag-ungraded for highway=track with explicit grade tagging', function () {
            selection
                .datum(new iD.osmWay({tags: {highway: 'track', tracktype: 'grade3'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-ungraded')).toBe(false);
        });

        it('adds tag-ungraded for highway=track even with surface tagging', function () {
            selection
                .datum(new iD.osmWay({tags: {highway: 'track', surface: 'asphalt'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-ungraded')).toBe(true);

            selection
                .datum(new iD.osmWay({tags: {highway: 'track', surface: 'dirt'}}))
                .call(iD.svgTagClasses());
            expect(selection.classed('tag-ungraded')).toBe(true);
        });
    });

    it('adds tag-wikidata if entity has a brand:wikidata tag', function() {
        selection
            .datum(new iD.osmWay({ tags: { 'brand:wikidata': 'Q18275868' } }))
            .call(iD.svgTagClasses());
        expect(selection.classed('tag-wikidata')).toBe(true);
    });

    it('adds tags based on the result of the `tags` accessor', function() {
        var primary = function () { return { railway: 'rail'}; };
        selection
            .datum(new iD.osmWay())
            .call(iD.svgTagClasses().tags(primary));
        expect(selection.attr('class')).toEqual('tag-railway tag-railway-rail');
    });

    it('removes classes for tags that are no longer present', function() {
        selection
            .attr('class', 'tag-highway tag-highway-primary')
            .datum(new iD.osmWay())
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual('');
    });

    it('preserves existing non-"tag-"-prefixed classes', function() {
        selection
            .attr('class', 'selected')
            .datum(new iD.osmWay())
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual('selected');
    });

    it('stroke overrides: renders areas with barriers as lines', function() {
        selection
            .attr('class', 'way area stroke')
            .datum(new iD.osmWay({tags: {landuse: 'residential', barrier: 'hedge'}}))
            .call(iD.svgTagClasses());
        expect(selection.classed('area')).toBe(false);
        expect(selection.classed('line')).toBe(true);
    });

    it('works on SVG elements', function() {
        selection = d3_select(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
        selection
            .datum(new iD.osmWay())
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).toEqual(null);
    });

    it('normalizes colons in primary tag key to underlines', function() {
        selection
            .datum(new iD.osmWay({tags: {'piste:type': 'nordic'}}))
            .call(iD.svgTagClasses());
        expect(selection.attr('class')).to.equal('tag-piste_type tag-piste_type-nordic');
    });

    describe('memoization', function() {
        function spyOnClassesString(tagClasses) {
            var calls = 0;
            var original = tagClasses.getClassesString;
            tagClasses.getClassesString = function(t, value) {
                calls++;
                return original.call(this, t, value);
            };
            return function() { return calls; };
        }

        it('hits the memo across redraws when using the same instance', function() {
            var tagClasses = iD.svgTagClasses();
            var calls = spyOnClassesString(tagClasses);
            var graph = {};

            var way = new iD.osmWay({ id: 'w1', v: 1 });
            selection
                .attr('class', 'way line w1')
                .datum(way);

            selection.call(tagClasses.graph(graph));   // first redraw: compute
            selection.call(tagClasses.graph(graph));   // second redraw: memo hit

            expect(selection.attr('class')).toEqual('way line w1');
            expect(calls()).toEqual(1);
        });

        it('does not hit the memo across redraws when using a fresh instance', function() {
            var graph = {};
            var way = new iD.osmWay({ id: 'w1', v: 1 });
            selection
                .attr('class', 'way line w1')
                .datum(way);

            var first = iD.svgTagClasses();
            var calls = spyOnClassesString(first);
            selection.call(first.graph(graph));
            expect(calls()).toEqual(1);

            var second = iD.svgTagClasses();
            calls = spyOnClassesString(second);
            selection.call(second.graph(graph));
            expect(calls()).toEqual(1);
        });

        it('invalidates the memo when the graph changes', function() {
            var tagClasses = iD.svgTagClasses();
            var calls = spyOnClassesString(tagClasses);
            var graphA = {};
            var graphB = {};

            var way = new iD.osmWay({ id: 'w2', v: 1 });
            selection
                .attr('class', 'way line w2')
                .datum(way);

            selection.call(tagClasses.graph(graphA));   // graph A: compute
            selection.call(tagClasses.graph(graphA));   // graph A: memo hit
            expect(calls()).toEqual(1);

            selection.call(tagClasses.graph(graphB));   // graph B: recompute
            expect(calls()).toEqual(2);
        });

        it('does not reuse midpoint classes computed for a different parent way', function() {
            var graph = {};
            var wayA = new iD.osmWay({ id: 'w100', v: 1, tags: { highway: 'residential' } });
            var wayB = new iD.osmWay({ id: 'w101', v: 1, tags: { highway: 'track' } });

            // midpoints are plain objects with a version-less id
            function midpoint(parent) {
                return {
                    type: 'midpoint',
                    id: 'n1000-n2000',
                    loc: [0, 0],
                    edge: ['n1000', 'n2000'],
                    parents: [parent]
                };
            }

            var tagClasses = iD.svgTagClasses();
            var s1 = d3_select(document.createElement('div'))
                .attr('class', 'midpoint')
                .datum(midpoint(wayA));
            var s2 = d3_select(document.createElement('div'))
                .attr('class', 'midpoint')
                .datum(midpoint(wayB));

            s1.call(tagClasses.tags(function(d) { return d.parents[0].tags; })
                .keyExt(function(d) { return iD.osmIdManager.key(d.parents[0]); })
                .graph(graph));
            s2.call(tagClasses.tags(function(d) { return d.parents[0].tags; })
                .keyExt(function(d) { return iD.osmIdManager.key(d.parents[0]); })
                .graph(graph));

            expect(s1.classed('tag-highway-residential')).toBe(true);
            expect(s2.classed('tag-highway-track')).toBe(true);
            expect(s2.classed('tag-highway-residential')).toBe(false);
        });
    });
});
