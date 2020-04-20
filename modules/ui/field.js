import * as countryCoder from '@ideditor/country-coder';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, localizer } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiTooltip } from './tooltip';
import { geoExtent } from '../geo/extent';
import { uiFieldHelp } from './field_help';
import { uiFields } from './fields';
import { uiTagReference } from './tag_reference';
import { utilRebind, utilUniqueDomId } from '../util';


export function uiField(context, presetField, entityIDs, options) {
    options = Object.assign({
        show: true,
        wrap: true,
        remove: true,
        revert: true,
        info: true
    }, options);

    var dispatch = d3_dispatch('change', 'revert');
    var field = Object.assign({}, presetField);   // shallow copy
    field.domId = utilUniqueDomId('form-field-' + field.safeid);
    var _show = options.show;
    var _state = '';
    var _tags = {};

    var _locked = false;
    var _lockedTip = uiTooltip()
        .title(t('inspector.lock.suggestion', { label: field.label }))
        .placement('bottom');


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

        if (entityIDs) {
            field.entityIDs = entityIDs;
            // if this field cares about the entities, pass them along
            if (field.impl.entityIDs) {
                field.impl.entityIDs(entityIDs);
            }
        }
    }


    function isModified() {
        if (!entityIDs || !entityIDs.length) return false;
        return entityIDs.some(function(entityID) {
            var original = context.graph().base().entities[entityID];
            var latest = context.graph().entity(entityID);
            return field.keys.some(function(key) {
                return original ? latest.tags[key] !== original.tags[key] : latest.tags[key];
            });
        });
    }


    function tagsContainFieldKey() {
        return field.keys.some(function(key) {
            if (field.type === 'multiCombo') {
                for (var tagKey in _tags) {
                    if (tagKey.indexOf(key) === 0) {
                        return true;
                    }
                }
                return false;
            }
            return _tags[key] !== undefined;
        });
    }


    function revert(d) {
        d3_event.stopPropagation();
        d3_event.preventDefault();
        if (!entityIDs || _locked) return;

        dispatch.call('revert', d, d.keys);
    }


    function remove(d) {
        d3_event.stopPropagation();
        d3_event.preventDefault();
        if (_locked) return;

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
            var labelEnter = enter
                .append('label')
                .attr('class', 'field-label')
                .attr('for', function(d) { return d.domId; });

            var textEnter = labelEnter
                .append('span')
                .attr('class', 'label-text');

            textEnter
                .append('span')
                .attr('class', 'label-textvalue')
                .text(function(d) { return d.label(); });

            textEnter
                .append('span')
                .attr('class', 'label-textannotation');

            if (options.remove) {
                labelEnter
                    .append('button')
                    .attr('class', 'remove-icon')
                    .attr('title', t('icons.remove'))
                    .attr('tabindex', -1)
                    .call(svgIcon('#iD-operation-delete'));
            }

            if (options.revert) {
                labelEnter
                    .append('button')
                    .attr('class', 'modified-icon')
                    .attr('title', t('icons.undo'))
                    .attr('tabindex', -1)
                    .call(svgIcon((localizer.textDirection() === 'rtl') ? '#iD-icon-redo' : '#iD-icon-undo'));
            }
        }


        // Update
        container = container
            .merge(enter);

        container.select('.field-label > .remove-icon')  // propagate bound data
            .on('click', remove);

        container.select('.field-label > .modified-icon')  // propagate bound data
            .on('click', revert);

        container
            .each(function(d) {
                var selection = d3_select(this);

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

                selection
                    .call(d.impl);

                // add field help components
                if (help) {
                    selection
                        .call(help.body)
                        .select('.field-label')
                        .call(help.button);
                }

                // add tag reference components
                if (reference) {
                    selection
                        .call(reference.body)
                        .select('.field-label')
                        .call(reference.button);
                }

                d.impl.tags(_tags);
            });


            container
                .classed('locked', _locked)
                .classed('modified', isModified())
                .classed('present', tagsContainFieldKey());


            // show a tip and lock icon if the field is locked
            var annotation = container.selectAll('.field-label .label-textannotation');
            var icon = annotation.selectAll('.icon')
                .data(_locked ? [0]: []);

            icon.exit()
                .remove();

            icon.enter()
                .append('svg')
                .attr('class', 'icon')
                .append('use')
                .attr('xlink:href', '#fas-lock');

            container.call(_locked ? _lockedTip : _lockedTip.destroy);
    };


    field.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
        return field;
    };


    field.tags = function(val) {
        if (!arguments.length) return _tags;
        _tags = val;

        if (tagsContainFieldKey() && !_show) {
            // always show a field if it has a value to display
            _show = true;
            if (!field.impl) {
                createField();
            }
        }

        return field;
    };


    field.locked = function(val) {
        if (!arguments.length) return _locked;
        _locked = val;
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
        return _show;
    };


    // An allowed field can appear in the UI or in the 'Add field' dropdown.
    // A non-allowed field is hidden from the user altogether
    field.isAllowed = function() {

        if (entityIDs &&
            entityIDs.length > 1 &&
            uiFields[field.type].supportsMultiselection === false) return false;

        if (field.geometry && !entityIDs.every(function(entityID) {
            return field.matchGeometry(context.graph().geometry(entityID));
        })) return false;

        if (field.countryCodes || field.notCountryCodes) {
            var extent = combinedEntityExtent();
            if (!extent) return true;

            var center = extent.center();
            var countryCode = countryCoder.iso1A2Code(center);

            if (!countryCode) return false;

            countryCode = countryCode.toLowerCase();

            if (field.countryCodes && field.countryCodes.indexOf(countryCode) === -1) {
                return false;
            }
            if (field.notCountryCodes && field.notCountryCodes.indexOf(countryCode) !== -1) {
                return false;
            }
        }

        var prerequisiteTag = field.prerequisiteTag;

        if (entityIDs &&
            !tagsContainFieldKey() && // ignore tagging prerequisites if a value is already present
            prerequisiteTag) {

            if (!entityIDs.every(function(entityID) {
                var entity = context.graph().entity(entityID);
                if (prerequisiteTag.key) {
                    var value = entity.tags[prerequisiteTag.key];
                    if (!value) return false;

                    if (prerequisiteTag.valueNot) {
                        return prerequisiteTag.valueNot !== value;
                    }
                    if (prerequisiteTag.value) {
                        return prerequisiteTag.value === value;
                    }
                } else if (prerequisiteTag.keyNot) {
                    if (entity.tags[prerequisiteTag.keyNot]) return false;
                }
                return true;
            })) return false;
        }

        return true;
    };


    field.focus = function() {
        if (field.impl) {
            field.impl.focus();
        }
    };


    function combinedEntityExtent() {
        return entityIDs && entityIDs.length && entityIDs.reduce(function(extent, entityID) {
            var entity = context.graph().entity(entityID);
            return extent.extend(entity.extent(context.graph()));
        }, geoExtent());
    }


    return utilRebind(field, dispatch, 'on');
}
