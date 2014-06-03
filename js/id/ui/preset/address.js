iD.ui.preset.address = function(field, context) {
    var event = d3.dispatch('init', 'change'),
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

    function getCities() {
        var extent = entity.extent(context.graph()),
            l = extent.center(),
            box = iD.geo.Extent(l).padByMeters(200);

        return context.intersects(box)
            .filter(isAddressable)
            .map(function(d) {
                return {
                    title: d.tags['addr:city'] || d.tags.name,
                    value: d.tags['addr:city'] || d.tags.name,
                    dist: iD.geo.sphericalDistance(d.extent(context.graph()).center(), l)
                };
            }).sort(function(a, b) {
                return a.dist - b.dist;
            });

        function isAddressable(d) {
            if (d.tags.name &&
                (d.tags.admin_level === '8' || d.tags.border_type === 'city'))
                return true;

            if (d.tags.place && d.tags.name && (
                    d.tags.place === 'city' ||
                    d.tags.place === 'town' ||
                    d.tags.place === 'village'))
                return true;

            if (d.tags['addr:city']) return true;

            return false;
        }
    }

    function getPostCodes() {
        var extent = entity.extent(context.graph()),
            l = extent.center(),
            box = iD.geo.Extent(l).padByMeters(200);

        return context.intersects(box)
            .filter(isAddressable)
            .map(function(d) {
                return {
                    title: d.tags['addr:postcode'],
                    value: d.tags['addr:postcode'],
                    dist: iD.geo.sphericalDistance(d.extent(context.graph()).center(), l)
                };
            }).sort(function(a, b) {
                return a.dist - b.dist;
            });

        function isAddressable(d) {
            return d.tags['addr:postcode'];
        }
    }

    function address(selection) {
        var wrap = selection.selectAll('.preset-input-wrap').data([0]),
            center = entity.extent(context.graph()).center(),
            countryCode,
            country,
            addressFormat;

        /*
        country = _.find(iD.data.countries.features, function(f) {
            return iD.geo.pointInFeature(center, f);
        });

        if (country)
            countryCode = country.properties.countryCode;
        */

        // Enter

        var enter = wrap.enter().append('div')
            .attr('class', 'preset-input-wrap');

        d3.json('http://nominatim.openstreetmap.org/reverse?format=json&lon=' + center[0] + '&lat=' + center[1], function (err, result) {
            if (result && result.address && result.address.country_code)
                countryCode = result.address.country_code;

            addressFormat = _.find(iD.data.addressFormats, function (a) {
                return a && a.countryCodes && _.contains(a.countryCodes, countryCode);
            }) || _.first(iD.data.addressFormats);

            enter.selectAll('div')
                .data(addressFormat.format)
                .enter()
                .append('div')
                .attr('class', 'addr-row')
                .selectAll('input')
                .data(function (d) { return d; })
                .enter()
                .append('input')
                .property('type', 'text')
                .attr('placeholder', function (d) { return field.t('placeholders.' + d); })
                .attr('class', function (d) { return 'addr-column addr-' + d; });

            // Update

            housenumber = wrap.select('.addr-number');
            street = wrap.select('.addr-street');
            city = wrap.select('.addr-city');
            postcode = wrap.select('.addr-postcode');

            street
                .call(d3.combobox()
                    .fetcher(function(value, callback) {
                        callback(getStreets());
                    }));

            city
                .call(d3.combobox()
                    .fetcher(function(value, callback) {
                        callback(getCities());
                    }));

            postcode
                .call(d3.combobox()
                    .fetcher(function(value, callback) {
                        callback(getPostCodes());
                    }));

            wrap.selectAll('input')
                .on('blur', change)
                .on('change', change);

            event.init();
        });
    }

    function change() {
        event.change({
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
        event.on('init', function () {
            housenumber.value(tags['addr:housenumber'] || '');
            street.value(tags['addr:street'] || '');
            city.value(tags['addr:city'] || '');
            postcode.value(tags['addr:postcode'] || '');
        });
    };

    address.focus = function() {
        housenumber.node().focus();
    };

    return d3.rebind(address, event, 'on');
};
