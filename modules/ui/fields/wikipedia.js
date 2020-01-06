import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    event as d3_event
} from 'd3-selection';

import { t } from '../../util/locale';
import { actionChangeTags } from '../../actions/change_tags';
import { dataWikipedia } from '../../../data/index';
import { services } from '../../services/index';
import { svgIcon } from '../../svg/icon';
import { uiCombobox } from '../combobox';
import { utilDetect } from '../../util/detect';
import { utilGetSetValue, utilNoAuto, utilRebind } from '../../util';


export function uiFieldWikipedia(field, context) {
    var dispatch = d3_dispatch('change');
    var wikipedia = services.wikipedia;
    var wikidata = services.wikidata;
    var lang = d3_select(null);
    var title = d3_select(null);
    var _wikiURL = '';
    var _entity;

    var langCombo = uiCombobox(context, 'wikipedia-lang')
        .fetcher(function(value, cb) {
            var v = value.toLowerCase();

            cb(dataWikipedia.filter(function(d) {
                return d[0].toLowerCase().indexOf(v) >= 0 ||
                    d[1].toLowerCase().indexOf(v) >= 0 ||
                    d[2].toLowerCase().indexOf(v) >= 0;
            }).map(function(d) {
                return { value: d[1] };
            }));
        });

    var titleCombo = uiCombobox(context, 'wikipedia-title')
        .fetcher(function(value, cb) {
            if (!value && _entity) {
                value = context.entity(_entity.id).tags.name || '';
            }

            var searchfn = value.length > 7 ? wikipedia.search : wikipedia.suggestions;
            searchfn(language()[2], value, function(query, data) {
                cb(data.map(function(d) {
                    return { value: d };
                }));
            });
        });


    function wiki(selection) {
        var wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);


        var langRow = wrap.selectAll('.wiki-lang-container')
            .data([0]);

        langRow = langRow.enter()
            .append('div')
            .attr('class', 'wiki-lang-container')
            .merge(langRow);


        lang = langRow.selectAll('input.wiki-lang')
            .data([0]);

        lang = lang.enter()
            .append('input')
            .attr('type', 'text')
            .attr('class', 'wiki-lang')
            .attr('placeholder', t('translate.localized_translation_language'))
            .call(utilNoAuto)
            .call(langCombo)
            .merge(lang);

        utilGetSetValue(lang, language()[1]);

        lang
            .on('blur', changeLang)
            .on('change', changeLang);


        var titleRow = wrap.selectAll('.wiki-title-container')
            .data([0]);

        titleRow = titleRow.enter()
            .append('div')
            .attr('class', 'wiki-title-container')
            .merge(titleRow);

        title = titleRow.selectAll('input.wiki-title')
            .data([0]);

        title = title.enter()
            .append('input')
            .attr('type', 'text')
            .attr('class', 'wiki-title')
            .attr('id', 'preset-input-' + field.safeid)
            .call(utilNoAuto)
            .call(titleCombo)
            .merge(title);

        title
            .on('blur', blur)
            .on('change', change);


        var link = titleRow.selectAll('.wiki-link')
            .data([0]);

        link = link.enter()
            .append('button')
            .attr('class', 'form-field-button wiki-link')
            .attr('tabindex', -1)
            .attr('title', t('icons.view_on', { domain: 'wikipedia.org' }))
            .call(svgIcon('#iD-icon-out-link'))
            .merge(link);

        link
            .on('click', function() {
                d3_event.preventDefault();
                if (_wikiURL) window.open(_wikiURL, '_blank');
            });
    }


    function language() {
        var value = utilGetSetValue(lang).toLowerCase();
        var locale = utilDetect().locale.toLowerCase();
        var localeLanguage;
        return dataWikipedia.find(function(d) {
            if (d[2] === locale) localeLanguage = d;
            return d[0].toLowerCase() === value ||
                d[1].toLowerCase() === value ||
                d[2] === value;
        }) || localeLanguage || ['English', 'English', 'en'];
    }


    function changeLang() {
        utilGetSetValue(lang, language()[1]);
        change(true);
    }


    function blur() {
        change(true);
    }


    function change(skipWikidata) {
        var value = utilGetSetValue(title);
        var m = value.match(/https?:\/\/([-a-z]+)\.wikipedia\.org\/(?:wiki|\1-[-a-z]+)\/([^#]+)(?:#(.+))?/);
        var l = m && dataWikipedia.find(function(d) { return m[1] === d[2]; });
        var syncTags = {};

        if (l) {
            // Normalize title http://www.mediawiki.org/wiki/API:Query#Title_normalization
            value = decodeURIComponent(m[2]).replace(/_/g, ' ');
            if (m[3]) {
                var anchor;
                // try {
                // leave this out for now - #6232
                    // Best-effort `anchordecode:` implementation
                    // anchor = decodeURIComponent(m[3].replace(/\.([0-9A-F]{2})/g, '%$1'));
                // } catch (e) {
                    anchor = decodeURIComponent(m[3]);
                // }
                value += '#' + anchor.replace(/_/g, ' ');
            }
            value = value.slice(0, 1).toUpperCase() + value.slice(1);
            utilGetSetValue(lang, l[1]);
            utilGetSetValue(title, value);
        }

        if (value) {
            syncTags.wikipedia = language()[2] + ':' + value;
        } else {
            syncTags.wikipedia = undefined;
        }

        dispatch.call('change', this, syncTags);


        if (skipWikidata || !value || !language()[2]) return;

        // attempt asynchronous update of wikidata tag..
        var initGraph = context.graph();
        var initEntityID = _entity.id;

        wikidata.itemsByTitle(language()[2], value, function(err, data) {
            if (err) return;

            // If graph has changed, we can't apply this update.
            if (context.graph() !== initGraph) return;

            if (!data || !Object.keys(data).length) return;

            var qids = Object.keys(data);
            var value = qids && qids.find(function(id) { return id.match(/^Q\d+$/); });
            var currTags = Object.assign({}, context.entity(initEntityID).tags);  // shallow copy

            currTags.wikidata = value;

            // Coalesce the update of wikidata tag into the previous tag change
            context.overwrite(
                actionChangeTags(initEntityID, currTags),
                context.history().undoAnnotation()
            );

            // do not dispatch.call('change') here, because entity_editor
            // changeTags() is not intended to be called asynchronously
        });
    }


    wiki.tags = function(tags) {
        var value = tags[field.key] || '';
        var m = value.match(/([^:]+):([^#]+)(?:#(.+))?/);
        var l = m && dataWikipedia.find(function(d) { return m[1] === d[2]; });
        var anchor = m && m[3];

        // value in correct format
        if (l) {
            utilGetSetValue(lang, l[1]);
            utilGetSetValue(title, m[2] + (anchor ? ('#' + anchor) : ''));
            if (anchor) {
                try {
                    // Best-effort `anchorencode:` implementation
                    anchor = encodeURIComponent(anchor.replace(/ /g, '_')).replace(/%/g, '.');
                } catch (e) {
                    anchor = anchor.replace(/ /g, '_');
                }
            }
            _wikiURL = 'https://' + m[1] + '.wikipedia.org/wiki/' +
                m[2].replace(/ /g, '_') + (anchor ? ('#' + anchor) : '');

        // unrecognized value format
        } else {
            utilGetSetValue(title, value);
            if (value && value !== '') {
                utilGetSetValue(lang, '');
                _wikiURL = 'https://en.wikipedia.org/wiki/Special:Search?search=' + value;
            } else {
                _wikiURL = '';
            }
        }
    };


    wiki.entity = function(val) {
        if (!arguments.length) return _entity;
        _entity = val;
        return wiki;
    };


    wiki.focus = function() {
        title.node().focus();
    };


    return utilRebind(wiki, dispatch, 'on');
}
