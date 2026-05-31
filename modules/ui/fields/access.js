import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { getAddableAccessKeys, getEffectiveAccessKeys } from './access_keys';
import { uiCombobox } from '../combobox';
import { utilGetSetValue, utilNoAuto, utilRebind } from '../../util';
import { t } from '../../core/localizer';
import { formatTag } from './tag_title';

export function uiFieldAccess(field, context) {
    const dispatch = d3_dispatch('change');
    let items = d3_select(null);
    let _list = d3_select(null);
    let _wrap = d3_select(null);
    let _addKeyInput = d3_select(null);
    let _addKeyCombo;
    /** @type {string[]} */
    let _addedKeys = [];
    /** @type {Record<string, string|string[]>} */
    let _tags = {};

    function addKeyOptions(currentKeys) {
        return getAddableAccessKeys(currentKeys).map(function(key) {
            const label = field.t('types.' + key, { default: key });
            return {
                key: key,
                value: key,
                title: key,
                terms: [key, label],
                display: function(selection) {
                    selection.text(label);
                }
            };
        });
    }


    function updateAddRow(currentKeys) {
        if (!_list.size()) return;

        const addRow = _list.select('li.preset-access-add');
        const addable = getAddableAccessKeys(currentKeys);

        if (addable.length === 0) {
            addRow.style('display', 'none');
            return;
        }

        addRow.style('display', null);
        if (_addKeyCombo) {
            _addKeyCombo.data(addKeyOptions(currentKeys));
        }

        // Keep the add row last even after the keyed rows rebind.
        const node = addRow.node();
        if (node && node.parentNode) {
            node.parentNode.appendChild(node);
        }
    }


    function addAccessKey(key) {
        if (!key || field.effectiveKeys.indexOf(key) !== -1) return;

        _addedKeys.push(key);
        utilGetSetValue(_addKeyInput, '');
        updateAccessUI(_tags);

        const input = _list.select('.preset-access-' + key + ' .preset-input-access');
        if (input.node()) {
            input.node().focus();
        }
    }


    function accessKeyForInput(input) {
        const li = input.closest('li.labeled-input:not(.preset-access-add)');
        return li && d3_select(li).datum();
    }


    function accessChange(event) {
        const key = accessKeyForInput(this);
        if (!key) return;

        const tag = {};
        const value = context.cleanTagValue(utilGetSetValue(d3_select(this)));

        if (!value && typeof _tags[key] !== 'string') return;

        tag[key] = value || undefined;

        // Combobox accept triggers `change` synchronously; defer dispatch so the
        // inspector re-render does not replace the input before accept completes.
        if (event.type === 'change') {
            const input = this;
            window.setTimeout(function() {
                dispatch.call('change', input, tag);
            }, 0);
        } else {
            dispatch.call('change', this, tag);
        }
    }


    function bindAccessInputs() {
        _wrap.selectAll('.preset-input-access')
            .on('change.access-field', accessChange)
            .on('blur.access-field', accessChange);
    }


    function applyInputValues(tags) {
        items.selectAll('.preset-input-access')
            .data(function(d) { return [d]; })
            .call(utilGetSetValue, function(d) {
                return typeof tags[d] === 'string' ? tags[d] : '';
            })
            .classed('mixed', function(d) {
                return tags[d] && Array.isArray(tags[d])
                    || new Set(getAllPlaceholders(tags, d)).size > 1;
            })
            .attr('title', function(d) {
                return tags[d] && Array.isArray(tags[d]) && tags[d].filter(Boolean).join('\n');
            })
            .attr('placeholder', function(d) {
                let placeholders = getAllPlaceholders(tags, d);
                if (new Set(placeholders).size === 1) {
                    // all objects have the same implied access
                    return placeholders[0];
                } else {
                    return t('inspector.multiple_values');
                }
            });
    }


    function updateAccessUI(tags) {
        _tags = tags;

        _addedKeys = _addedKeys.filter(function(key) {
            return getEffectiveAccessKeys(Object.keys(tags)).indexOf(key) === -1;
        });

        const effectiveKeys = getEffectiveAccessKeys(Object.keys(tags), _addedKeys);
        field.effectiveKeys = effectiveKeys;
        updateList(effectiveKeys);
        updateAddRow(effectiveKeys);
        applyInputValues(tags);
    }


    function updateList(keys) {
        if (!_list.size()) return;
        items = _list.selectAll('li.labeled-input:not(.preset-access-add)')
            .data(keys, function(d) { return d; });

        items.exit().remove();

        const enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'labeled-input preset-access-' + d; });

        enter
            .append('div')
            .attr('class', 'label preset-label-access')
            .attr('for', function(d) { return 'preset-input-access-' + d; })
            .each(function(d) {
                d3_select(this).call(field.t.append('types.' + d, { default: d }));
            });

        enter
            .append('div')
            .attr('class', 'preset-input-access-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', function(d) { return 'preset-input-access preset-input-access-' + d; })
            .call(utilNoAuto)
            .each(function(d) {
                d3_select(this)
                    .call(uiCombobox(context, 'access-' + d)
                        .data(access.options(d))
                    , d3_select(this.parentNode.parentNode));
            });

        items = items.merge(enter);

        bindAccessInputs();
    }

    function access(selection) {
        const wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        _wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);

        const list = _wrap.selectAll('ul')
            .data([0]);

        _list = list.enter()
            .append('ul')
            .attr('class', 'rows')
            .merge(list)
            .attr('class', 'rows');

        _list.selectAll('li.preset-access-add')
            .data([0])
            .enter()
            .append('li')
            .attr('class', 'labeled-input preset-access-add')
            .append('div')
            .attr('class', 'label preset-label-access')
            .append('input')
            .property('type', 'text')
            .attr('class', 'preset-input-access-add-key')
            .attr('placeholder', t('fields.access.add_type'))
            .call(utilNoAuto);

        _addKeyInput = _list.select('.preset-access-add input.preset-input-access-add-key');
        _addKeyCombo = uiCombobox(context, 'access-add-key')
            .on('accept', function(d) { addAccessKey(d.value); });
        _addKeyInput.call(_addKeyCombo, _list.select('li.preset-access-add'));

        updateAccessUI({});
    }


    access.options = function(type) {
        let options = [
            'yes',
            'no',
            'designated',
            'permissive',
            'destination',
            'customers',
            'private',
            'permit',
            'unknown'
        ];

        if (type === 'access') {
            options = options.filter(function(v) { return v !== 'yes' && v !== 'designated'; });
        }
        if (type === 'bicycle') {
            options.splice(options.length - 4, 0, 'dismount');
        }

        const stringsField = field.resolveReference('stringsCrossReference');
        return options.map(function(option) {
            return {
                title: formatTag(type, option),
                description: stringsField.hasTextForStringId('options.' + option + '.description')
                    ? stringsField.t('options.' + option + '.description') : undefined,
                value: option
            };
        });
    };

    const placeholdersByTag = {
        highway: {
            footway: {
                foot: 'designated',
                motor_vehicle: 'no'
            },
            steps: {
                foot: 'yes',
                motor_vehicle: 'no',
                bicycle: 'no',
                horse: 'no'
            },
            ladder: {
                foot: 'yes',
                motor_vehicle: 'no',
                bicycle: 'no',
                horse: 'no'
            },
            pedestrian: {
                foot: 'yes',
                motor_vehicle: 'no'
            },
            living_street: {
                foot: 'yes'
            },
            cycleway: {
                motor_vehicle: 'no',
                bicycle: 'designated'
            },
            bridleway: {
                motor_vehicle: 'no',
                horse: 'designated'
            },
            path: {
                foot: 'yes',
                motor_vehicle: 'no',
                bicycle: 'yes',
                horse: 'yes'
            },
            motorway: {
                foot: 'no',
                motor_vehicle: 'yes',
                bicycle: 'no',
                horse: 'no'
            },
            trunk: {
                motor_vehicle: 'yes'
            },
            primary: {
                foot: 'yes',
                motor_vehicle: 'yes',
                bicycle: 'yes',
                horse: 'yes'
            },
            secondary: {
                foot: 'yes',
                motor_vehicle: 'yes',
                bicycle: 'yes',
                horse: 'yes'
            },
            tertiary: {
                foot: 'yes',
                motor_vehicle: 'yes',
                bicycle: 'yes',
                horse: 'yes'
            },
            residential: {
                foot: 'yes',
                motor_vehicle: 'yes',
                bicycle: 'yes',
                horse: 'yes'
            },
            unclassified: {
                foot: 'yes',
                motor_vehicle: 'yes',
                bicycle: 'yes',
                horse: 'yes'
            },
            service: {
                foot: 'yes',
                motor_vehicle: 'yes',
                bicycle: 'yes',
                horse: 'yes'
            },
            motorway_link: {
                foot: 'no',
                motor_vehicle: 'yes',
                bicycle: 'no',
                horse: 'no'
            },
            trunk_link: {
                motor_vehicle: 'yes'
            },
            primary_link: {
                foot: 'yes',
                motor_vehicle: 'yes',
                bicycle: 'yes',
                horse: 'yes'
            },
            secondary_link: {
                foot: 'yes',
                motor_vehicle: 'yes',
                bicycle: 'yes',
                horse: 'yes'
            },
            tertiary_link: {
                foot: 'yes',
                motor_vehicle: 'yes',
                bicycle: 'yes',
                horse: 'yes'
            },
            construction: {
                access: 'no'
            },
            busway: {
                access: 'no',
                bus: 'designated',
                emergency: 'yes',
            }
        },
        barrier: {
            bollard: {
                access: 'no',
                bicycle: 'yes',
                foot: 'yes'
            },
            bus_trap: {
                motor_vehicle: 'no',
                psv: 'yes',
                foot: 'yes',
                bicycle: 'yes'
            },
            city_wall: {
                access: 'no'
            },
            coupure: {
                access: 'yes'
            },
            cycle_barrier: {
                motor_vehicle: 'no'
            },
            ditch: {
                access: 'no'
            },
            entrance: {
                access: 'yes'
            },
            fence: {
                access: 'no'
            },
            hedge: {
                access: 'no'
            },
            jersey_barrier: {
                access: 'no'
            },
            motorcycle_barrier: {
                motor_vehicle: 'no'
            },
            rail_guard: {
                access: 'no'
            }
        }
    };


    /** @param {Record<string, string|string[]>} tags @param {string} accessField @returns {string|string[]} */
    function getPlaceholder(tags, accessField) {
        if (tags[accessField]) {
            return tags[accessField];
        }
        // implied access
        // motorroad: https://wiki.openstreetmap.org/wiki/OSM_tags_for_routing/Access_restrictions
        if (tags.motorroad === 'yes' && (accessField === 'foot' || accessField === 'bicycle' || accessField === 'horse')) {
            return 'no';
        }
        // inherited access
        if (tags.vehicle && (accessField === 'bicycle' || accessField === 'motor_vehicle')) {
            return tags.vehicle;
        }
        if (tags.access) {
            return tags.access;
        }
        // default access by road/barrier type
        for (const key in placeholdersByTag) {
            if (tags[key]) {
                if (placeholdersByTag[key][tags[key]] &&
                    placeholdersByTag[key][tags[key]][accessField]) {
                    return placeholdersByTag[key][tags[key]][accessField];
                }
            }
        }
        if (accessField === 'access' && !tags.barrier) {
            return 'yes';
        }
        return field.placeholder();
    }


    /** @param {Record<string, string|string[]>} tags @param {string} accessField @returns {(string|string[])[]} */
    function getAllPlaceholders(tags, accessField) {
        let allTags = tags[Symbol.for('allTags')];
        if (allTags && allTags.length > 1) {
            // multi selection
            const placeholders = [];
            allTags.forEach(function(tags) {
                placeholders.push(getPlaceholder(tags, accessField));
            });
            return placeholders;
        } else {
            return [getPlaceholder(tags, accessField)];
        }
    }


    /** @param {Record<string, string|string[]>} tags - Entity tags (values may be arrays when multiple entities selected). */
    access.tags = function(tags) {
        updateAccessUI(tags);
    };


    access.focus = function() {
        items.selectAll('.preset-input-access')
            .node().focus();
    };

    return utilRebind(access, dispatch, 'on');
}
