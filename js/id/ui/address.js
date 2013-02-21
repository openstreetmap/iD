iD.ui.preset.address = function() {

    var event = d3.dispatch(),
        context,
        entity;

    function getStreets() {

        var l = entity.loc,
            dist = iD.geo.metresToCoordinates(entity.loc, [200, 200]),
            extent = iD.geo.Extent(
                    [entity.loc[0] - dist[0], entity.loc[1] - dist[1]],
                    [entity.loc[0] + dist[0], entity.loc[1] + dist[1]]);

        return context.intersects(extent)
            .filter(isAddressable)
            .map(function(d) {
                var loc = context.projection(entity.loc),
                    closest = context.projection(iD.geo.chooseIndex(d, loc, context).loc);
                return {
                    title: d.tags.name,
                    value: d.tags.name,
                    dist: iD.geo.dist(closest, loc)
                };
            }).sort(function(a, b) {
                return a.dist - b.dist;
            });

        function isAddressable(d) {
            return d.tags.highway && d.tags.name && d.type === 'way';
        }
    }

    function address(selection) {

        selection.append('input')
            .property('type', 'text')
            .attr('placeholder', 'Housename')
            .attr('class', 'addr-housename')
            .data({ 'key': 'addr:housename' });

        selection.append('input')
            .property('type', 'text')
            .attr('placeholder', '123')
            .attr('class', 'addr-number')
            .data({ 'key': 'addr:housenumber' });

        var streetwrap = selection.append('span')
            .attr('class', 'input-wrap-position');

        streetwrap.append('input')
            .property('type', 'text')
            .attr('placeholder', 'Oak Street')
            .attr('class', 'addr-streetname')
            .data({ 'key': 'addr:streetname' });

        streetwrap.call(d3.combobox().data(getStreets()));
    }

    address.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return address;
    };

    address.context = function(_) {
        if (!arguments.length) return context;
        context = _;
        return address;
    };

    return d3.rebind(address, event, 'on');
};
