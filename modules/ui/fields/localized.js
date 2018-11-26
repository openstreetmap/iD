import _find from 'lodash-es/find';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    event as d3_event
} from 'd3-selection';

import { d3combobox as d3_combobox } from '../../lib/d3.combobox.js';

import { t } from '../../util/locale';
import { dataWikipedia } from '../../../data';
import { services } from '../../services';
import { svgIcon } from '../../svg';
import { tooltip } from '../../util/tooltip';
import { utilDetect } from '../../util/detect';
import {
    utilEditDistance,
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';


export function uiFieldLocalized(field, context) {
    var dispatch = d3_dispatch('change', 'input');
    var wikipedia = services.wikipedia;
    var input = d3_select(null);
    var localizedInputs = d3_select(null);
    var _isLocked = false;
    var _brandTip = tooltip().title(t('inspector.lock.brand')).placement('bottom');
    var _buttonTip = tooltip().title(t('translate.translate')).placement('left');
    var _wikiTitles;
    var _entity;


    function checkLocked() {
        var preset = _entity && context.presets().match(_entity, context.graph());
        var isSuggestion = preset && preset.suggestion;
        var showsBrand = preset && preset.fields
            .filter(function(d) { return d.id === 'brand'; }).length;
        _isLocked = field.id === 'name' && isSuggestion && !showsBrand;
    }


    function localized(selection) {
        checkLocked();
        var preset = _entity && context.presets().match(_entity, context.graph());

        var wrap = selection.selectAll('.localized-input-wrap')
            .data([0]);

        // enter/update
        wrap = wrap.enter()
            .append('div')
            .attr('class', 'localized-input-wrap')
            .merge(wrap)
            .call(_isLocked ? _brandTip : _brandTip.destroy);


        input = wrap.selectAll('.localized-main')
            .data([0]);

        // enter/update
        input = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.safeid)
            .attr('class', 'localized-main')
            .attr('placeholder', field.placeholder())
            .call(utilNoAuto)
            .merge(input);

        if (preset && field.id === 'name') {
            var pTag = preset.id.split('/', 2);
            var pKey = pTag[0];
            var pValue = pTag[1];

            if (preset.suggestion) {
                // A "suggestion" preset (brand name)
                // Put suggestion keys in `field.keys` so delete button can remove them all.
                field.keys = Object.keys(preset.removeTags)
                    .filter(function(k) { return k !== pKey; });

            } else {
                // Not a suggestion preset - Add a suggestions dropdown if it makes sense to.
                var allSuggestions = context.presets().collection.filter(function(p) {
                    return p.suggestion === true;
                });

                // This code attempts to determine if the matched preset is the
                // kind of preset that even can benefit from name suggestions..
                // - true = shops, cafes, hotels, etc. (also generic and fallback presets)
                // - false = churches, parks, hospitals, etc. (things not in the index)
                var isFallback = preset.isFallback();
                var goodSuggestions = allSuggestions.filter(function(s) {
                    if (isFallback) return true;
                    var sTag = s.id.split('/', 2);
                    var sKey = sTag[0];
                    var sValue = sTag[1];
                    return pKey === sKey && (!pValue || pValue === sValue);
                });

                // Show the suggestions.. If the user picks one, change the tags..
                if (allSuggestions.length && goodSuggestions.length) {
                    input
                        .call(d3_combobox()
                            .container(context.container())
                            .fetcher(suggestNames(preset, allSuggestions))
                            .minItems(1)
                            .on('accept', function(d) {
                                var tags = _entity.tags;
                                var geometry = _entity.geometry(context.graph());
                                var removed = preset.unsetTags(tags, geometry);
                                for (var k in tags) {
                                    tags[k] = removed[k];  // set removed tags to `undefined`
                                }
                                tags = d.suggestion.setTags(tags, geometry);
                                utilGetSetValue(input, tags.name);
                                dispatch.call('change', this, tags);
                            })
                        );
                }
            }
        }

        input
            .classed('disabled', !!_isLocked)
            .attr('readonly', _isLocked)
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());


        var translateButton = wrap.selectAll('.localized-add')
            .data([0]);

        translateButton = translateButton.enter()
            .append('button')
            .attr('class', 'localized-add button-input-action minor')
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-plus'))
            .merge(translateButton);

        translateButton
            .classed('disabled', !!_isLocked)
            .call(_isLocked ? _buttonTip.destroy : _buttonTip)
            .on('click', addNew);


        localizedInputs = selection.selectAll('.localized-multilingual')
            .data([0]);

        localizedInputs = localizedInputs.enter()
            .append('div')
            .attr('class', 'localized-multilingual')
            .merge(localizedInputs);

        localizedInputs.selectAll('button, input')
            .classed('disabled', !!_isLocked)
            .attr('readonly', _isLocked);



        function suggestNames(preset, suggestions) {
            var pTag = preset.id.split('/', 2);
            var pKey = pTag[0];
            var pValue = pTag[1];

            return function(value, callback) {
                var results = [];
                if (value && value.length > 2) {
                    for (var i = 0; i < suggestions.length; i++) {
                        var s = suggestions[i];
                        var sTag = s.id.split('/', 2);
                        var sKey = sTag[0];
                        var sValue = sTag[1];
                        var name = s.name();
                        var dist = utilEditDistance(value, name.substring(0, value.length));
                        var matchesPreset = (pKey === sKey && (!pValue || pValue === sValue));

                        if (dist < 1 || (matchesPreset && dist < 3)) {
                            var obj = {
                                title: name,
                                value: name,
                                suggestion: s,
                                dist: dist + (matchesPreset ? 0 : 1)  // penalize if not matched preset
                            };
                            results.push(obj);
                        }
                    }
                    results.sort(function(a, b) { return a.dist - b.dist; });
                }
                results = results.slice(0, 10);
                callback(results);
            };
        }


        function addNew() {
            d3_event.preventDefault();
            if (_isLocked) return;

            var data = localizedInputs.selectAll('div.entry').data();
            var defaultLang = utilDetect().locale.toLowerCase().split('-')[0];
            var langExists = _find(data, function(datum) { return datum.lang === defaultLang;});
            var isLangEn = defaultLang.indexOf('en') > -1;
            if (isLangEn || langExists) {
                defaultLang = '';
            }
            data.push({ lang: defaultLang, value: '' });

            localizedInputs
                .call(renderMultilingual, data);
        }


        function change(onInput) {
            return function() {
                if (_isLocked) {
                    d3_event.preventDefault();
                    return;
                }
                var t = {};
                t[field.key] = utilGetSetValue(d3_select(this)) || undefined;
                dispatch.call('change', this, t, onInput);
            };
        }
    }


    function key(lang) {
        return field.key + ':' + lang;
    }


    function changeLang(d) {
        var lang = utilGetSetValue(d3_select(this));
        var t = {};
        var language = _find(dataWikipedia, function(d) {
            return d[0].toLowerCase() === lang.toLowerCase() ||
                d[1].toLowerCase() === lang.toLowerCase();
        });

        if (language) lang = language[2];

        if (d.lang && d.lang !== lang) {
            t[key(d.lang)] = undefined;
        }

        var value = utilGetSetValue(d3_select(this.parentNode)
            .selectAll('.localized-value'));

        if (lang && value) {
            t[key(lang)] = value;
        } else if (lang && _wikiTitles && _wikiTitles[d.lang]) {
            t[key(lang)] = _wikiTitles[d.lang];
        }

        d.lang = lang;
        dispatch.call('change', this, t);
    }


    function changeValue(d) {
        if (!d.lang) return;
        var t = {};
        t[key(d.lang)] = utilGetSetValue(d3_select(this)) || undefined;
        dispatch.call('change', this, t);
    }


    function fetcher(value, cb) {
        var v = value.toLowerCase();

        cb(dataWikipedia.filter(function(d) {
            return d[0].toLowerCase().indexOf(v) >= 0 ||
            d[1].toLowerCase().indexOf(v) >= 0 ||
            d[2].toLowerCase().indexOf(v) >= 0;
        }).map(function(d) {
            return { value: d[1] };
        }));
    }


    function renderMultilingual(selection, data) {
        var wraps = selection.selectAll('div.entry')
            .data(data, function(d) { return d.lang; });

        wraps.exit()
            .transition()
            .duration(200)
            .style('max-height', '0px')
            .style('opacity', '0')
            .style('top', '-10px')
            .remove();

        var innerWrap = wraps.enter()
            .insert('div', ':first-child');

        innerWrap
            .attr('class', 'entry')
            .each(function() {
                var wrap = d3_select(this);
                var langcombo = d3_combobox()
                    .container(context.container())
                    .fetcher(fetcher)
                    .minItems(0);

                var label = wrap
                    .append('label')

                label
                    .append('span')
                    .attr('class', 'label-text')
                    .text(t('translate.localized_translation_label'));

                label
                    .append('div')
                    .attr('class', 'form-label-button-wrap')
                    .append('button')
                    .attr('class', 'minor remove-icon')
                    .on('click', function(d){
                        if (_isLocked) return;
                        d3_event.preventDefault();
                        var t = {};
                        t[key(d.lang)] = undefined;
                        dispatch.call('change', this, t);
                        d3_select(this.parentNode.parentNode.parentNode)
                            .style('top', '0')
                            .style('max-height', '240px')
                            .transition()
                            .style('opacity', '0')
                            .style('max-height', '0px')
                            .remove();
                    })
                    .call(svgIcon('#iD-operation-delete'));

                wrap
                    .append('input')
                    .attr('class', 'localized-lang')
                    .attr('type', 'text')
                    .attr('placeholder', t('translate.localized_translation_language'))
                    .on('blur', changeLang)
                    .on('change', changeLang)
                    .call(langcombo);

                wrap
                    .append('input')
                    .attr('type', 'text')
                    .attr('placeholder', t('translate.localized_translation_name'))
                    .attr('class', 'localized-value')
                    .on('blur', changeValue)
                    .on('change', changeValue);
            });

        innerWrap
            .style('margin-top', '0px')
            .style('max-height', '0px')
            .style('opacity', '0')
            .transition()
            .duration(200)
            .style('margin-top', '10px')
            .style('max-height', '240px')
            .style('opacity', '1')
            .on('end', function() {
                d3_select(this)
                    .style('max-height', '')
                    .style('overflow', 'visible');
            });


        var entry = selection.selectAll('.entry');

        utilGetSetValue(entry.select('.localized-lang'), function(d) {
            var lang = _find(dataWikipedia, function(lang) { return lang[2] === d.lang; });
            return lang ? lang[1] : d.lang;
        });

        utilGetSetValue(entry.select('.localized-value'),
            function(d) { return d.value; });
    }


    localized.tags = function(tags) {
        // Fetch translations from wikipedia
        if (tags.wikipedia && !_wikiTitles) {
            _wikiTitles = {};
            var wm = tags.wikipedia.match(/([^:]+):(.+)/);
            if (wm && wm[0] && wm[1]) {
                wikipedia.translations(wm[1], wm[2], function(d) { _wikiTitles = d; });
            }
        }

        utilGetSetValue(input, tags[field.key] || '');

        var postfixed = [];
        for (var k in tags) {
            var m = k.match(/^(.*):([a-zA-Z_-]+)$/);
            if (m && m[1] === field.key && m[2]) {
                postfixed.push({ lang: m[2], value: tags[k] });
            }
        }

        localizedInputs
            .call(renderMultilingual, postfixed.reverse());
    };


    localized.focus = function() {
        input.node().focus();
    };


    localized.entity = function(val) {
        if (!arguments.length) return _entity;
        _entity = val;
        return localized;
    };

    return utilRebind(localized, dispatch, 'on');
}
