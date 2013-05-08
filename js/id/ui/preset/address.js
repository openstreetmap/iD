iD.ui.preset.address = function(field, context) {

    var event = d3.dispatch('change', 'close'),
        housename,
        housenumber,
        street,
        city,
        postcode,
        entity;

    function getStreets() {

        var extent = entity.extent(context.graph()),
            l = extent.center(),
            box = iD.geo.Extent(l).padByMeters(200);

        return context.intersects(box)
            .filter(isAddressable)
            .map(function(d) {
                var loc = context.projection([
                    (extent[0][0] + extent[1][0]) / 2,
                    (extent[0][1] + extent[1][1]) / 2]),
                    choice = iD.geo.chooseEdge(context.childNodes(d), loc, context.projection);
                return {
                    title: d.tags.name,
                    value: d.tags.name,
                    dist: choice.distance
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

        street = wrap.append('input')
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

        postcode = wrap.append('input')
            .property('type', 'text')
            .attr('placeholder', field.t('placeholders.postcode'))
            .attr('class', 'addr-postcode')
            .on('blur', change)
            .on('change', change)
            .call(close());
    }

    function change() {
        event.change({
            'addr:housename': housename.property('value'),
            'addr:housenumber': housenumber.property('value'),
            'addr:street': street.property('value'),
            'addr:city': city.property('value'),
            'addr:postcode': postcode.property('value')
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
        postcode.property('value', tags['addr:postcode'] || '');
        return address;
    };

    address.focus = function() {
        housename.node().focus();
    };

    return d3.rebind(address, event, 'on');
};
