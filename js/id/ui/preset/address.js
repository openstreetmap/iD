iD.ui.preset.address = function(field, context) {

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

        var wrap = selection.append('div')
            .attr('class', 'preset-input-wrap');

        housename = wrap.append('input')
            .property('type', 'text')
            .attr('placeholder', field.t('placeholders.housename'))
            .attr('class', 'addr-housename')
            .attr('id', 'preset-input-' + field.id)
            .on('blur', change)
            .on('change', change)
            .call(close());

        housenumber = wrap.append('input')
            .property('type', 'text')
            .attr('placeholder', field.t('placeholders.number'))
            .attr('class', 'addr-number')
            .on('blur', change)
            .on('change', change)
            .call(close());

        var streetwrap = wrap.append('span')
            .attr('class', 'input-wrap-position');

        street = streetwrap.append('input')
            .property('type', 'text')
            .attr('placeholder', field.t('placeholders.street'))
            .attr('class', 'addr-street')
            .on('blur', change)
            .on('change', change)
            .call(d3.combobox().data(getStreets()));

        city = wrap.append('input')
            .property('type', 'text')
            .attr('placeholder', field.t('placeholders.city'))
            .attr('class', 'addr-city')
            .on('blur', change)
            .on('change', change)
            .call(close());
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
