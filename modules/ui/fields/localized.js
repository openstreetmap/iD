import { rebind } from '../../util/rebind';
import { d3combobox } from '../../../js/lib/d3.combobox.js';
import { getSetValue } from '../../util/get_set_value';
import * as d3 from 'd3';
import { t } from '../../util/locale';
import { tooltip } from '../../util/tooltip';
import _ from 'lodash';
import { Detect } from '../../util/detect';
import { Icon } from '../../svg/index';
import { SuggestNames } from '../../util/index';
import { wikipedia as wikipediaService } from '../../services/index';
import { suggestions, wikipedia as wikipediaData } from '../../../data/index';

export function localized(field, context) {
    var dispatch = d3.dispatch('change', 'input'),
        wikipedia = wikipediaService.init(),
        input, localizedInputs, wikiTitles,
        entity;

    function localized(selection) {
        input = selection.selectAll('.localized-main')
            .data([0]);

        input.enter().append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id)
            .attr('class', 'localized-main')
            .attr('placeholder', field.placeholder());

        if (field.id === 'name') {
            var preset = context.presets().match(entity, context.graph());
            input.call(d3combobox().fetcher(
                SuggestNames(preset, suggestions)
            ));
        }

        input
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());

        var translateButton = selection.selectAll('.localized-add')
            .data([0]);

        translateButton.enter()
            .append('button')
            .attr('class', 'button-input-action localized-add minor')
            .attr('tabindex', -1)
            .call(Icon('#icon-plus'))
            .call(tooltip()
                .title(t('translate.translate'))
                .placement('left'));

        translateButton
            .on('click', addNew);

        localizedInputs = selection.selectAll('.localized-wrap')
            .data([0]);

        localizedInputs.enter().append('div')
            .attr('class', 'localized-wrap');
    }

    function addNew() {
        d3.event.preventDefault();
        var data = localizedInputs.selectAll('div.entry').data();
        var defaultLang = Detect().locale.toLowerCase().split('-')[0];
        var langExists = _.find(data, function(datum) { return datum.lang === defaultLang;});
        var isLangEn = defaultLang.indexOf('en') > -1;
        if (isLangEn || langExists) {
          defaultLang = '';
        }
        data.push({ lang: defaultLang, value: '' });
        localizedInputs.call(render, data);
    }

    function change(onInput) {
        return function() {
            var t = {};
            t[field.key] = getSetValue(d3.select(this)) || undefined;
            dispatch.call("change", this, t, onInput);
        };
    }

    function key(lang) { return field.key + ':' + lang; }

    function changeLang(d) {
        var lang = getSetValue(d3.select(this)),
            t = {},
            language = _.find(wikipediaData, function(d) {
                return d[0].toLowerCase() === lang.toLowerCase() ||
                    d[1].toLowerCase() === lang.toLowerCase();
            });

        if (language) lang = language[2];

        if (d.lang && d.lang !== lang) {
            t[key(d.lang)] = undefined;
        }

        var value = getSetValue(d3.select(this.parentNode)
            .selectAll('.localized-value'));

        if (lang && value) {
            t[key(lang)] = value;
        } else if (lang && wikiTitles && wikiTitles[d.lang]) {
            t[key(lang)] = wikiTitles[d.lang];
        }

        d.lang = lang;
        dispatch.call("change", this, t);
    }

    function changeValue(d) {
        if (!d.lang) return;
        var t = {};
        t[key(d.lang)] = getSetValue(d3.select(this)) || undefined;
        dispatch.call("change", this, t);
    }

    function fetcher(value, cb) {
        var v = value.toLowerCase();

        cb(wikipediaData.filter(function(d) {
            return d[0].toLowerCase().indexOf(v) >= 0 ||
            d[1].toLowerCase().indexOf(v) >= 0 ||
            d[2].toLowerCase().indexOf(v) >= 0;
        }).map(function(d) {
            return { value: d[1] };
        }));
    }

    function render(selection, data) {
        var wraps = selection.selectAll('div.entry').
            data(data, function(d) { return d.lang; });

        var innerWrap = wraps.enter()
            .insert('div', ':first-child');

        innerWrap.attr('class', 'entry')
            .each(function() {
                var wrap = d3.select(this);
                var langcombo = d3combobox().fetcher(fetcher).minItems(0);

                var label = wrap.append('label')
                    .attr('class','form-label')
                    .text(t('translate.localized_translation_label'))
                    .attr('for','localized-lang');

                label.append('button')
                    .attr('class', 'minor remove')
                    .on('click', function(d){
                        d3.event.preventDefault();
                        var t = {};
                        t[key(d.lang)] = undefined;
                        dispatch.call("change", this, t);
                        d3.select(this.parentNode.parentNode)
                            .style('top','0')
                            .style('max-height','240px')
                            .transition()
                            .style('opacity', '0')
                            .style('max-height','0px')
                            .remove();
                    })
                    .call(Icon('#operation-delete'));

                wrap.append('input')
                    .attr('class', 'localized-lang')
                    .attr('type', 'text')
                    .attr('placeholder',t('translate.localized_translation_language'))
                    .on('blur', changeLang)
                    .on('change', changeLang)
                    .call(langcombo);

                wrap.append('input')
                    .on('blur', changeValue)
                    .on('change', changeValue)
                    .attr('type', 'text')
                    .attr('placeholder', t('translate.localized_translation_name'))
                    .attr('class', 'localized-value');
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
            .each('end', function() {
                d3.select(this)
                    .style('max-height', '')
                    .style('overflow', 'visible');
            });

        wraps.exit()
            .transition()
            .duration(200)
            .style('max-height','0px')
            .style('opacity', '0')
            .style('top','-10px')
            .remove();

        var entry = selection.selectAll('.entry');

        getSetValue(entry.select('.localized-lang'), function(d) {
                var lang = _.find(wikipediaData, function(lang) { return lang[2] === d.lang; });
                return lang ? lang[1] : d.lang;
            });

        getSetValue(entry.select('.localized-value'),
            function(d) { return d.value; });
    }

    localized.tags = function(tags) {
        // Fetch translations from wikipedia
        if (tags.wikipedia && !wikiTitles) {
            wikiTitles = {};
            var wm = tags.wikipedia.match(/([^:]+):(.+)/);
            if (wm && wm[0] && wm[1]) {
                wikipedia.translations(wm[1], wm[2], function(d) {
                    wikiTitles = d;
                });
            }
        }

        getSetValue(input, tags[field.key] || '');

        var postfixed = [], k, m;
        for (k in tags) {
            m = k.match(/^(.*):([a-zA-Z_-]+)$/);
            if (m && m[1] === field.key && m[2]) {
                postfixed.push({ lang: m[2], value: tags[k] });
            }
        }

        localizedInputs.call(render, postfixed.reverse());
    };

    localized.focus = function() {
        input.node().focus();
    };

    localized.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return localized;
    };

    return rebind(localized, dispatch, 'on');
}
