iD.ui.FeatureList = function(context) {
    var geocodeResults;

    function featureList(selection) {
        var header = selection.append('div')
            .attr('class', 'header fillL cf');

        header.append('h3')
            .text(t('inspector.feature_list'));

        function keypress() {
            var q = search.property('value'),
                items = list.selectAll('.feature-list-item');
            if (d3.event.keyCode === 13 && q.length && items.size()) {
                click(items.datum().entity);
            }
        }

        function inputevent() {
            geocodeResults = undefined;
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
            .attr('class', 'feature-list cf');

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

            if (!q) return result;

            function addEntity(entity) {
                if (entity.id in entities || result.length > 200)
                    return;

                entities[entity.id] = true;

                var name = iD.util.displayName(entity) || '';
                if (name.toLowerCase().indexOf(q) >= 0) {
                    result.push({
                        id: entity.id,
                        entity: entity,
                        geometry: context.geometry(entity.id),
                        type: context.presets().match(entity, graph).name(),
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

            (geocodeResults || []).forEach(function(d) {
                // https://github.com/systemed/iD/issues/1890
                if (d.osm_type && d.osm_id) {
                    result.push({
                        id: iD.Entity.id.fromOSM(d.osm_type, d.osm_id),
                        geometry: d.osm_type === 'relation' ? 'relation' : d.osm_type === 'way' ? 'line' : 'point',
                        type: (d.type.charAt(0).toUpperCase() + d.type.slice(1)).replace('_', ' '),
                        name: d.display_name,
                        extent: new iD.geo.Extent(
                            [parseFloat(d.boundingbox[3]), parseFloat(d.boundingbox[0])],
                            [parseFloat(d.boundingbox[2]), parseFloat(d.boundingbox[1])])
                    });
                }
            });

            return result;
        }

        function drawList() {
            var value = search.property('value'),
                results = features();

            list.classed('filtered', value.length);

            var noResultsWorldwide = geocodeResults && geocodeResults.length === 0;

            var resultsIndicator = list.selectAll('.no-results-item')
                .data([0])
                .enter().append('button')
                .property('disabled', true)
                .attr('class', 'no-results-item');

            resultsIndicator.append('span')
                .attr('class', 'icon alert');

            resultsIndicator.append('span')
                .attr('class', 'entity-name');

            list.selectAll('.no-results-item .entity-name')
                .text(noResultsWorldwide ? t('geocoder.no_results_worldwide') : t('geocoder.no_results_visible'));

            list.selectAll('.geocode-item')
                .data([0])
                .enter().append('button')
                .attr('class', 'geocode-item')
                .on('click', geocode)
                .append('div')
                .attr('class', 'label')
                .append('span')
                .attr('class', 'entity-name')
                .text(t('geocoder.search'));

            list.selectAll('.no-results-item')
                .style('display', (value.length && !results.length) ? 'block' : 'none');

            list.selectAll('.geocode-item')
                .style('display', (value && geocodeResults === undefined) ? 'block' : 'none');

            var items = list.selectAll('.feature-list-item')
                .data(results, function(d) { return d.id; });

            var enter = items.enter().insert('button', '.geocode-item')
                .attr('class', 'feature-list-item')
                .on('mouseover', mouseover)
                .on('mouseout', mouseout)
                .on('click', click);

            var label = enter.append('div')
                .attr('class', 'label');

            label.append('span')
                .attr('class', function(d) { return d.geometry + ' icon icon-pre-text'; });

            label.append('span')
                .attr('class', 'entity-type')
                .text(function(d) { return d.type; });

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

        function mouseover(d) {
            context.surface().selectAll(iD.util.entityOrMemberSelector([d.id], context.graph()))
                .classed('hover', true);
        }

        function mouseout() {
            context.surface().selectAll('.hover')
                .classed('hover', false);
        }

        function click(d) {
            if (d.entity) {
                context.enter(iD.modes.Select(context, [d.entity.id]));
            } else {
                context.loadEntity(d.id);
            }
        }

        function geocode() {
            var searchVal = encodeURIComponent(search.property('value'));
            d3.json('http://nominatim.openstreetmap.org/search/' + searchVal + '?limit=10&format=json', function(err, resp) {
                geocodeResults = resp || [];
                drawList();
            });
        }
    }

    return featureList;
};
