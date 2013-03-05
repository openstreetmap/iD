iD.ui.preset.address = function(context) {

    var event = d3.dispatch('change', 'close'),
        entity;

    function getStreets() {

        var extent = entity.extent(context.graph()),
            l = extent.center(),
            dist = iD.geo.metersToCoordinates(l, [200, 200]),
            box = iD.geo.Extent(
                    [extent[0][0] - dist[0], extent[0][1] - dist[1]],
                    [extent[1][0] + dist[0], extent[1][1] + dist[1]]);

        return context.intersects(box)
            .filter(isAddressable)
            .map(function(d) {
                var loc = context.projection([
                    (extent[0][0] + extent[1][0]) / 2,
                    (extent[0][1] + extent[1][1]) / 2]),
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

        function change() { event.change(); }

        function close() { return iD.behavior.accept().on('accept', event.close); }

        selection.append('input')
            .property('type', 'text')
            .attr('placeholder', 'Housename')
            .attr('class', 'addr-housename')
            .datum({ 'key': 'addr:housename' })
            .on('blur', change)
            .on('change', change)
            .call(close());

        selection.append('input')
            .property('type', 'text')
            .attr('placeholder', '123')
            .attr('class', 'addr-number')
            .datum({ 'key': 'addr:housenumber' })
            .on('blur', change)
            .on('change', change)
            .call(close());

        var streetwrap = selection.append('span')
            .attr('class', 'input-wrap-position')
            .datum({ 'key': 'addr:street' });

        streetwrap.append('input')
            .property('type', 'text')
            .attr('placeholder', 'Street')
            .attr('class', 'addr-street')
            .on('blur', change)
            .on('change', change);

        selection.append('input')
            .property('type', 'text')
            .attr('placeholder', 'City')
            .attr('class', 'addr-city')
            .datum({ 'key': 'addr:city' })
            .on('blur', change)
            .on('change', change)
            .call(close());

        streetwrap.call(d3.combobox().data(getStreets()));
    }

    address.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return address;
    };

    return d3.rebind(address, event, 'on');
};
