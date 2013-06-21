iD.ui.preset.address = function(field, context) {
    var event = d3.dispatch('change'),
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
        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        // Enter

        var enter = wrap.enter().append('div')
            .attr('class', 'preset-input-wrap');

        enter.append('input')
            .property('type', 'text')
            .attr('placeholder', field.t('placeholders.housename'))
            .attr('class', 'addr-housename')
            .attr('id', 'preset-input-' + field.id);

        enter.append('input')
            .property('type', 'text')
            .attr('placeholder', field.t('placeholders.number'))
            .attr('class', 'addr-number');

        enter.append('input')
            .property('type', 'text')
            .attr('placeholder', field.t('placeholders.street'))
            .attr('class', 'addr-street');

        enter.append('input')
            .property('type', 'text')
            .attr('placeholder', field.t('placeholders.city'))
            .attr('class', 'addr-city');

        enter.append('input')
            .property('type', 'text')
            .attr('placeholder', field.t('placeholders.postcode'))
            .attr('class', 'addr-postcode');

        // Update

        housename = wrap.select('.addr-housename');
        housenumber = wrap.select('.addr-number');
        street = wrap.select('.addr-street');
        city = wrap.select('.addr-city');
        postcode = wrap.select('.addr-postcode');

        wrap.selectAll('input')
            .on('blur', change)
            .on('change', change);

        street
            .call(d3.combobox()
                .fetcher(function(value, __, callback) {
                    callback(getStreets());
                }));
    }

    function change() {
        event.change({
            'addr:housename': housename.value() || undefined,
            'addr:housenumber': housenumber.value() || undefined,
            'addr:street': street.value() || undefined,
            'addr:city': city.value() || undefined,
            'addr:postcode': postcode.value() || undefined
        });
    }

    address.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return address;
    };

    address.tags = function(tags) {
        housename.value(tags['addr:housename'] || '');
        housenumber.value(tags['addr:housenumber'] || '');
        street.value(tags['addr:street'] || '');
        city.value(tags['addr:city'] || '');
        postcode.value(tags['addr:postcode'] || '');
    };

    address.focus = function() {
        housename.node().focus();
    };

    return d3.rebind(address, event, 'on');
};
