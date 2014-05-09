iD.ui.preset.restrictions = function(field, context) {
    var event = d3.dispatch('change'),
        entity,
        selectedID;

    function restrictions(selection) {
        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        // Enter

        var enter = wrap.enter().append('div')
            .attr('class', 'preset-input-wrap');

        enter.append('svg')
            .call(iD.svg.Surface(context))
            .call(iD.behavior.Hover(context));

        var d = wrap.dimensions(),
            c = [d[0] / 2, d[1] / 2],
            z = 21;

        var projection = iD.geo.RawMercator()
            .scale(256 * Math.pow(2, z) / (2 * Math.PI));

        var s = projection(entity ? entity.loc : [0, 0]);

        projection
            .translate([c[0] - s[0], c[1] - s[1]])
            .clipExtent([[0, 0], d]);

        var surface = wrap.selectAll('svg'),
            filter = function () { return true; },
            extent = iD.geo.Extent(),
            entities = [],
            graph = context.graph(),
            lines = iD.svg.Lines(projection, context),
            vertices = iD.svg.Vertices(projection, context),
            turns = iD.svg.Turns(projection, context);

        if (entity) {
            entities = graph.parentWays(entity).filter(function (parent) {
                return parent.type === 'way' && parent.tags.highway && !parent.isArea();
            });

            entities.push(entity);
        }

        if (!selectedID && entities.length) {
            selectedID = entities[0].id;
        }

        surface
            .call(vertices, graph, entities, filter, extent, z)
            .call(lines, graph, entities, filter)
            .call(turns, graph, selectedID);

        surface.on('click.select', function() {
            var datum = d3.event.target.__data__;
            if (datum instanceof iD.Entity) {
                selectedID = datum.id;
                render();
            }
        });

        surface
            .selectAll('.selected')
            .classed('selected', false);

        if (selectedID) {
            surface
                .selectAll('.' + selectedID)
                .classed('selected', true);
        }

        context.history()
            .on('change.restrictions', render);

        d3.select(window)
            .on('resize.restrictions', render);

        function render() {
            restrictions(selection);
        }
    }

    restrictions.entity = function(_) {
        if (!entity || entity.id !== _.id) {
            selectedID = null;
            entity = _;
        }
    };

    restrictions.tags = function() {};
    restrictions.focus = function() {};

    return d3.rebind(restrictions, event, 'on');
};
