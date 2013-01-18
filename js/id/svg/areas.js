iD.svg.Areas = function(projection) {

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

    return function drawAreas(surface, graph, entities, filter) {
        var areas = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry() === 'area') {
                areas.push(entity);
            }
        }

        areas.sort(areastack);

        var lineString = iD.svg.LineString(projection);

        function drawPaths(group, areas, filter, classes) {
            var paths = group.selectAll('path.area')
                .filter(filter)
                .data(areas, iD.Entity.key);

            paths.enter()
                .append('path')
                .attr('class', classes);

            paths
                .order()
                .attr('d', lineString)
                .call(iD.svg.TagClasses())
                .call(iD.svg.MemberClasses(graph));

            paths.exit()
                .remove();

            return paths;
        }

        var fill = surface.select('.layer-fill'),
            paths = drawPaths(fill, areas, filter, 'way area');
    };
};
