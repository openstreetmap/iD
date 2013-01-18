iD.svg.Areas = function() {

    var area_stack = {
        building: 0,
        manmade: 1,
        natural: 1,
        boundary: 2
    };

    function findKey(a) {
        var vals = Object.keys(a.tags).filter(function(k) {
            return area_stack[k] !== undefined;
        });
        if (vals.length > 0) return area_stack[vals[0]];
        else return -1;
    }

    function areastack(a, b) {
        if (!a || !b || !a.tags || !b.tags) return 0;
        if (a.tags.layer !== undefined && b.tags.layer !== undefined) {
            return a.tags.layer - b.tags.layer;
        }
        var as = 0, bs = 0;
        as -= findKey(a);
        bs -= findKey(b);
        return as - bs;
    }

    return function drawAreas(surface, graph, entities, filter, projection) {
        var areas = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry() === 'area') {
                areas.push(entity);
            }
        }

        areas.sort(areastack);

        var lineStrings = {};

        function lineString(entity) {
            if (lineStrings[entity.id] !== undefined) {
                return lineStrings[entity.id];
            }
            var nodes = _.pluck(entity.nodes, 'loc');
            if (nodes.length === 0) return (lineStrings[entity.id] = '');
            else return (lineStrings[entity.id] =
                'M' + nodes.map(iD.svg.RoundProjection(projection)).join('L'));
        }

        function drawPaths(group, areas, filter, classes) {
            var paths = group.selectAll('path')
                .filter(filter)
                .data(areas, iD.Entity.key);

            paths.enter()
                .append('path')
                .attr('class', classes);

            paths
                .order()
                .attr('d', lineString)
                .call(iD.svg.TagClasses());

            paths.exit()
                .remove();

            return paths;
        }

        var fill = surface.select('.layer-fill'),
            paths = drawPaths(fill, areas, filter, 'way area');
    };
};
