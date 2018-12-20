import _clone from 'lodash-es/clone';
import _extend from 'lodash-es/extend';
import _some from 'lodash-es/some';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { textDirection } from '../util/locale';
import { svgIcon } from '../svg';
import { uiFieldHelp } from './field_help';
import { uiFields } from './fields';
import { uiTagReference } from './tag_reference';
import { utilRebind } from '../util';


export function uiField(context, presetField, entity, options) {
    options = _extend({
        show: true,
        wrap: true,
        remove: true,
        revert: true,
        info: true
    }, options);

    var dispatch = d3_dispatch('change');
    var field = _clone(presetField);
    var _show = options.show;
    var _state = '';
    var _tags = {};

    field.keys = field.keys || [field.key];

    // only create the fields that are actually being shown
    if (_show && !field.impl) {
        createField();
    }

    // Creates the field.. This is done lazily,
    // once we know that the field will be shown.
    function createField() {
        field.impl = uiFields[field.type](field, context)
            .on('change', function(t, onInput) {
                dispatch.call('change', field, t, onInput);
            });

        if (entity) {
            field.entityID = entity.id;
            // if this field cares about the entity, pass it along
            if (field.impl.entity) {
                field.impl.entity(entity);
            }
        }
    }


    function isModified() {
        if (!entity) return false;
        var original = context.graph().base().entities[entity.id];
        return _some(field.keys, function(key) {
            return original ? _tags[key] !== original.tags[key] : _tags[key];
        });
    }


    function isPresent() {
        return _some(field.keys, function(key) {
            return _tags[key] !== undefined;
        });
    }


    function revert(d) {
        d3_event.stopPropagation();
        d3_event.preventDefault();
        if (!entity) return false;

        var original = context.graph().base().entities[entity.id];
        var t = {};
        d.keys.forEach(function(key) {
            t[key] = original ? original.tags[key] : undefined;
        });

        dispatch.call('change', d, t);
    }


    function remove(d) {
        d3_event.stopPropagation();
        d3_event.preventDefault();

        var t = {};
        d.keys.forEach(function(key) {
            t[key] = undefined;
        });

        dispatch.call('change', d, t);
    }


    field.render = function(selection) {
        var container = selection.selectAll('.form-field')
            .data([field]);

        // Enter
        var enter = container.enter()
            .append('div')
            .attr('class', function(d) { return 'form-field form-field-' + d.safeid; })
            .classed('nowrap', !options.wrap);

        if (options.wrap) {
            var label = enter
                .append('label')
                .attr('class', 'form-field-label')
                .attr('for', function(d) { return 'preset-input-' + d.safeid; });

            label
                .append('span')
                .attr('class', 'label-text')
                .text(function(d) { return d.label(); });

            if (options.remove) {
                label
                    .append('button')
                    .attr('class', 'remove-icon')
                    .attr('title', t('icons.remove'))
                    .attr('tabindex', -1)
                    .call(svgIcon('#iD-operation-delete'));
            }

            if (options.revert) {
                label
                    .append('button')
                    .attr('class', 'modified-icon')
                    .attr('title', t('icons.undo'))
                    .attr('tabindex', -1)
                    .call(svgIcon((textDirection === 'rtl') ? '#iD-icon-redo' : '#iD-icon-undo'));
            }
        }


        // Update
        container = container
            .merge(enter);

        container.select('.form-field-label > .remove-icon')  // propagate bound data
            .on('click', remove);

        container.select('.form-field-label > .modified-icon')  // propagate bound data
            .on('click', revert);

        container
            .classed('modified', isModified())
            .classed('present', isPresent())
            .each(function(d) {
                if (!d.impl) {
                    createField();
                }

                var reference, help;

                // instantiate field help
                if (options.wrap && field.type === 'restrictions') {
                    help = uiFieldHelp(context, 'restrictions');
                }

                // instantiate tag reference
                if (options.wrap && options.info) {
                    var referenceKey = d.key;
                    if (d.type === 'multiCombo') {   // lookup key without the trailing ':'
                        referenceKey = referenceKey.replace(/:$/, '');
                    }

                    reference = uiTagReference(d.reference || { key: referenceKey }, context);
                    if (_state === 'hover') {
                        reference.showing(false);
                    }
                }

                d3_select(this)
                    .call(d.impl);

                // add field help components
                if (help) {
                    d3_select(this)
                        .call(help.body)
                        .select('.form-field-label')
                        .call(help.button);
                }

                // add tag reference components
                if (reference) {
                    d3_select(this)
                        .call(reference.body)
                        .select('.form-field-label')
                        .call(reference.button);
                }

                d.impl.tags(_tags);
            });
    };


    field.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
        return field;
    };


    field.tags = function(val) {
        if (!arguments.length) return _tags;
        _tags = val;
        return field;
    };


    field.show = function() {
        _show = true;
        if (!field.impl) {
            createField();
        }
        if (field.default && field.key && _tags[field.key] !== field.default) {
            var t = {};
            t[field.key] = field.default;
            dispatch.call('change', this, t);
        }
    };

    // A shown field has a visible UI, a non-shown field is in the 'Add field' dropdown
    field.isShown = function() {
        return _show || isPresent();
    };

    // An allowed field can appear in the UI or in the 'Add field' dropdown.
    // A non-allowed field is hidden from the user altogether
    field.isAllowed = function() {

        if (isPresent()) {
            // always allow a field with a value to display
            return true;
        }

        var prerequisiteTag = field.prerequisiteTag;
        if (prerequisiteTag && field.entityID) {
            if (prerequisiteTag.key) {
                var value = context.graph().entity(field.entityID).tags[prerequisiteTag.key];
                if (value) {
                    if (prerequisiteTag.valueNot) {
                        return prerequisiteTag.valueNot !== value;
                    }
                    if (prerequisiteTag.value) {
                        return prerequisiteTag.value === value;
                    }
                    return true;
                } else {
                    return false;
                }
            }
        }
        return true;
    };

    field.focus = function() {
        if (field.impl) {
            field.impl.focus();
        }
    };


    return utilRebind(field, dispatch, 'on');
}
