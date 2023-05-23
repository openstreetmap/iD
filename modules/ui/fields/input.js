import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import _debounce from 'lodash-es/debounce';
import * as countryCoder from '@rapideditor/country-coder';

import { presetManager } from '../../presets';
import { fileFetcher } from '../../core/file_fetcher';
import { t, localizer } from '../../core/localizer';
import { utilDetect, utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent } from '../../util';
import { svgIcon } from '../../svg/icon';
import { cardinal } from '../../osm/node';
import { uiLengthIndicator } from '..';
import { uiTooltip } from '../tooltip';

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
    var _lengthIndicator = uiLengthIndicator(context.maxCharsForTagValue());
    var _entityIDs = [];
    var _tags;
    var _phoneFormats = {};
    const isDirectionField = field.key.split(':').some(keyPart => keyPart === 'direction');

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
	function first_click(d3_event, d) {
            d3_event.preventDefault();

            // Set the click-held attribute so click_func runs
            d3_event.target.setAttribute('click-held', '');
            click_func(d3_event, d);
        }

        function stop_click(d3_event) {
            d3_event.target.removeAttribute('click-held');
        }

        function click_func(d3_event, d) {
            if (!d3_event.target.hasAttribute('click-held')) {
                // This button has been clicked before but now we should stop the clicking
                return;
            }

            // Repeat in 250 ms. If the mouse has left or stopped holding, we won't even get this far
            setTimeout(function() { click_func(d3_event, d); }, 250);

            // do nothing if this is a multi-selection with mixed values
            var isMixed = Array.isArray(_tags[field.key]);
            if (isMixed) return;

            var raw_vals = input.node().value || '0';
            var vals = raw_vals.split(';');
            vals = vals.map(function(v) {
                var num = Number(v);
                if (isDirectionField) {
                    const compassDir = cardinal[v.trim().toLowerCase()];
                    if (compassDir !== undefined) {
                        num = compassDir;
                    }
                }

                if (!isFinite(num)) {
                    // do nothing if the value is neither a number, nor a cardinal direction
                    return v.trim();
                }

                num += d;
                // clamp to 0..359 degree range if it's a direction field
                // https://github.com/openstreetmap/iD/issues/9386
                if (isDirectionField) {
                    num = ((num % 360) + 360) % 360;
                }
                // make sure no extra decimals are introduced
                const numDecimals = v.includes('.') ? v.split('.')[1].length : 0;
                return clamped(num).toFixed(numDecimals);
            });
            input.node().value = vals.join(';');
            change()();
        }

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

        wrap.call(_lengthIndicator);

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
                .attr('title', function(d) {
                    var which = (d > 0 ? 'increment' : 'decrement');
                    return t(`inspector.${which}`);
                })
                .merge(buttons)
                .on('mousedown', first_click)
                .on('mouseup mouseout', stop_click);

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
        } else if (field.type === 'colour') {
            input.attr('type', 'text');

            updateColourPreview();
        } else if (field.type === 'date') {
            input.attr('type', 'text');

            updateDateField();
        }
    }


    function updateColourPreview() {
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
        wrap.selectAll('.colour-preview')
            .remove();

        const colour = utilGetSetValue(input);

        if (!isColourValid(colour) && colour !== '') {
            wrap.selectAll('input.colour-selector').remove();
            wrap.selectAll('.form-field-button').remove();
            return;
        }

        var colourSelector = wrap.selectAll('.colour-selector')
            .data([0]);

        colourSelector
            .enter()
            .append('input')
            .attr('type', 'color')
            .attr('class', 'colour-selector')
            .on('input', _debounce(function(d3_event) {
                d3_event.preventDefault();
                var colour = this.value;
                if (!isColourValid(colour)) return;
                utilGetSetValue(input, this.value);
                change()();
                updateColourPreview();
            }, 100));
        wrap.selectAll('input.colour-selector')
            .attr('value', colour);

        var chooserButton = wrap.selectAll('.colour-preview')
            .data([colour]);
        chooserButton = chooserButton
            .enter()
            .append('div')
            .attr('class', 'form-field-button colour-preview')
            .append('div')
            .style('background-color', d => d)
            .attr('class', 'colour-box');
        if (colour === '') {
            chooserButton = chooserButton
                .call(svgIcon('#iD-icon-edit'));
        }
        chooserButton
            .on('click', () => wrap.select('.colour-selector').node().showPicker());
    }


    function updateDateField() {
        function isDateValid(date) {
            return date.match(/^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$/);
        }

        const date = utilGetSetValue(input);

        const now = new Date();
        const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        if ((field.key === 'check_date' || field.key === 'survey:date') && date !== today) {
            wrap.selectAll('.date-set-today')
                .data([0])
                .enter()
                .append('button')
                .attr('class', 'form-field-button date-set-today')
                .call(svgIcon('#fas-rotate'))
                .call(uiTooltip().title(() => t.append('inspector.set_today')))
                .on('click', () => {
                    utilGetSetValue(input, today);
                    change()();
                    updateDateField();
                });
        } else {
            wrap.selectAll('.date-set-today').remove();
        }

        if (!isDateValid(date) && date !== '') {
            wrap.selectAll('input.date-selector').remove();
            wrap.selectAll('.date-calendar').remove();
            return;
        }

        if (utilDetect().browser !== 'Safari') {
            // opening of the calendar pick is not yet supported in safari <= 16
            // https://caniuse.com/mdn-api_htmlinputelement_showpicker_date_input

            var dateSelector = wrap.selectAll('.date-selector')
                .data([0]);

            dateSelector
                .enter()
                .append('input')
                .attr('type', 'date')
                .attr('class', 'date-selector')
                .on('input', _debounce(function(d3_event) {
                    d3_event.preventDefault();
                    var date = this.value;
                    if (!isDateValid(date)) return;
                    utilGetSetValue(input, this.value);
                    change()();
                    updateDateField();
                }, 100));
            wrap.selectAll('input.date-selector')
                .attr('value', date);

            var calendarButton = wrap.selectAll('.date-calendar')
                .data([date]);
            calendarButton = calendarButton
                .enter()
                .append('button')
                .attr('class', 'form-field-button date-calendar')
                .call(svgIcon('#fas-calendar-days'));

            calendarButton
                .on('click', () => wrap.select('.date-selector').node().showPicker());
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


    // returns all values of a (potential) multiselection and/or multi-key field
    function getVals(tags) {
        if (field.keys) {
            return new Set(field.keys.reduce((acc, key) => acc.concat(tags[key]), [])
                .filter(Boolean));
        } else {
            return new Set([].concat(tags[field.key]).filter(Boolean));
        }
    }


    function change(onInput) {
        return function() {
            var t = {};
            var val = utilGetSetValue(input);
            if (!onInput) val = context.cleanTagValue(val);

            // don't override multiple values with blank string
            if (!val && getVals(_tags).size > 1) return;

            if (!onInput) {
                if (field.type === 'number' && val) {
                    var vals = val.split(';');
                    vals = vals.map(function(v) {
                        var num = Number(v);
                        return isFinite(num) ? clamped(num) : v.trim();
                    });
                    val = vals.join(';');
                }
                utilGetSetValue(input, val);
            }
            t[field.key] = val || undefined;
            if (field.keys) {
                // for multi-key fields with: handle alternative tag keys gracefully
                // https://github.com/openstreetmap/id-tagging-schema/issues/905
                dispatch.call('change', this, tags => {
                    if (field.keys.some(key => tags[key])) {
                        // use exiting key(s)
                        field.keys.filter(key => tags[key]).forEach(key => {
                            tags[key] = val || undefined;
                        });
                    } else {
                        // fall back to default key if none of the `keys` is preset
                        tags[field.key] = val || undefined;
                    }
                    return tags;
                }, onInput);
            } else {
                dispatch.call('change', this, t, onInput);
            }
        };
    }


    i.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        return i;
    };

    i.tags = function(tags) {
        _tags = tags;

        const vals = getVals(tags);
        const isMixed = vals.size > 1;
        const val = vals.size === 1 ? [...vals][0] : '';
        utilGetSetValue(input, val)
            .attr('title', isMixed ? [...vals].join('\n') : undefined)
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : (field.placeholder() || t('inspector.unknown')))
            .classed('mixed', isMixed);

        if (field.type === 'number') {
            const buttons = wrap.selectAll('.increment, .decrement');
            if (isMixed) {
                buttons.attr('disabled', 'disabled').classed('disabled', true);
            } else {
                var raw_vals = tags[field.key] || '0';
                const canIncDec = raw_vals.split(';').some(val => isFinite(Number(val))
                        || isDirectionField && cardinal[val.trim().toLowerCase()]);
                buttons.attr('disabled', canIncDec ? null : 'disabled').classed('disabled', !canIncDec);
            }
        }

        if (field.type === 'tel') updatePhonePlaceholder();

        if (field.type === 'colour') updateColourPreview();

        if (field.type === 'date') updateDateField();

        if (outlinkButton && !outlinkButton.empty()) {
            var disabled = !validIdentifierValueForLink();
            outlinkButton.classed('disabled', disabled);
        }

        if (!isMixed) {
            _lengthIndicator.update(tags[field.key]);
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
