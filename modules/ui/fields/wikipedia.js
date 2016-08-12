import { rebind } from '../../util/rebind';
import { d3combobox } from '../../../js/lib/d3.combobox.js';
import * as d3 from 'd3';
import { t } from '../../util/locale';
import _ from 'lodash';
import { ChangeTags } from '../../actions/index';
import { Detect } from '../../util/detect';
import { Icon } from '../../svg/index';
import { wikipedia as wikipediaData } from '../../../data/index';
import {
    wikipedia as wikipediaService,
    wikidata as wikidataService
} from '../../services/index';

export function wikipedia(field, context) {
    var dispatch = d3.dispatch('change'),
        wikipedia = wikipediaService.init(),
        wikidata = wikidataService.init(),
        link, entity, lang, title;

    function wiki(selection) {
        var langcombo = d3combobox()
            .fetcher(function(value, cb) {
                var v = value.toLowerCase();

                cb(wikipediaData.filter(function(d) {
                    return d[0].toLowerCase().indexOf(v) >= 0 ||
                        d[1].toLowerCase().indexOf(v) >= 0 ||
                        d[2].toLowerCase().indexOf(v) >= 0;
                }).map(function(d) {
                    return { value: d[1] };
                }));
            });

        var titlecombo = d3combobox()
            .fetcher(function(value, cb) {

                if (!value) value = context.entity(entity.id).tags.name || '';
                var searchfn = value.length > 7 ? wikipedia.search : wikipedia.suggestions;

                searchfn(language()[2], value, function(query, data) {
                    cb(data.map(function(d) {
                        return { value: d };
                    }));
                });
            });

        lang = selection.selectAll('input.wiki-lang')
            .data([0]);

        getSetValue(lang.enter().append('input')
            .attr('type', 'text')
            .attr('class', 'wiki-lang')
            .attr('placeholder', t('translate.localized_translation_language')),
            language()[1]);

        lang
            .call(langcombo)
            .on('blur', changeLang)
            .on('change', changeLang);

        title = selection.selectAll('input.wiki-title')
            .data([0]);

        title.enter().append('input')
            .attr('type', 'text')
            .attr('class', 'wiki-title')
            .attr('id', 'preset-input-' + field.id);

        title
            .call(titlecombo)
            .on('blur', blur)
            .on('change', change);

        link = selection.selectAll('a.wiki-link')
            .data([0]);

        link.enter().append('a')
            .attr('class', 'wiki-link button-input-action minor')
            .attr('tabindex', -1)
            .attr('target', '_blank')
            .call(Icon('#icon-out-link', 'inline'));
    }

    function language() {
        var value = getSetValue(lang).toLowerCase();
        var locale = Detect().locale.toLowerCase();
        var localeLanguage;
        return _.find(wikipediaData, function(d) {
            if (d[2] === locale) localeLanguage = d;
            return d[0].toLowerCase() === value ||
                d[1].toLowerCase() === value ||
                d[2] === value;
        }) || localeLanguage || ['English', 'English', 'en'];
    }

    function changeLang() {
        getSetValue(lang, language()[1]);
        change(true);
    }

    function blur() {
        change(true);
    }

    function change(skipWikidata) {
        var value = getSetValue(title),
            m = value.match(/https?:\/\/([-a-z]+)\.wikipedia\.org\/(?:wiki|\1-[-a-z]+)\/([^#]+)(?:#(.+))?/),
            l = m && _.find(wikipediaData, function(d) { return m[1] === d[2]; }),
            anchor,
            syncTags = {};

        if (l) {
            // Normalize title http://www.mediawiki.org/wiki/API:Query#Title_normalization
            value = decodeURIComponent(m[2]).replace(/_/g, ' ');
            if (m[3]) {
                try {
                    // Best-effort `anchordecode:` implementation
                    anchor = decodeURIComponent(m[3].replace(/\.([0-9A-F]{2})/g, '%$1'));
                } catch (e) {
                    anchor = decodeURIComponent(m[3]);
                }
                value += '#' + anchor.replace(/_/g, ' ');
            }
            value = value.slice(0, 1).toUpperCase() + value.slice(1);
            getSetValue(lang, l[1]);
            getSetValue(title, value);
        }

        syncTags.wikipedia = value ? language()[2] + ':' + value : undefined;
        if (!skipWikidata) {
            syncTags.wikidata = undefined;
        }

        dispatch.call("change", this, syncTags);


        if (skipWikidata || !value || !language()[2]) return;

        // attempt asynchronous update of wikidata tag..
        var initEntityId = entity.id,
            initWikipedia = context.entity(initEntityId).tags.wikipedia;

        wikidata.itemsByTitle(language()[2], value, function (title, data) {
            // 1. most recent change was a tag change
            var annotation = t('operations.change_tags.annotation'),
                currAnnotation = context.history().undoAnnotation();
            if (currAnnotation !== annotation) return;

            // 2. same entity exists and still selected
            var selectedIds = context.selectedIDs(),
                currEntityId = selectedIds.length > 0 && selectedIds[0];
            if (currEntityId !== initEntityId) return;

            // 3. wikipedia value has not changed
            var currTags = _.clone(context.entity(currEntityId).tags),
                qids = data && Object.keys(data);
            if (initWikipedia !== currTags.wikipedia) return;

            // ok to coalesce the update of wikidata tag into the previous tag change
            currTags.wikidata = qids && _.find(qids, function (id) {
                return id.match(/^Q\d+$/);
            });

            context.overwrite(ChangeTags(currEntityId, currTags), annotation);
            dispatch.call("change", this, currTags);
        });
    }

    wiki.tags = function(tags) {
        var value = tags[field.key] || '',
            m = value.match(/([^:]+):([^#]+)(?:#(.+))?/),
            l = m && _.find(wikipediaData, function(d) { return m[1] === d[2]; }),
            anchor = m && m[3];

        // value in correct format
        if (l) {
            getSetValue(lang, l[1]);
            getSetValue(title, m[2] + (anchor ? ('#' + anchor) : ''));
            if (anchor) {
                try {
                    // Best-effort `anchorencode:` implementation
                    anchor = encodeURIComponent(anchor.replace(/ /g, '_')).replace(/%/g, '.');
                } catch (e) {
                    anchor = anchor.replace(/ /g, '_');
                }
            }
            link.attr('href', 'https://' + m[1] + '.wikipedia.org/wiki/' +
                m[2].replace(/ /g, '_') + (anchor ? ('#' + anchor) : ''));

        // unrecognized value format
        } else {
            getSetValue(title, value);
            if (value && value !== '') {
                getSetValue(lang, '');
            }
            link.attr('href', 'https://en.wikipedia.org/wiki/Special:Search?search=' + value);
        }
    };

    wiki.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return wiki;
    };

    wiki.focus = function() {
        title.node().focus();
    };

    return rebind(wiki, dispatch, 'on');
}
