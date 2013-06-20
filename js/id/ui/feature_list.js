iD.ui.FeatureList = function(context) {
    function featureList(selection) {
        var header = selection.append('div')
            .attr('class', 'header fillL cf');

        header.append('h3')
            .text(t('inspector.feature_list'));

        function keypress() {
            var q = search.property('value');
            if (d3.event.keyCode === 13 && q.length) {
                click(list.selectAll('.feature-list-item:first-child').datum().entity);
            }
        }

        function inputevent() {
            drawList();
        }

        var searchWrap = selection.append('div')
            .attr('class', 'search-header');

        var search = searchWrap.append('input')
            .attr('placeholder', t('inspector.search'))
            .attr('type', 'search')
            .on('keypress', keypress)
            .on('input', inputevent);

        searchWrap.append('span')
            .attr('class', 'icon search');

        var listWrap = selection.append('div')
            .attr('class', 'inspector-body');

        var list = listWrap.append('div')
            .attr('class', 'feature-list fillL cf');

        context.map()
            .on('drawn.feature-list', mapDrawn);

        function mapDrawn(e) {
            if (e.full) {
                drawList();
            }
        }

        function features() {
            var entities = {},
                result = [],
                graph = context.graph(),
                q = search.property('value').toLowerCase();

            function addEntity(entity) {
                if (entity.id in entities || result.length > 200)
                    return;

                entities[entity.id] = true;

                var preset = context.presets().match(entity, graph),
                    name = iD.util.displayName(entity) || '';

                if (!q || name.toLowerCase().indexOf(q) >= 0 ||
                    preset.name().toLowerCase().indexOf(q) >= 0) {
                    result.push({
                        entity: entity,
                        geometry: context.geometry(entity.id),
                        preset: preset,
                        name: name
                    });
                }

                graph.parentRelations(entity).forEach(function(parent) {
                    addEntity(parent);
                });
            }

            var visible = context.surface().selectAll('.point, .line, .area')[0];
            for (var i = 0; i < visible.length && result.length <= 200; i++) {
                addEntity(visible[i].__data__);
            }

            return result;
        }

        function drawList() {
            list.classed('filtered', search.property('value').length);

            var items = list.selectAll('.feature-list-item')
                .data(features(), function(d) { return d.entity.id; });

            var enter = items.enter().append('button')
                .attr('class', 'feature-list-item')
                .call(iD.ui.PresetIcon()
                    .geometry(function(d) { return d.geometry })
                    .preset(function(d) { return d.preset; }))
                .on('mouseover', function(d) { mouseover(d.entity); })
                .on('mouseout', function(d) { mouseout(); })
                .on('click', function(d) { click(d.entity); });

            var label = enter.append('div')
                .attr('class', 'label');

            label.append('span')
                .attr('class', 'entity-type')
                .text(function(d) { return d.preset.name(); });

            label.append('span')
                .attr('class', 'entity-name')
                .text(function(d) { return d.name; });

            enter.style('opacity', 0)
                .transition()
                .style('opacity', 1);

            items.order();

            items.exit()
                .remove();
        }

        function mouseover(entity) {
            context.surface().selectAll(iD.util.entityOrMemberSelector([entity.id], context.graph()))
                .classed('hover', true);
        }

        function mouseout() {
            context.surface().selectAll('.hover')
                .classed('hover', false);
        }

        function click(entity) {
            context.enter(iD.modes.Select(context, [entity.id]));
        }
    }

    return featureList;
};
