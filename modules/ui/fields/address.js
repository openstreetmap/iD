import _find from 'lodash-es/find';
import _includes from 'lodash-es/includes';
import _reduce from 'lodash-es/reduce';
import _uniqBy from 'lodash-es/uniqBy';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { dataAddressFormats } from '../../../data';
import { geoExtent, geoChooseEdge, geoSphericalDistance } from '../../geo';
import { services } from '../../services';
import { uiCombobox } from '../index';
import { utilGetSetValue, utilNoAuto, utilRebind } from '../../util';


export function uiFieldAddress(field, context) {
    var dispatch = d3_dispatch('init', 'change');
    var nominatim = services.geocoder;
    var wrap = d3_select(null);
    var _isInitialized = false;
    var _entity;

    function getNearStreets() {
        var extent = _entity.extent(context.graph());
        var l = extent.center();
        var box = geoExtent(l).padByMeters(200);

        var streets = context.intersects(box)
            .filter(isAddressable)
            .map(function(d) {
                var loc = context.projection([
                    (extent[0][0] + extent[1][0]) / 2,
                    (extent[0][1] + extent[1][1]) / 2
                ]);
                var choice = geoChooseEdge(context.childNodes(d), loc, context.projection);

                return {
                    title: d.tags.name,
                    value: d.tags.name,
                    dist: choice.distance
                };
            })
            .sort(function(a, b) {
                return a.dist - b.dist;
            });

        return _uniqBy(streets, 'value');

        function isAddressable(d) {
            return d.tags.highway && d.tags.name && d.type === 'way';
        }
    }


    function getNearCities() {
        var extent = _entity.extent(context.graph());
        var l = extent.center();
        var box = geoExtent(l).padByMeters(200);

        var cities = context.intersects(box)
            .filter(isAddressable)
            .map(function(d) {
                return {
                    title: d.tags['addr:city'] || d.tags.name,
                    value: d.tags['addr:city'] || d.tags.name,
                    dist: geoSphericalDistance(d.extent(context.graph()).center(), l)
                };
            })
            .sort(function(a, b) {
                return a.dist - b.dist;
            });

        return _uniqBy(cities, 'value');


        function isAddressable(d) {
            if (d.tags.name) {
                if (d.tags.admin_level === '8' && d.tags.boundary === 'administrative')
                    return true;
                if (d.tags.border_type === 'city')
                    return true;
                if (d.tags.place === 'city' || d.tags.place === 'town' || d.tags.place === 'village')
                    return true;
            }

            if (d.tags['addr:city'])
                return true;

            return false;
        }
    }

    function getNearValues(key) {
        var extent = _entity.extent(context.graph());
        var l = extent.center();
        var box = geoExtent(l).padByMeters(200);

        var results = context.intersects(box)
            .filter(function hasTag(d) { return d.tags[key]; })
            .map(function(d) {
                return {
                    title: d.tags[key],
                    value: d.tags[key],
                    dist: geoSphericalDistance(d.extent(context.graph()).center(), l)
                };
            })
            .sort(function(a, b) {
                return a.dist - b.dist;
            });

        return _uniqBy(results, 'value');
    }


    function countryCallback(err, countryCode) {
        if (err) return;

        var addressFormat = _find(dataAddressFormats, function (a) {
            return a && a.countryCodes && _includes(a.countryCodes, countryCode.toLowerCase());
        }) || dataAddressFormats[0];

        var dropdowns = addressFormat.dropdowns || [
            'city', 'county', 'country', 'district', 'hamlet',
            'neighbourhood', 'place', 'postcode', 'province',
            'quarter', 'state', 'street', 'subdistrict', 'suburb'
        ];

        var widths = addressFormat.widths || {
            housenumber: 1/3, street: 2/3,
            city: 2/3, state: 1/4, postcode: 1/3
        };

        function row(r) {
            // Normalize widths.
            var total = _reduce(r, function(sum, key) {
                return sum + (widths[key] || 0.5);
            }, 0);

            return r.map(function(key) {
                return {
                    id: key,
                    width: (widths[key] || 0.5) / total
                };
            });
        }

        wrap.selectAll('.addr-row')
            .data(addressFormat.format)
            .enter()
            .append('div')
            .attr('class', 'addr-row')
            .selectAll('input')
            .data(row)
            .enter()
            .append('input')
            .property('type', 'text')
            .attr('placeholder', function (d) {
                var localkey = d.id + '!' + countryCode.toLowerCase();
                var tkey = field.strings.placeholders[localkey] ? localkey : d.id;
                return field.t('placeholders.' + tkey);
            })
            .attr('class', function (d) { return 'addr-' + d.id; })
            .call(utilNoAuto)
            .each(addDropdown)
            .style('width', function (d) { return d.width * 100 + '%'; });


        function addDropdown(d) {
            if (dropdowns.indexOf(d.id) === -1) return;  // not a dropdown

            var nearValues = (d.id === 'street') ? getNearStreets
                : (d.id === 'city') ? getNearCities
                : getNearValues;

            d3_select(this)
                .call(uiCombobox(context, 'address-' + d.id)
                    .minItems(1)
                    .fetcher(function(value, callback) {
                        callback(nearValues('addr:' + d.id));
                    })
                );
        }

        wrap.selectAll('input')
            .on('blur', change())
            .on('change', change());

        wrap.selectAll('input:not(.combobox-input)')
            .on('input', change(true));

        dispatch.call('init');
        _isInitialized = true;
    }


    function address(selection) {
        _isInitialized = false;

        wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);

        if (nominatim && _entity) {
            var center = _entity.extent(context.graph()).center();
            nominatim.countryCode(center, countryCallback);
        }
    }


    function change(onInput) {
        return function() {
            var tags = {};

            wrap.selectAll('input')
                .each(function (field) {
                    tags['addr:' + field.id] = this.value || undefined;
                });

            dispatch.call('change', this, tags, onInput);
        };
    }


    function updateTags(tags) {
        utilGetSetValue(wrap.selectAll('input'), function (field) {
            return tags['addr:' + field.id] || '';
        });
    }


    address.entity = function(val) {
        if (!arguments.length) return _entity;
        _entity = val;
        return address;
    };


    address.tags = function(tags) {
        if (_isInitialized) {
            updateTags(tags);
        } else {
            dispatch.on('init', function () {
                dispatch.on('init', null);
                updateTags(tags);
            });
        }
    };


    address.focus = function() {
        var node = wrap.selectAll('input').node();
        if (node) node.focus();
    };


    return utilRebind(address, dispatch, 'on');
}
