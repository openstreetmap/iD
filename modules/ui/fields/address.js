import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import * as countryCoder from '@rapideditor/country-coder';

import { presetManager } from '../../presets';
import { fileFetcher } from '../../core/file_fetcher';
import { geoExtent, geoChooseEdge, geoSphericalDistance } from '../../geo';
import { uiCombobox } from '../combobox';
import { utilArrayUniqBy, utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent, utilTriggerEvent } from '../../util';
import { t } from '../../core/localizer';


export function uiFieldAddress(field, context) {
    const dispatch = d3_dispatch('change');
    let _selection = d3_select(null);
    let _wrap = d3_select(null);
    const addrField = presetManager.field('address');   // needed for placeholder strings

    let _entityIDs = [];
    let _tags;
    let _countryCode;
    let _addressFormats = [{
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
        const extent = combinedEntityExtent();
        const l = extent.center();
        const box = geoExtent(l).padByMeters(searchRadius);

        const features = context.history().intersects(box)
            .filter(isAddressable)
            .map(d => {
                let dist = geoSphericalDistance(d.extent(context.graph()).center(), l);

                if (d.geometry(context.graph()) === 'line') {
                    const loc = context.projection([
                        (extent[0][0] + extent[1][0]) / 2,
                        (extent[0][1] + extent[1][1]) / 2
                    ]);
                    const choice = geoChooseEdge(context.graph().childNodes(d), loc, context.projection);
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
                if (d.tags.place === 'city' || d.tags.place === 'town' || d.tags.place === 'village') return true;
            }

            if (d.tags[`${field.key}:city`]) return true;

            return false;
        }

        return getNear(isAddressable, 'city', 200, `${field.key}:city`);
    }

    function getNearPostcodes() {
        return [... new Set([]
            .concat(getNearValues('postcode'))
            .concat(getNear(d => d.tags.postal_code, 'postcode', 200, 'postal_code')))];
    }

    function getNearValues(key) {
        const tagKey = `${field.key}:${key}`;

        function hasTag(d) {
            return _entityIDs.indexOf(d.id) === -1 && d.tags[tagKey];
        }

        return getNear(hasTag, key, 200, tagKey);
    }


    function updateForCountryCode() {

        if (!_countryCode) return;

        let addressFormat;
        for (let i = 0; i < _addressFormats.length; i++) {
            const format = _addressFormats[i];
            if (!format.countryCodes) {
                addressFormat = format;   // choose the default format, keep going
            } else if (format.countryCodes.indexOf(_countryCode) !== -1) {
                addressFormat = format;   // choose the country format, stop here
                break;
            }
        }

        const dropdowns = addressFormat.dropdowns || [
            'city', 'county', 'country', 'district', 'hamlet',
            'neighbourhood', 'place', 'postcode', 'province',
            'quarter', 'state', 'street', 'street+place', 'subdistrict', 'suburb'
        ];

        const widths = addressFormat.widths || {
            housenumber: 1/5, unit: 1/5, street: 1/2, place: 1/2,
            city: 2/3, state: 1/4, postcode: 1/3
        };

        function row(r) {
            // Normalize widths.
            const total = r.reduce(function(sum, key) {
                return sum + (widths[key] || 0.5);
            }, 0);

            return r.map(function(key) {
                return {
                    id: key,
                    width: (widths[key] || 0.5) / total
                };
            });
        }

        const rows = _wrap.selectAll('.addr-row')
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
            .attr('class', function (d) { return 'addr-' + d.id; })
            .call(utilNoAuto)
            .each(addDropdown)
            .call(updatePlaceholder)
            .style('width', function (d) { return d.width * 100 + '%'; });


        function addDropdown(d) {
            if (dropdowns.indexOf(d.id) === -1) return;  // not a dropdown

            let nearValues;
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
                default:
                    nearValues = getNearValues;
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
            .on('blur', change())
            .on('change', change());

        _wrap.selectAll('input:not(.combobox-input)')
            .on('input', change(true));

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

        const extent = combinedEntityExtent();

        if (extent) {
            let countryCode;
            if (context.inIntro()) {
                // localize the address format for the walkthrough
                countryCode = t('intro.graph.countrycode');
            } else {
                const center = extent.center();
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
            const tags = {};

            _wrap.selectAll('input')
                .each(function (subfield) {
                    const key = field.key + ':' + subfield.id;

                    let value = this.value;
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
            const localkey = key + '!' + _countryCode;
            const tkey = addrField.hasTextForStringId('placeholders.' + localkey) ? localkey : key;
            return addrField.t('placeholders.' + tkey);
        }
    }


    function updateTags(tags) {
        utilGetSetValue(_wrap.selectAll('input'), subfield => {
                let val;
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
                const val = tags[field.key + ':' + subfield.id];
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
        const node = _wrap.selectAll('input').node();
        if (node) node.focus();
    };


    return utilRebind(address, dispatch, 'on');
}
