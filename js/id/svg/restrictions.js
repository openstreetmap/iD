iD.svg.Restrictions = function(context) {
    var projection = context.projection;

    function drawRestrictions(surface) {
        var turns = drawRestrictions.turns(context.graph(), context.selectedIDs());

        var groups = surface.select('.layer-hit').selectAll('g.restriction')
            .data(turns, iD.Entity.key);

        var enter = groups.enter().append('g')
            .attr('class', 'restriction');

        enter.append('circle')
            .attr('class', 'restriction')
            .attr('r', 4);

        groups
            .attr('transform', function(restriction) {
                var via = context.entity(restriction.memberByRole('via').id);
                return iD.svg.PointTransform(projection)(via);
            });

        groups.exit()
            .remove();

        return this;
    }

    drawRestrictions.turns = function (graph, selectedIDs) {
        if (selectedIDs.length != 1)
            return [];

        var from = graph.entity(selectedIDs[0]);
        if (from.type !== 'way')
            return [];

        return graph.parentRelations(from).filter(function(relation) {
            var f = relation.memberById(from.id),
                t = relation.memberByRole('to'),
                v = relation.memberByRole('via');

            return relation.tags.type === 'restriction' && f.role === 'from' &&
                t && t.type === 'way' && graph.hasEntity(t.id) &&
                v && v.type === 'node' && graph.hasEntity(v.id) &&
                !graph.entity(t.id).isDegenerate() &&
                !graph.entity(f.id).isDegenerate() &&
                graph.entity(t.id).affix(v.id) &&
                graph.entity(f.id).affix(v.id);
        });
    };

    drawRestrictions.datum = function(graph, from, restriction, projection) {
        var to = graph.entity(restriction.memberByRole('to').id),
            a = graph.entity(restriction.memberByRole('via').id),
            b;

        if (to.first() === a.id) {
            b = graph.entity(to.nodes[1]);
        } else {
            b = graph.entity(to.nodes[to.nodes.length - 2]);
        }

        a = projection(a.loc);
        b = projection(b.loc);

        return {
            from: from,
            to: to,
            restriction: restriction,
            angle: Math.atan2(b[1] - a[1], b[0] - a[0])
        }
    };

    return drawRestrictions;
};
