import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import _debounce from 'lodash-es/debounce';
import * as countryCoder from '@ideditor/country-coder';

import { presetManager } from '../../presets';
import { fileFetcher } from '../../core/file_fetcher';
import { t, localizer } from '../../core/localizer';
import { utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent } from '../../util';
import { svgIcon } from '../../svg/icon';
import { cardinal } from '../../osm/node';

export {
    uiFieldText as uiFieldColour,
    uiFieldText as uiFieldEmail,
    uiFieldText as uiFieldIdentifier,
    uiFieldText as uiFieldNumber,
    uiFieldText as uiFieldTel,
    uiFieldText as uiFieldUrl
};


export function uiFieldText(field, context) {
    var dispatch = d3_dispatch('change');
    var input = d3_select(null);
    var outlinkButton = d3_select(null);
    var wrap = d3_select(null);
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


    function calcLocked() {
        // Protect certain fields that have a companion `*:wikidata` value
        var isLocked = (field.id === 'brand' || field.id === 'network' || field.id === 'operator' || field.id === 'flag') &&
            _entityIDs.length &&
            _entityIDs.some(function(entityID) {
                var entity = context.graph().hasEntity(entityID);
                if (!entity) return false;

                // Features linked to Wikidata are likely important and should be protected
                if (entity.tags.wikidata) return true;

                var preset = presetManager.match(entity, context.graph());
                var isSuggestion = preset && preset.suggestion;

                // Lock the field if there is a value and a companion `*:wikidata` value
                var which = field.id;   // 'brand', 'network', 'operator', 'flag'
                return isSuggestion && !!entity.tags[which] && !!entity.tags[which + ':wikidata'];
            });

        field.locked(isLocked);
    }


    function i(selection) {
        calcLocked();
        var isLocked = field.locked();

        wrap = selection.selectAll('.form-field-input-wrap')
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

            var inc = field.increment;

            var buttons = wrap.selectAll('.increment, .decrement')
                .data(rtl ? [inc, -inc] : [-inc, inc]);

            buttons.enter()
                .append('button')
                .attr('class', function(d) {
                    var which = (d > 0 ? 'increment' : 'decrement');
                    return 'form-field-button ' + which;
                })
                .attr('title', function(d){
                    var which = (d > 0 ? 'increment' : 'decrement');
                    return t(`inspector.${which}`);
                })
                .merge(buttons)
                .on('click', function(d3_event, d) {
                    d3_event.preventDefault();
                    var raw_vals = input.node().value || '0';
                    var vals = raw_vals.split(';');
                    vals = vals.map(function(v) {
                        var num = parseFloat(v.trim(), 10);
                        if (isFinite(num)) return clamped(num + d);

                        const compassDir = cardinal[v.trim().toLowerCase()];
                        if (compassDir !== undefined) return clamped(compassDir + d);

                        return v.trim(); // do nothing if the value is neither a number, nor a cardinal direction
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
                .on('click', function(d3_event) {
                    d3_event.preventDefault();

                    var value = validIdentifierValueForLink();
                    if (value) {
                        var url = field.urlFormat.replace(/{value}/, encodeURIComponent(value));
                        window.open(url, '_blank');
                    }
                })
                .merge(outlinkButton);
        } else if (field.type === 'url') {
            input.attr('type', 'text');

            outlinkButton = wrap.selectAll('.foreign-id-permalink')
                .data([0]);

            outlinkButton.enter()
                .append('button')
                .call(svgIcon('#iD-icon-out-link'))
                .attr('class', 'form-field-button foreign-id-permalink')
                .attr('title', () => t('icons.visit_website'))
                .on('click', function(d3_event) {
                    d3_event.preventDefault();

                    const value = validIdentifierValueForLink();
                    if (value) window.open(value, '_blank');
                })
                .merge(outlinkButton);
        } else if (field.key.split(':').includes('colour')) {
            input.attr('type', 'text');

            updateColourPreview();
        }
    }

    function isColourValid(colour) {
        if (!colour.match(/^(#([0-9a-fA-F]{3}){1,2}|\w+)$/)) {
            // OSM only supports hex or named colors
            return false;
        } else if (!CSS.supports('color', colour) || ['unset', 'inherit', 'initial', 'revert'].includes(colour)) {
            // see https://stackoverflow.com/a/68217760/1627467
            return false;
        }
        return true;
    }
    function updateColourPreview() {
        wrap.selectAll('.colour-preview')
            .remove();

        const colour = utilGetSetValue(input);

        if (!isColourValid(colour) && colour !== '') return;

        var colourSelector = wrap.selectAll('.colour-selector')
            .data([0]);
        outlinkButton = wrap.selectAll('.colour-preview')
            .data([colour]);

        colourSelector
            .enter()
            .append('input')
            .attr('type', 'color')
            .attr('class', 'form-field-button colour-selector')
            .attr('value', colour)
            .on('input', _debounce(function(d3_event) {
                d3_event.preventDefault();
                var colour = this.value;
                if (!isColourValid(colour)) return;
                utilGetSetValue(input, this.value);
                change()();
                updateColourPreview();
            }, 100));

        outlinkButton = outlinkButton
            .enter()
            .append('div')
            .attr('class', 'form-field-button colour-preview')
            .append('div')
            .style('background-color', d => d)
            .attr('class', 'colour-box');
        if (colour === '') {
            outlinkButton = outlinkButton
                .call(svgIcon('#iD-icon-edit'));
        }
        outlinkButton
            .on('click', () => wrap.select('.colour-selector').node().click())
            .merge(outlinkButton);
    }


    function updatePhonePlaceholder() {
        if (input.empty() || !Object.keys(_phoneFormats).length) return;

        var extent = combinedEntityExtent();
        var countryCode = extent && countryCoder.iso1A2Code(extent.center());
        var format = countryCode && _phoneFormats[countryCode.toLowerCase()];
        if (format) input.attr('placeholder', format);
    }


    function validIdentifierValueForLink() {
        const value = utilGetSetValue(input).trim();

        if (field.type === 'url' && value) {
            try {
                return (new URL(value)).href;
            } catch (e) {
                return null;
            }
        }
        if (field.type === 'identifier' && field.pattern) {
            return value && value.match(new RegExp(field.pattern))[0];
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

        if (field.type === 'tel') updatePhonePlaceholder();

        if (field.key.split(':').includes('colour')) updateColourPreview();

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
