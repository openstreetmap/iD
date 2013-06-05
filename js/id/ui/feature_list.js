iD.ui.FeatureList = function(context) {
    function featureList(selection) {
        var header = selection.append('div')
            .attr('class', 'header fillL cf');

        header.append('h3')
            .text(t('inspector.feature_list'));

        function keyup() {
            var q = search.property('value');
            if (d3.event.keyCode === 13 && q.length) {
                click(list.selectAll('.feature-list-item:first-child').datum());
            } else {
                drawList();
            }
        }

        var searchWrap = selection.append('div')
            .attr('class', 'search-header');

        var search = searchWrap.append('input')
            .attr('placeholder', t('inspector.search'))
            .attr('type', 'search')
            .on('keyup', keyup);

        searchWrap.append('span')
            .attr('class', 'icon search');

        var listWrap = selection.append('div')
            .attr('class', 'inspector-body');

        var list = listWrap.append('div')
            .attr('class', 'feature-list fillL cf');

        drawList();

        context.history()
            .on('change.feature-list', drawList);

        context.map()
            .on('drawn', drawList);

        function features() {
            var result = [],
                graph = context.graph(),
                q = search.property('value').toLowerCase();

            if (!context.map().editable()) {
                return result;
            }

            var entities = context.intersects(context.extent());
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];

                if (entity.geometry(graph) === 'vertex')
                    continue;

                var preset = context.presets().match(entity, context.graph()),
                    name = iD.util.displayName(entity) || '';

                if (q && name.toLowerCase().indexOf(q) === -1 &&
                    preset.name().toLowerCase().indexOf(q) === -1)
                    continue;

                result.push({
                    entity: entity,
                    geometry: context.geometry(entity.id),
                    preset: preset,
                    name: name
                });

                if (result.length > 200)
                    break;
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
            var selector = '.' + entity.id;

            if (entity.type === 'relation') {
                entity.members.forEach(function(member) {
                    selector += ', .' + member.id;
                });
            }

            context.surface().selectAll(selector)
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
