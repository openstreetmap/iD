iD.svg.Lines = function(projection) {

    var arrowtext = '►\u3000\u3000\u3000',
        alength;

    var highway_stack = {
        motorway: 0,
        motorway_link: 1,
        trunk: 2,
        trunk_link: 3,
        primary: 4,
        primary_link: 5,
        secondary: 6,
        tertiary: 7,
        unclassified: 8,
        residential: 9,
        service: 10,
        footway: 11
    };

    function waystack(a, b) {
        if (!a || !b || !a.tags || !b.tags) return 0;
        if (a.tags.layer !== undefined && b.tags.layer !== undefined) {
            return a.tags.layer - b.tags.layer;
        }
        if (a.tags.bridge) return 1;
        if (b.tags.bridge) return -1;
        var as = 0, bs = 0;
        if (a.tags.highway && b.tags.highway) {
            as -= highway_stack[a.tags.highway];
            bs -= highway_stack[b.tags.highway];
        }
        return as - bs;
    }

    // For fixing up rendering of multipolygons with tags on the outer member.
    // https://github.com/systemed/iD/issues/613
    function simpleMultipolygonOuterMember(entity, graph) {
        if (entity.type !== 'way')
            return false;

        var parents = graph.parentRelations(entity);
        if (parents.length !== 1)
            return false;

        var parent = parents[0];
        if (!parent.isMultipolygon() || Object.keys(parent.tags).length > 1)
            return false;

        var members = parent.members, member, outer;
        for (var i = 0; i < members.length; i++) {
            member = members[i];
            if (!member.role || member.role === 'outer') {
                if (outer)
                    return false; // Not a simple multipolygon
                outer = graph.entity(member.id);
            }
        }

        return outer;
    }

    return function drawLines(surface, graph, entities, filter, dimensions) {
        function drawPaths(group, lines, filter, klass, lineString) {
            lines = lines.filter(function(line) {
                return lineString(line);
            });

            var tagClasses = iD.svg.TagClasses();

            if (klass === 'stroke') {
                tagClasses.tags(iD.svg.MultipolygonMemberTags(graph));
            }

            var paths = group.selectAll('path.line')
                .filter(filter)
                .data(lines, iD.Entity.key);

            paths.enter()
                .append('path')
                .attr('class', 'way line ' + klass);

            paths
                .order()
                .attr('d', lineString)
                .call(tagClasses)
                .call(iD.svg.MemberClasses(graph));

            paths.exit()
                .remove();

            return paths;
        }

        if (!alength) {
            var container = surface.append('g')
                    .attr('class', 'oneway'),
                arrow = container.append('text')
                    .attr('class', 'textpath')
                    .text(arrowtext);
            alength = arrow.node().getComputedTextLength();
            container.remove();
        }

        var lines = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i],
                outer = simpleMultipolygonOuterMember(entity, graph);
            if (outer) {
                lines.push(entity.mergeTags(outer.tags));
            } else if (entity.geometry(graph) === 'line') {
                lines.push(entity);
            }
        }

        lines.sort(waystack);

        var lineString = iD.svg.LineString(projection, graph, dimensions);

        var shadow = surface.select('.layer-shadow'),
            casing = surface.select('.layer-casing'),
            stroke = surface.select('.layer-stroke'),
            defs   = surface.select('defs'),
            text   = surface.select('.layer-text'),
            shadows = drawPaths(shadow, lines, filter, 'shadow', lineString),
            casings = drawPaths(casing, lines, filter, 'casing', lineString),
            strokes = drawPaths(stroke, lines, filter, 'stroke', lineString);

        // Determine the lengths of oneway paths
        var lengths = {},
            oneways = strokes.filter(function(d) { return d.isOneWay(); }).each(function(d) {
                lengths[d.id] = Math.floor(this.getTotalLength() / alength);
            }).data();

        var uses = defs.selectAll('path')
            .filter(filter)
            .data(oneways, iD.Entity.key);

        uses.enter()
            .append('path');

        uses
            .attr('id', function(d) { return 'shadow-' + d.id; })
            .attr('d', lineString);

        uses.exit()
            .remove();

        var labels = text.selectAll('text')
            .filter(filter)
            .data(oneways, iD.Entity.key);

        var tagClasses = iD.svg.TagClasses();

        var tp = labels.enter()
            .append('text')
                .attr({ 'class': 'oneway', dy: 4 })
            .append('textPath')
                .attr('class', 'textpath')
                .call(tagClasses);

        labels.exit().remove();

        text.selectAll('.textpath')
            .filter(filter)
            .attr('xlink:href', function(d) { return '#shadow-' + d.id; })
            .text(function(d) {
                // adding longer text than necessary, since overflow is hidden
                return (new Array(Math.floor(lengths[d.id] * 1.1))).join(arrowtext);
            });
    };
};
