import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import * as countryCoder from '@rapideditor/country-coder';

import { presetManager } from '../../presets';
import { fileFetcher } from '../../core/file_fetcher';
import { geoChooseEdge, geoSphericalDistance, geoPolygonContainsPolygon, geoPointInPolygon } from '../../geo';
import { uiCombobox } from '../combobox';
import { utilArrayUniqBy, utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent, utilTriggerEvent } from '../../util';
import { t } from '../../core/localizer';


export function uiFieldAddress(field, context) {
    var dispatch = d3_dispatch('change');
    var _selection = d3_select(null);
    var _wrap = d3_select(null);
    var addrField = presetManager.field('address');   // needed for placeholder strings

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
        .then(function(d) {
            _addressFormats = d;
            if (!_selection.empty()) {
                _selection.call(address);
            }
        })
        .catch(function() { /* ignore */ });


    function getNear(isAddressable, type, searchRadius, resultProp) {
        var extent = combinedEntityExtent();
        var l = extent.center();
        var box = extent.padByMeters(searchRadius);

        var features = context.history().intersects(box)
            .filter(isAddressable)
            .map(d => {
                let dist = geoSphericalDistance(d.extent(context.graph()).center(), l);

                if (d.geometry(context.graph()) === 'line') {
                    var loc = context.projection([
                        (extent[0][0] + extent[1][0]) / 2,
                        (extent[0][1] + extent[1][1]) / 2
                    ]);
                    var choice = geoChooseEdge(context.graph().childNodes(d), loc, context.projection);
                    dist = geoSphericalDistance(choice.loc, l);
                }

                const value = resultProp && d.tags[resultProp] ? d.tags[resultProp] : d.tags.name;
                let title = value;
                if (type === 'street') {
                    title = `${addrField.t('placeholders.street')}: ${title}`;
                } else if (type === 'place') {
                    title = `${addrField.t('placeholders.place')}: ${title}`;
                }
                return {
                    title,
                    value,
                    dist,
                    type,
                    klass: `address-${type}`
                };
            })
            .sort(function(a, b) {
                return a.dist - b.dist;
            });

        return utilArrayUniqBy(features, 'value');
    }

    function getEnclosing(isAddressable, type, resultProp) {
        var extent = combinedEntityExtent();

        var features = context.history().intersects(extent)
            .filter(isAddressable)
            .map(d => {
                if (d.geometry(context.graph()) !== 'area') {
                    return false;
                }

                const geom = d.asGeoJSON(context.graph()).coordinates[0];
                if (!geoPolygonContainsPolygon(geom, extent.polygon())) {
                    return false;
                }

                const value = resultProp && d.tags[resultProp] ? d.tags[resultProp] : d.tags.name;
                return {
                    title: value,
                    value,
                    dist: 0,
                    geom,
                    type,
                    klass: `address-${type}`
                };
            }).filter(Boolean);

        return utilArrayUniqBy(features, 'value');
    }

    function getNearStreets() {
        function isAddressable(d) {
            return d.tags.highway && d.tags.name && d.type === 'way';
        }

        return getNear(isAddressable, 'street', 200);
    }

    function getNearPlaces() {
        function isAddressable(d) {
            if (d.tags.name) {
                if (d.tags.place) return true;
                if (d.tags.boundary === 'administrative' && d.tags.admin_level > 8) return true;
            }
            return false;
        }

        return getNear(isAddressable, 'place', 200);
    }

    function getNearCities() {
        function isAddressable(d) {
            if (d.tags.name) {
                if (d.tags.boundary === 'administrative' && d.tags.admin_level === '8') return true;
                if (d.tags.border_type === 'city') return true;
                if (d.tags.place === 'city' || d.tags.place === 'town' || d.tags.place === 'village' || d.tags.place === 'hamlet') return true;
            }

            if (d.tags[`${field.key}:city`]) return true;

            return false;
        }

        return getNear(isAddressable, 'city', 200, `${field.key}:city`);
    }

    function getNearPostcodes() {
        const postcodes = []
            .concat(getNearValues('postcode'))
            .concat(getNear(d => d.tags.postal_code, 'postcode', 200, 'postal_code'));
        return utilArrayUniqBy(postcodes, item => item.value);
    }

    function getNearValues(key) {
        const tagKey = `${field.key}:${key}`;

        function hasTag(d) {
            return _entityIDs.indexOf(d.id) === -1 && d.tags[tagKey];
        }

        return getNear(hasTag, key, 200, tagKey);
    }

    function getEnclosingValues(key) {
        const tagKey = `${field.key}:${key}`;

        // 1. areas encompassing the feature that have the address tag
        function hasTag(d) {
            return _entityIDs.indexOf(d.id) === -1 && d.tags[tagKey];
        }
        const enclosingAddresses = getEnclosing(hasTag, key, tagKey);

        // 2. also include addresses from points which are encompassed by
        // the same building area as the current feature
        function isBuilding(d) {
            return _entityIDs.indexOf(d.id) === -1 && d.tags.building && d.tags.building !== 'no';
        }
        const enclosingBuildings = getEnclosing(isBuilding, 'building', 'building').map(d => d.geom);
        function isInNearbyBuilding(d) {
            return hasTag(d) &&
                d.type === 'node' &&
                enclosingBuildings.some(geom =>
                    geoPointInPolygon(d.loc, geom) ||
                    geom.indexOf(d.loc) !== -1
                );
        }
        const nearPointAddresses = getNear(isInNearbyBuilding, key, 100, tagKey);

        return utilArrayUniqBy([
            ...enclosingAddresses,
            ...nearPointAddresses
        ], 'value').sort((a, b) => a.value > b.value ? 1 : -1);
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

        const maybeDropdowns = new Set([
            'housenumber',
            'housename'
        ]);
        const dropdowns = new Set([
            'block_number',
            'city',
            'country',
            'county',
            'district',
            'floor',
            'hamlet',
            'neighbourhood',
            'place',
            'postcode',
            'province',
            'quarter',
            'state',
            'street',
            'street+place',
            'subdistrict',
            'suburb',
            'town',
            ...maybeDropdowns
        ]);

        var widths = addressFormat.widths || {
            housenumber: 1/5, unit: 1/5, street: 1/2, place: 1/2,
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

        var rows = _wrap.selectAll('.addr-row')
            .data(addressFormat.format, function(d) {
                return d.toString();
            });

        rows.exit()
            .remove();

        rows
            .enter()
            .append('div')
            .attr('class', 'addr-row')
            .selectAll('input')
            .data(row)
            .enter()
            .append('input')
            .property('type', 'text')
            .attr('id', d => d.id === 'housenumber' ? field.domId : null)
            .attr('class', function (d) { return 'addr-' + d.id; })
            .call(utilNoAuto)
            .each(addDropdown)
            .call(updatePlaceholder)
            .style('width', function (d) { return d.width * 100 + '%'; });


        function addDropdown(d) {
            if (!dropdowns.has(d.id)) {
                return false;  // not a dropdown
            }

            var nearValues;
            switch (d.id) {
                case 'street':
                    nearValues = getNearStreets;
                break;
                case 'place':
                    nearValues = getNearPlaces;
                break;
                case 'street+place':
                    nearValues = () => []
                        .concat(getNearStreets())
                        .concat(getNearPlaces());
                    d.isAutoStreetPlace = true;
                    d.id = _tags[`${field.key}:place`] ? 'place' : 'street';
                break;
                case 'city':
                    nearValues = getNearCities;
                break;
                case 'postcode':
                    nearValues = getNearPostcodes;
                break;
                case 'housenumber':
                case 'housename':
                    nearValues = getEnclosingValues;
                break;
                default:
                    nearValues = getNearValues;
            }

            if (maybeDropdowns.has(d.id)) {
                const candidates = nearValues(d.id);
                // only add dropdown if there are possible values for the
                // corresponding tag: e.g. only show ▼ caret for
                // housenumber/housename if the feature is actually
                // encompassed by another feature with such an address
                if (candidates.length === 0) return false;
            }

            d3_select(this)
                .call(uiCombobox(context, `address-${d.isAutoStreetPlace ? 'street-place' : d.id}`)
                    .minItems(1)
                    .caseSensitive(true)
                    .fetcher(function(typedValue, callback) {
                        typedValue = typedValue.toLowerCase();
                        callback(nearValues(d.id)
                            .filter(v => v.value.toLowerCase().indexOf(typedValue) !== -1));
                    })
                    .on('accept', function(selected) {
                        if (d.isAutoStreetPlace) {
                            // set subtag depending on selected entry
                            d.id = selected ? selected.type : 'street';
                            utilTriggerEvent(d3_select(this), 'change');
                        }
                    })
                );
        }

        _wrap.selectAll('input')
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());

        if (_tags) updateTags(_tags);
    }


    function address(selection) {
        _selection = selection;

        _wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        _wrap = _wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(_wrap);

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

            _wrap.selectAll('input')
                .each(function (subfield) {
                    var key = field.key + ':' + subfield.id;

                    var value = this.value;
                    if (!onInput) value = context.cleanTagValue(value);

                    // don't override multiple values with blank string
                    if (Array.isArray(_tags[key]) && !value) return;

                    if (subfield.isAutoStreetPlace) {
                        if (subfield.id === 'street') {
                            tags[`${field.key}:place`] = undefined;
                        } else if (subfield.id === 'place') {
                            tags[`${field.key}:street`] = undefined;
                        }
                    }

                    tags[key] = value || undefined;
                });

            Object.keys(tags)
                .filter(k => tags[k])
                .forEach(k => _tags[k] = tags[k]);
            dispatch.call('change', this, tags, onInput);
        };
    }


    function updatePlaceholder(inputSelection) {
        return inputSelection.attr('placeholder', function(subfield) {
            if (_tags && Array.isArray(_tags[field.key + ':' + subfield.id])) {
                return t('inspector.multiple_values');
            }
            if (subfield.isAutoStreetPlace) {
                return `${getLocalPlaceholder('street')} / ${getLocalPlaceholder('place')}`;
            }
            return getLocalPlaceholder(subfield.id);
        });
    }


    function getLocalPlaceholder(key) {
        if (_countryCode) {
            var localkey = key + '!' + _countryCode;
            var tkey = addrField.hasTextForStringId('placeholders.' + localkey) ? localkey : key;
            return addrField.t('placeholders.' + tkey);
        }
    }


    function updateTags(tags) {
        utilGetSetValue(_wrap.selectAll('input'), subfield => {
                var val;
                if (subfield.isAutoStreetPlace) {
                    const streetKey = `${field.key}:street`;
                    const placeKey = `${field.key}:place`;

                    if (tags[streetKey] !== undefined || tags[placeKey] === undefined) {
                        val = tags[streetKey];
                        subfield.id = 'street';
                    } else {
                        val = tags[placeKey];
                        subfield.id = 'place';
                    }
                } else {
                    val = tags[`${field.key}:${subfield.id}`];
                }
                return typeof val === 'string' ? val : '';
            })
            .attr('title', function(subfield) {
                var val = tags[field.key + ':' + subfield.id];
                return (val && Array.isArray(val)) ? val.filter(Boolean).join('\n') : undefined;
            })
            .classed('mixed', function(subfield) {
                return Array.isArray(tags[field.key + ':' + subfield.id]);
            })
            .call(updatePlaceholder);
    }


    function combinedEntityExtent() {
        return _entityIDs && _entityIDs.length && utilTotalExtent(_entityIDs, context.graph());
    }


    address.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        return address;
    };


    address.tags = function(tags) {
        _tags = tags;
        updateTags(tags);
    };


    address.focus = function() {
        var node = _wrap.selectAll('input').node();
        if (node) node.focus();
    };


    return utilRebind(address, dispatch, 'on');
}
