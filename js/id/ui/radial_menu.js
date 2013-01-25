iD.ui.RadialMenu = function(entity, history, map) {
    var radialMenu = function(selection, center) {
        var operations,
            graph = history.graph(),
            geometry = entity.geometry(graph);

        if (geometry === 'vertex') {
            operations = [
                {
                    id: 'delete',
                    text: 'Delete',
                    description: 'deleted a node',
                    action: iD.actions.DeleteNode(entity.id)
                },
                {
                    id: 'split',
                    text: 'Split Way',
                    description: 'split a way',
                    action: iD.actions.SplitWay(entity.id)
                },
                {
                    id: 'unjoin',
                    text: 'Unjoin',
                    description: 'unjoined lines',
                    action: iD.actions.UnjoinNode(entity.id)
                }
            ];
        } else if (geometry === 'point') {
            operations = [
                {
                    id: 'delete',
                    text: 'Delete',
                    description: 'deleted a point',
                    action: iD.actions.DeleteNode(entity.id)
                }
            ];
        } else if (geometry === 'line') {
            operations = [
                {
                    id: 'delete',
                    text: 'Delete',
                    description: 'deleted a line',
                    action: iD.actions.DeleteWay(entity.id)
                },
                {
                    id: 'reverse',
                    text: 'Reverse',
                    description: 'reversed a way',
                    action: iD.actions.ReverseWay(entity.id)
                }
            ];
            if (entity.isClosed()) {
                operations.push({
                   id: 'circlar',
                   text: 'Circular',
                   description: 'made way circular',
                   action: iD.actions.Circular(entity.id, map)
                });
            }
        } else if (geometry === 'area') {
            operations = [
                {
                    id: 'delete',
                    text: 'Delete',
                    description: 'deleted an area',
                    action: iD.actions.DeleteWay(entity.id)
                },
                {
                    id: 'circlar',
                    text: 'Circular',
                    description: 'made area circular',
                    action: iD.actions.Circular(entity.id, map)
                }
            ];
            
        }

        var arc = d3.svg.arc()
            .outerRadius(70)
            .innerRadius(30)
            .startAngle(function (d, i) { return 2 * Math.PI / operations.length * i; })
            .endAngle(function (d, i) { return 2 * Math.PI / operations.length * (i + 1); });

        var arcs = selection.selectAll('.radial-menu')
            .data(operations)
            .enter().append('g')
            .attr('class', 'radial-menu')
            .attr('transform', "translate(" + center + ")")
            .attr('opacity', 0);

        arcs.transition()
            .attr('opacity', 0.8);

        arcs.append('path')
            .attr('class', function (d) { return 'radial-menu-item radial-menu-item-' + d.id; })
            .attr('d', arc)
            .classed('disabled', function (d) { return !d.action.enabled(history.graph()); })
            .on('click', function (d) { history.perform(d.action, d.description); });

        arcs.append('text')
            .attr("transform", function(d, i) { return "translate(" + arc.centroid(d, i) + ")"; })
            .attr("dy", ".35em")
            .style("text-anchor", "middle")
            .text(function(d) { return d.text; });
    };

    radialMenu.close = function(selection) {
        selection.selectAll('.radial-menu')
            .transition()
            .attr('opacity', 0)
            .remove();
    };

    return radialMenu;
};
