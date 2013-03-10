iD.ui.preset.address = function(form, context) {

    var event = d3.dispatch('change', 'close'),
        housename,
        housenumber,
        street,
        city,
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

        function close() { return iD.behavior.accept().on('accept', event.close); }

        housename = selection.append('input')
            .property('type', 'text')
            .attr('placeholder', 'Housename')
            .attr('class', 'addr-housename')
            .on('blur', change)
            .on('change', change)
            .call(close());

        housenumber = selection.append('input')
            .property('type', 'text')
            .attr('placeholder', '123')
            .attr('class', 'addr-number')
            .on('blur', change)
            .on('change', change)
            .call(close());

        var streetwrap = selection.append('span')
            .attr('class', 'input-wrap-position');

        street = streetwrap.append('input')
            .property('type', 'text')
            .attr('placeholder', 'Street')
            .attr('class', 'addr-street')
            .on('blur', change)
            .on('change', change);

        city = selection.append('input')
            .property('type', 'text')
            .attr('placeholder', 'City')
            .attr('class', 'addr-city')
            .on('blur', change)
            .on('change', change)
            .call(close());

        streetwrap.call(d3.combobox().data(getStreets()));
    }

    function change() {
        event.change({
            'addr:housename': housename.property('value'),
            'addr:housenumber': housenumber.property('value'),
            'addr:street': street.property('value'),
            'addr:city': city.property('value')
        });
    }

    address.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return address;
    };

    address.tags = function(tags) {
        housename.property('value', tags['addr:housename'] || '');
        housenumber.property('value', tags['addr:housenumber'] || '');
        street.property('value', tags['addr:street'] || '');
        city.property('value', tags['addr:city'] || '');
        return address;
    };

    return d3.rebind(address, event, 'on');
};
