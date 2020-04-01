import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import * as countryCoder from '@ideditor/country-coder';

import { presetManager } from '../../presets';
import { fileFetcher } from '../../core/file_fetcher';
import { geoExtent, geoChooseEdge, geoSphericalDistance } from '../../geo';
import { uiCombobox } from '../combobox';
import { utilArrayUniqBy, utilGetSetValue, utilNoAuto, utilRebind } from '../../util';
import { t } from '../../core/localizer';


export function uiFieldAddress(field, context) {
    var dispatch = d3_dispatch('init', 'change');
    var wrap = d3_select(null);
    var addrField = presetManager.field('address');   // needed for placeholder strings

    var _isInitialized = false;
    var _entityIDs = [];
    var _tags;
    var _countryCode;
    var _addressFormats = [{
        format: [
          ['housenumber', 'street'],
          ['city', 'postcode']
        ]
      }];

    fileFetcher.get('address_formats')
        .then(function(d) { _addressFormats = d; })
        .catch(function() { /* ignore */ });


    function getNearStreets() {
        var extent = combinedEntityExtent();
        var l = extent.center();
        var box = geoExtent(l).padByMeters(200);

        var streets = context.intersects(box)
            .filter(isAddressable)
            .map(function(d) {
                var loc = context.projection([
                    (extent[0][0] + extent[1][0]) / 2,
                    (extent[0][1] + extent[1][1]) / 2
                ]);
                var choice = geoChooseEdge(context.graph().childNodes(d), loc, context.projection);

                return {
                    title: d.tags.name,
                    value: d.tags.name,
                    dist: choice.distance
                };
            })
            .sort(function(a, b) {
                return a.dist - b.dist;
            });

        return utilArrayUniqBy(streets, 'value');

        function isAddressable(d) {
            return d.tags.highway && d.tags.name && d.type === 'way';
        }
    }


    function getNearCities() {
        var extent = combinedEntityExtent();
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

        return utilArrayUniqBy(cities, 'value');


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
        var extent = combinedEntityExtent();
        var l = extent.center();
        var box = geoExtent(l).padByMeters(200);

        var results = context.intersects(box)
            .filter(function hasTag(d) { return _entityIDs.indexOf(d.id) === -1 && d.tags[key]; })
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

        return utilArrayUniqBy(results, 'value');
    }


    function updateForCountryCode() {

        if (!_countryCode) return;

        var addressFormat;
        for (var i = 0; i < _addressFormats.length; i++) {
            var format = _addressFormats[i];
            if (!format.countryCodes) {
                addressFormat = format;   // choose the default format, keep going
            } else if (format.countryCodes.indexOf(_countryCode) !== -1) {
                addressFormat = format;   // choose the country format, stop here
                break;
            }
        }

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
            var total = r.reduce(function(sum, key) {
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
            .call(updatePlaceholder)
            .attr('maxlength', context.maxCharsForTagValue())
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
                    .caseSensitive(true)
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

        var extent = combinedEntityExtent();

        if (extent) {
            var countryCode;
            if (context.inIntro()) {
                // localize the address format for the walkthrough
                countryCode = t('intro.graph.countrycode');
            } else {
                var center = extent.center();
                countryCode = countryCoder.iso1A2Code(center);
            }
            if (countryCode) {
                _countryCode = countryCode.toLowerCase();
                updateForCountryCode();
            }
        }
    }


    function change(onInput) {
        return function() {
            var tags = {};

            wrap.selectAll('input')
                .each(function (subfield) {
                    var key = field.key + ':' + subfield.id;

                    // don't override multiple values with blank string
                    if (Array.isArray(_tags[key]) && !this.value) return;

                    tags[key] = this.value || undefined;
                });

            dispatch.call('change', this, tags, onInput);
        };
    }

    function updatePlaceholder(inputSelection) {
        return inputSelection.attr('placeholder', function(subfield) {
            if (_tags && Array.isArray(_tags[field.key + ':' + subfield.id])) {
                return t('inspector.multiple_values');
            }
            if (_countryCode) {
                var localkey = subfield.id + '!' + _countryCode;
                var tkey = addrField.strings.placeholders[localkey] ? localkey : subfield.id;
                return addrField.t('placeholders.' + tkey);
            }
        });
    }


    function updateTags(tags) {
        utilGetSetValue(wrap.selectAll('input'), function (subfield) {
                var val = tags[field.key + ':' + subfield.id];
                return typeof val === 'string' ? val : '';
            })
            .attr('title', function(subfield) {
                var val = tags[field.key + ':' + subfield.id];
                return val && Array.isArray(val) && val.filter(Boolean).join('\n');
            })
            .classed('mixed', function(subfield) {
                return Array.isArray(tags[field.key + ':' + subfield.id]);
            })
            .call(updatePlaceholder);
    }


    function combinedEntityExtent() {
        return _entityIDs && _entityIDs.length && _entityIDs.reduce(function(extent, entityID) {
            var entity = context.graph().entity(entityID);
            return extent.extend(entity.extent(context.graph()));
        }, geoExtent());
    }


    address.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        return address;
    };


    address.tags = function(tags) {
        _tags = tags;
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
