iD.ui.SelectionList = function(context, selectedIDs) {

    function selectionList(selection) {
        selection.classed('selection-list-pane', true);

        var header = selection.append('div')
            .attr('class', 'header fillL cf');

        header.append('h3')
            .text(t('inspector.multiselect'));

        var listWrap = selection.append('div')
            .attr('class', 'inspector-body');

        var list = listWrap.append('div')
            .attr('class', 'feature-list cf');

        drawList();

        function features() {
            var entities = {},
                result = [],
                graph = context.graph();

            function addEntity(entity) {
                var name = iD.util.displayName(entity) || '';
                result.push({
                    id: entity.id,
                    entity: entity,
                    geometry: context.geometry(entity.id),
                    type: context.presets().match(entity, graph).name(),
                    name: name
                });
            }

            for (var i = 0; i < selectedIDs.length; i++) {
                addEntity(context.entity(selectedIDs[i]));
            }

            return result;
        }

        function drawList() {
            var results = features();

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
    }

    return selectionList;

};
