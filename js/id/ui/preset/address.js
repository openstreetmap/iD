iD.ui.preset.address = function(field, context) {
    var event = d3.dispatch('init', 'change'),
        wrap,
        entity,
        isInitialized;

    var widths = {
        housenumber: 1/3,
        street: 2/3,
        city: 2/3,
        state: 1/4,
        postcode: 1/3
    };

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
        isInitialized = false;
        
        selection.selectAll('.preset-input-wrap')
            .remove();

        var center = entity.extent(context.graph()).center(),
            addressFormat;

        // Enter

        wrap = selection.append('div')
            .attr('class', 'preset-input-wrap');

        iD.countryCode().search(center, function (err, countryCode) {
            addressFormat = _.find(iD.data.addressFormats, function (a) {
                return a && a.countryCodes && _.contains(a.countryCodes, countryCode);
            }) || _.first(iD.data.addressFormats);

            function row(r) {
                // Normalize widths.
                var total = _.reduce(r, function(sum, field) {
                    return sum + (widths[field] || 0.5);
                }, 0);

                return r.map(function (field) {
                    return {
                        id: field,
                        width: (widths[field] || 0.5) / total
                    };
                });
            }

            wrap.selectAll('div')
                .data(addressFormat.format)
                .enter()
                .append('div')
                .attr('class', 'addr-row')
                .selectAll('input')
                .data(row)
                .enter()
                .append('input')
                .property('type', 'text')
                .attr('placeholder', function (d) { return field.t('placeholders.' + d.id); })
                .attr('class', function (d) { return 'addr-' + d.id; })
                .style('width', function (d) { return d.width * 100 + '%'; });

            // Update

            wrap.selectAll('.addr-street')
                .call(d3.combobox()
                    .fetcher(function(value, callback) {
                        callback(getStreets());
                    }));

            wrap.selectAll('.addr-city')
                .call(d3.combobox()
                    .fetcher(function(value, callback) {
                        callback(getCities());
                    }));

            wrap.selectAll('.addr-postcode')
                .call(d3.combobox()
                    .fetcher(function(value, callback) {
                        callback(getPostCodes());
                    }));

            wrap.selectAll('input')
                .on('blur', change)
                .on('change', change);

            event.init();
            isInitialized = true;
        });
    }

    function change() {
        var tags = {};

        wrap.selectAll('input')
            .each(function (field) {
                tags['addr:' + field.id] = this.value || undefined;
            });

        event.change(tags);
    }

    function updateTags(tags) {
        wrap.selectAll('input')
            .value(function (field) {
                return tags['addr:' + field.id] || '';
            });
    }

    address.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return address;
    };

    address.tags = function(tags) {
        if (isInitialized) {
            updateTags(tags);
        } else {
            event.on('init', function () {
                updateTags(tags);
            });
        }
    };

    address.focus = function() {
        var node = wrap.selectAll('input').node();
        if (node) node.focus();
    };

    return d3.rebind(address, event, 'on');
};
