iD.svg.Surface = function (projection, context) {
    var all = [
        { order: 1, id: 'osm', render: iD.svg.Osm(projection, context) },
        { order: 2, id: 'gpx', render: iD.svg.Gpx(projection, context) },
        { order: 3, id: 'mapillary-images', render: iD.svg.MapillaryImages(projection, context) },
        { order: 4, id: 'mapillary-signs',  render: iD.svg.MapillarySigns(projection, context) }
    ];


    function surface (selection) {
        selection.selectAll('defs')
            .data([0])
            .enter()
            .append('defs');

        var groups = selection.selectAll('.data-layer')
            .data(all);

        groups.enter()
            .append('g')
            .attr('class', function(d) { return 'layer data-layer data-layer-' + d.id; });

        groups
            .sort(function(a, b) { return a.order - b.order; })
            .each(function(d) { d3.select(this).call(d.render); });

        groups.exit()
            .remove();
    }


    surface.only = function (what) {
        var arr = [].concat(what);
        surface.remove(_.difference(_.pluck(all, 'id'), arr));
        return surface;
    };

    surface.remove = function (what) {
        var arr = [].concat(what);
        _.each(arr, function(id) {
            all = _.reject(all, function(d) { return d.id === id; });
        });
        return surface;
    };

    surface.add = function (what) {
        var arr = [].concat(what);
        _.each(arr, function(obj) {
            if ('order' in obj && 'id' in obj && 'render' in obj) {
                all.push(obj);
            }
        });
        return surface;
    };


    return surface;
};
