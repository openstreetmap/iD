import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select, event as d3_event } from 'd3-selection';
import * as countryCoder from '@ideditor/country-coder';

import { presetManager } from '../../presets';
import { fileFetcher } from '../../core/file_fetcher';
import { t, localizer } from '../../core/localizer';
import { utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent } from '../../util';
import { svgIcon } from '../../svg/icon';

export {
    uiFieldText as uiFieldUrl,
    uiFieldText as uiFieldIdentifier,
    uiFieldText as uiFieldNumber,
    uiFieldText as uiFieldTel,
    uiFieldText as uiFieldEmail
};


export function uiFieldText(field, context) {
    var dispatch = d3_dispatch('change');
    var input = d3_select(null);
    var outlinkButton = d3_select(null);
    var _entityIDs = [];
    var _tags;
    var _phoneFormats = {};

    if (field.type === 'tel') {
        fileFetcher.get('phone_formats')
            .then(function(d) {
                _phoneFormats = d;
                updatePhonePlaceholder();
            })
            .catch(function() { /* ignore */ });
    }

    function i(selection) {
        var entity = _entityIDs.length && context.hasEntity(_entityIDs[0]);
        var preset = entity && presetManager.match(entity, context.graph());
        var isLocked = preset && preset.suggestion && field.id === 'brand';
        field.locked(isLocked);

        var wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);

        input = wrap.selectAll('input')
            .data([0]);

        input = input.enter()
            .append('input')
            .attr('type', field.type === 'identifier' ? 'text' : field.type)
            .attr('id', field.domId)
            .classed(field.type, true)
            .call(utilNoAuto)
            .merge(input);

        input
            .classed('disabled', !!isLocked)
            .attr('readonly', isLocked || null)
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());


        if (field.type === 'tel') {
            updatePhonePlaceholder();

        } else if (field.type === 'number') {
            var rtl = (localizer.textDirection() === 'rtl');

            input.attr('type', 'text');

            var buttons = wrap.selectAll('.increment, .decrement')
                .data(rtl ? [1, -1] : [-1, 1]);

            buttons.enter()
                .append('button')
                .attr('class', function(d) {
                    var which = (d === 1 ? 'increment' : 'decrement');
                    return 'form-field-button ' + which;
                })
                .merge(buttons)
                .on('click', function(d) {
                    d3_event.preventDefault();
                    var raw_vals = input.node().value || '0';
                    var vals = raw_vals.split(';');
                    vals = vals.map(function(v) {
                        var num = parseFloat(v.trim(), 10);
                        return isFinite(num) ? clamped(num + d) : v.trim();
                    });
                    input.node().value = vals.join(';');
                    change()();
                });
        } else if (field.type === 'identifier' && field.urlFormat && field.pattern) {

            input.attr('type', 'text');

            outlinkButton = wrap.selectAll('.foreign-id-permalink')
                .data([0]);

            outlinkButton.enter()
                .append('button')
                .call(svgIcon('#iD-icon-out-link'))
                .attr('class', 'form-field-button foreign-id-permalink')
                .attr('title', function() {
                    var domainResults = /^https?:\/\/(.{1,}?)\//.exec(field.urlFormat);
                    if (domainResults.length >= 2 && domainResults[1]) {
                        var domain = domainResults[1];
                        return t('icons.view_on', { domain: domain });
                    }
                    return '';
                })
                .on('click', function() {
                    d3_event.preventDefault();

                    var value = validIdentifierValueForLink();
                    if (value) {
                        var url = field.urlFormat.replace(/{value}/, encodeURIComponent(value));
                        window.open(url, '_blank');
                    }
                })
                .merge(outlinkButton);
        }
    }


    function updatePhonePlaceholder() {
        if (input.empty() || !Object.keys(_phoneFormats).length) return;

        var extent = combinedEntityExtent();
        var countryCode = extent && countryCoder.iso1A2Code(extent.center());
        var format = countryCode && _phoneFormats[countryCode.toLowerCase()];
        if (format) input.attr('placeholder', format);
    }


    function validIdentifierValueForLink() {
        if (field.type === 'identifier' && field.pattern) {
            var value = utilGetSetValue(input).trim().split(';')[0];
            return value && value.match(new RegExp(field.pattern));
        }
        return null;
    }


    // clamp number to min/max
    function clamped(num) {
        if (field.minValue !== undefined) {
            num = Math.max(num, field.minValue);
        }
        if (field.maxValue !== undefined) {
            num = Math.min(num, field.maxValue);
        }
        return num;
    }


    function change(onInput) {
        return function() {
            var t = {};
            var val = utilGetSetValue(input);
            if (!onInput) val = context.cleanTagValue(val);

            // don't override multiple values with blank string
            if (!val && Array.isArray(_tags[field.key])) return;

            if (!onInput) {
                if (field.type === 'number' && val) {
                    var vals = val.split(';');
                    vals = vals.map(function(v) {
                        var num = parseFloat(v.trim(), 10);
                        return isFinite(num) ? clamped(num) : v.trim();
                    });
                    val = vals.join(';');
                }
                utilGetSetValue(input, val);
            }
            t[field.key] = val || undefined;
            dispatch.call('change', this, t, onInput);
        };
    }


    i.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        return i;
    };


    i.tags = function(tags) {
        _tags = tags;

        var isMixed = Array.isArray(tags[field.key]);

        utilGetSetValue(input, !isMixed && tags[field.key] ? tags[field.key] : '')
            .attr('title', isMixed ? tags[field.key].filter(Boolean).join('\n') : undefined)
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : (field.placeholder() || t('inspector.unknown')))
            .classed('mixed', isMixed);

        if (outlinkButton && !outlinkButton.empty()) {
            var disabled = !validIdentifierValueForLink();
            outlinkButton.classed('disabled', disabled);
        }
    };


    i.focus = function() {
        var node = input.node();
        if (node) node.focus();
    };

    function combinedEntityExtent() {
        return _entityIDs && _entityIDs.length && utilTotalExtent(_entityIDs, context.graph());
    }

    return utilRebind(i, dispatch, 'on');
}
