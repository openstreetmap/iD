import _clone from 'lodash-es/clone';
import _extend from 'lodash-es/extend';
import _some from 'lodash-es/some';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

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


    field.impl = uiFields[field.type](field, context)
        .on('change', function(t, onInput) {
            dispatch.call('change', field, t, onInput);
        });

    if (entity && field.impl.entity) {
        field.impl.entity(entity);
    }

    field.keys = field.keys || [field.key];


    function isModified() {
        if (!entity) return false;
        var original = context.graph().base().entities[entity.id];
        return _some(field.keys, function(key) {
            return original ? _tags[key] !== original.tags[key] : _tags[key];
        });
    }


    function isPresent() {
        return _some(field.keys, function(key) {
            return _tags[key];
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
            .attr('class', function(d) { return 'form-field form-field-' + d.id; })
            .classed('nowrap', !options.wrap);

        if (options.wrap) {
            var label = enter
                .append('label')
                .attr('class', 'form-label')
                .attr('for', function(d) { return 'preset-input-' + d.id; })
                .text(function(d) { return d.label(); });

            var wrap = label
                .append('div')
                .attr('class', 'form-label-button-wrap');

            if (options.remove) {
                wrap
                    .append('button')
                    .attr('class', 'remove-icon')
                    .attr('tabindex', -1)
                    .call(svgIcon('#operation-delete'));
            }

            if (options.revert) {
                wrap
                    .append('button')
                    .attr('class', 'modified-icon')
                    .attr('tabindex', -1)
                    .call(
                        (textDirection === 'rtl') ? svgIcon('#icon-redo') : svgIcon('#icon-undo')
                    );
            }
        }


        // Update
        container = container
            .merge(enter);

        container.selectAll('.form-label-button-wrap .remove-icon')
            .on('click', remove);

        container.selectAll('.form-label-button-wrap .modified-icon')
            .on('click', revert);

        container
            .classed('modified', isModified())
            .classed('present', isPresent())
            .each(function(d) {
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
                        .select('.form-label-button-wrap')
                        .call(help.button);
                }

                // add tag reference components
                if (reference) {
                    d3_select(this)
                        .call(reference.body)
                        .select('.form-label-button-wrap')
                        .call(reference.button);
                }

                d.impl.tags(_tags);
            });
    };


    field.state = function(_) {
        if (!arguments.length) return _state;
        _state = _;
        return field;
    };


    field.tags = function(_) {
        if (!arguments.length) return _tags;
        _tags = _;
        return field;
    };


    field.show = function() {
        _show = true;
        if (field.default && field.key && _tags[field.key] !== field.default) {
            var t = {};
            t[field.key] = field.default;
            dispatch.call('change', this, t);
        }
    };


    field.isShown = function() {
        return _show || _some(field.keys, function(key) { return !!_tags[key]; });
    };


    field.focus = function() {
        field.impl.focus();
    };


    return utilRebind(field, dispatch, 'on');
}

