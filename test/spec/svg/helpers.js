import { select as d3_select } from 'd3-selection';
import { geoProjection as d3_geoProjection } from 'd3-geo';

describe('iD.svgPath', function () {
    function projection(zoom) {
        return d3_geoProjection(function(x, y) { return [x, -y]; })
            .translate([0, 0])
            .scale(iD.geoZoomToScale(zoom))
            .clipExtent([[0, 0], [Infinity, Infinity]]);
    }

    function wayGraph() {
        var a = new iD.osmNode({id: 'n1', loc: [0, 0]});
        var b = new iD.osmNode({id: 'n2', loc: [1, 1]});
        var line = new iD.osmWay({id: 'w1', nodes: ['n1', 'n2']});
        return new iD.coreGraph([a, b, line]);
    }

    it('hits the graph-transient cache across redraws at the same projection', function() {
        var graph = wayGraph();
        var line = graph.entity('w1');

        var first = iD.svgPath(projection(17), graph);
        var second = iD.svgPath(projection(17), graph);

        var value1 = first(line);
        var cached = graph.transients.w1.svgPath;
        expect(cached).toBeDefined();

        // the second redraw reads the stored entry - it is not recomputed or replaced
        var value2 = second(line);
        expect(graph.transients.w1.svgPath).toBe(cached);
        expect(value2).toEqual(value1);
    });

    it('replaces (does not accumulate) the cached path when the projection changes', function() {
        var graph = wayGraph();
        var line = graph.entity('w1');

        var atZ17 = iD.svgPath(projection(17), graph);
        var atZ18 = iD.svgPath(projection(18), graph);

        var value17 = atZ17(line);
        var entry17 = graph.transients.w1.svgPath;
        expect(entry17).toBeDefined();

        var value18 = atZ18(line);
        var entry18 = graph.transients.w1.svgPath;
        expect(entry18).not.toBe(entry17);               // replaced, not reused
        expect(entry18.key).not.toEqual(entry17.key);    // tagged with the new projection
        // a single svgPath slot (the entity also has a 'GeoJSON' transient from asGeoJSON)
        expect(Object.keys(graph.transients.w1).filter(k => k.indexOf('svgPath') === 0)).toEqual(['svgPath']);
        expect(value18).not.toEqual(value17);            // different projection, different path

        // zooming back recomputes rather than returning the stale z18 value
        var value17again = atZ17(line);
        expect(graph.transients.w1.svgPath).not.toBe(entry18);
        expect(value17again).toEqual(value17);
    });

    it('recomputes when a new graph object is used', function() {
        var graphA = wayGraph();
        var lineA = graphA.entity('w1');
        var valueA = iD.svgPath(projection(17), graphA)(lineA);
        var entryA = graphA.transients.w1.svgPath;

        var graphB = wayGraph();
        var lineB = graphB.entity('w1');
        var valueB = iD.svgPath(projection(17), graphB)(lineB);

        expect(graphB.transients.w1.svgPath).toBeDefined();
        expect(graphB.transients.w1.svgPath).not.toBe(entryA);
        expect(valueB).toEqual(valueA);
    });

    it('invalidates cached paths when a rebase affects the entity (tile merge)', function() {
        var graph = wayGraph();
        var line = graph.entity('w1');
        var path = iD.svgPath(projection(17), graph);
        path(line);
        expect(graph.transients.w1.svgPath).toBeDefined();

        // tile-merge rebases mutate the graph in place; a merge touching one of
        // w1's nodes (a new way sharing n1) must invalidate the cached path
        var unrelated = new iD.osmNode({id: 'n9', loc: [2, 2]});
        var newWay = new iD.osmWay({id: 'w9', nodes: ['n1', 'n9']});
        graph.rebase([unrelated, newWay], [graph]);
        expect(graph.transients.w1).toBeUndefined();

        // the next redraw recomputes the path
        var next = path(line);
        expect(graph.transients.w1.svgPath).toBeDefined();
        expect(next).toEqual(graph.transients.w1.svgPath.value);
    });
});

describe('iD.svgAttrIfChanged', function () {
    var selection;

    beforeEach(function () {
        selection = d3_select(document.createElement('div'));
    });

    it('writes the attribute on a fresh element', function() {
        selection
            .datum({d: 'M0,0L1,1'})
            .call(iD.svgAttrIfChanged, 'd', function(d) { return d.d; });
        expect(selection.attr('d')).toEqual('M0,0L1,1');
    });

    it('skips writing when the attribute value is unchanged', function() {
        selection
            .attr('d', 'M0,0L1,1')
            .datum({d: 'M0,0L1,1'});

        var writes = 0;
        var el = selection.node();
        var orig = el.setAttribute;
        el.setAttribute = function(name, value) {
            writes++;
            orig.call(this, name, value);
        };

        selection.call(iD.svgAttrIfChanged, 'd', function(d) { return d.d; });

        expect(writes).toEqual(0);
        expect(selection.attr('d')).toEqual('M0,0L1,1');
    });

    it('writes on a re-entered fresh element while skipping elements already up to date', function() {
        var container = document.createElement('div');
        var elA = document.createElement('div');   // already has the correct value
        var elB = document.createElement('div');   // freshly entered - no attribute yet
        elA.setAttribute('d', 'M0,0L1,1');
        container.appendChild(elA);
        container.appendChild(elB);

        var writes = 0;
        [elA, elB].forEach(function(el) {
            var orig = el.setAttribute;
            el.setAttribute = function(name, value) {
                writes++;
                orig.call(this, name, value);
            };
        });

        var nodes = d3_select(container).selectAll('div')
            .data([{d: 'M0,0L1,1'}, {d: 'M0,0L1,1'}]);
        nodes.call(iD.svgAttrIfChanged, 'd', function(d) { return d.d; });

        expect(writes).toEqual(1);
        expect(elA.getAttribute('d')).toEqual('M0,0L1,1');
        expect(elB.getAttribute('d')).toEqual('M0,0L1,1');
    });

    it('removes the attribute when the value becomes null', function() {
        selection
            .attr('d', 'M0,0L1,1')
            .datum({d: null})
            .call(iD.svgAttrIfChanged, 'd', function(d) { return d.d; });
        expect(selection.attr('d')).toBeNull();
    });
});
