import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    event as d3_event
} from 'd3-selection';

import { uiCombobox } from '../combobox';

import { actionChangeTags } from '../../actions/change_tags';
import { services } from '../../services/index';

import { svgIcon } from '../../svg/icon';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';

import { t } from '../../util/locale';


export function uiFieldWikidata(field, context) {
    var wikidata = services.wikidata;
    var dispatch = d3_dispatch('change');
    var searchInput = d3_select(null);
    var _qid = null;
    var _wikidataEntity = null;
    var _wikiURL = '';
    var _entity;

    var _wikipediaKey = field.keys && field.keys.find(function(key) {
            return key.includes('wikipedia');
        }),
        _hintKey = field.key === 'wikidata' ? 'name' : field.key.split(':')[0];

    var combobox = uiCombobox(context, 'combo-' + field.safeid)
        .caseSensitive(true)
        .minItems(1);

    function wiki(selection) {

        var wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);


        var list = wrap.selectAll('ul')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'rows')
            .merge(list);

        var searchRow = list.selectAll('li.wikidata-search')
            .data([0]);

        var searchRowEnter = searchRow.enter()
            .append('li')
            .attr('class', 'wikidata-search');

        searchInput = searchRowEnter
            .append('input')
            .attr('type', 'text')
            .style('flex', '1')
            .call(utilNoAuto);

        searchInput
            .on('focus', function() {
                var node = d3_select(this).node();
                node.setSelectionRange(0, node.value.length);
            })
            .on('blur', function() {
                setLabelForEntity();
            })
            .call(combobox.fetcher(fetchWikidataItems));

        combobox.on('accept', function(d) {
            _qid = d.id;
            change();
        }).on('cancel', function() {
            setLabelForEntity();
        });

        searchRowEnter
            .append('button')
            .attr('class', 'form-field-button wiki-link')
            .attr('title', t('icons.view_on', { domain: 'wikidata.org' }))
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-out-link'))
            .on('click', function() {
                d3_event.preventDefault();
                if (_wikiURL) window.open(_wikiURL, '_blank');
            });

        var wikidataProperties = ['description', 'identifier'];

        var items = list.selectAll('li.labeled-input')
            .data(wikidataProperties);

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'labeled-input preset-wikidata-' + d; });

        enter
            .append('span')
            .attr('class', 'label')
            .attr('for', function(d) { return 'preset-input-wikidata-' + d; })
            .text(function(d) { return t('wikidata.' + d); });

        enter
            .append('input')
            .attr('type', 'text')
            .attr('id', function(d) { return 'preset-input-wikidata-' + d; })
            .call(utilNoAuto)
            .classed('disabled', 'true')
            .attr('readonly', 'true');

        enter
            .append('button')
            .attr('class', 'form-field-button')
            .attr('title', t('icons.copy'))
            .attr('tabindex', -1)
            .call(svgIcon('#iD-operation-copy'))
            .on('click', function() {
                d3_event.preventDefault();
                d3_select(this.parentNode)
                    .select('input')
                    .node()
                    .select();
                document.execCommand('copy');
            });

    }

    function fetchWikidataItems(q, callback) {

        if (!q && _entity) {
            q = (_hintKey && context.entity(_entity.id).tags[_hintKey]) || '';
        }

        wikidata.itemsForSearchQuery(q, function(err, data) {
            if (err) return;

            for (var i in data) {
                data[i].value = data[i].label + ' (' +  data[i].id + ')';
                data[i].title = data[i].description;
            }

            if (callback) callback(data);
        });
    }


    function change() {
        var syncTags = {};
        syncTags[field.key] = _qid;
        dispatch.call('change', this, syncTags);

        // attempt asynchronous update of wikidata tag..
        var initGraph = context.graph();
        var initEntityID = _entity.id;

        wikidata.entityByQID(_qid, function(err, entity) {
            if (err) return;

            // If graph has changed, we can't apply this update.
            if (context.graph() !== initGraph) return;

            if (!entity.sitelinks) return;

            var langs = wikidata.languagesToQuery();
            // use the label and description languages as fallbacks
            ['labels', 'descriptions'].forEach(function(key) {
                if (!entity[key]) return;

                var valueLangs = Object.keys(entity[key]);
                if (valueLangs.length === 0) return;
                var valueLang = valueLangs[0];

                if (langs.indexOf(valueLang) === -1) {
                    langs.push(valueLang);
                }
            });

            var currTags = Object.assign({}, context.entity(initEntityID).tags);  // shallow copy

            if (_wikipediaKey) {
                var foundPreferred;
                for (var i in langs) {
                    var lang = langs[i];
                    var siteID = lang.replace('-', '_') + 'wiki';
                    if (entity.sitelinks[siteID]) {
                        foundPreferred = true;
                        currTags[_wikipediaKey] = lang + ':' + entity.sitelinks[siteID].title;
                        // use the first match
                        break;
                    }
                }

                if (!foundPreferred) {
                    // No wikipedia sites available in the user's language or the fallback languages,
                    // default to any wikipedia sitelink

                    var wikiSiteKeys = Object.keys(entity.sitelinks).filter(function(site) {
                        return site.endsWith('wiki');
                    });

                    if (wikiSiteKeys.length === 0) {
                        // if no wikipedia pages are linked to this wikidata entity, delete that tag
                        if (currTags[_wikipediaKey]) {
                            delete currTags[_wikipediaKey];
                        }
                    } else {
                        var wikiLang = wikiSiteKeys[0].slice(0, -4).replace('_', '-');
                        var wikiTitle = entity.sitelinks[wikiSiteKeys[0]].title;
                        currTags[_wikipediaKey] = wikiLang + ':' + wikiTitle;
                    }
                }
            }

            // Coalesce the update of wikidata tag into the previous tag change
            context.overwrite(
                actionChangeTags(initEntityID, currTags),
                context.history().undoAnnotation()
            );

            // do not dispatch.call('change') here, because entity_editor
            // changeTags() is not intended to be called asynchronously

        });
    }

    function setLabelForEntity() {
        var label = '';
        if (_wikidataEntity) {
            label = entityPropertyForDisplay(_wikidataEntity, 'labels');
            if (label.length === 0) {
                label = _wikidataEntity.id.toString();
            }
        }
        utilGetSetValue(d3_select('li.wikidata-search input'), label);
    }


    wiki.tags = function(tags) {
        _qid = tags[field.key] || '';

        if (!/^Q[0-9]*$/.test(_qid)) {   // not a proper QID
            unrecognized();
            return;
        }

        // QID value in correct format
        _wikiURL = 'https://wikidata.org/wiki/' + _qid;
        wikidata.entityByQID(_qid, function(err, entity) {
            if (err) {
                unrecognized();
                return;
            }
            _wikidataEntity = entity;

            setLabelForEntity();

            var description = entityPropertyForDisplay(entity, 'descriptions');

            d3_select('.form-field-wikidata button.wiki-link')
                .classed('disabled', false);

            d3_select('.preset-wikidata-description')
                .style('display', function(){
                    return description.length > 0 ? 'flex' : 'none';
                })
                .select('input')
                .attr('value', description);

            d3_select('.preset-wikidata-identifier')
                .style('display', function(){
                    return entity.id ? 'flex' : 'none';
                })
                .select('input')
                .attr('value', entity.id);
        });


        // not a proper QID
        function unrecognized() {
            _wikidataEntity = null;
            setLabelForEntity();

            d3_select('.preset-wikidata-description')
                .style('display', 'none');
            d3_select('.preset-wikidata-identifier')
                .style('display', 'none');

            d3_select('.form-field-wikidata button.wiki-link')
                .classed('disabled', true);

            if (_qid && _qid !== '') {
                _wikiURL = 'https://wikidata.org/wiki/Special:Search?search=' + _qid;
            } else {
                _wikiURL = '';
            }
        }
    };

    function entityPropertyForDisplay(wikidataEntity, propKey) {
        if (!wikidataEntity[propKey]) return '';
        var propObj = wikidataEntity[propKey];
        var langKeys = Object.keys(propObj);
        if (langKeys.length === 0) return '';
        // sorted by priority, since we want to show the user's language first if possible
        var langs = wikidata.languagesToQuery();
        for (var i in langs) {
            var lang = langs[i];
            var valueObj = propObj[lang];
            if (valueObj && valueObj.value && valueObj.value.length > 0) return valueObj.value;
        }
        // default to any available value
        return propObj[langKeys[0]].value;
    }


    wiki.entity = function(val) {
        if (!arguments.length) return _entity;
        _entity = val;
        return wiki;
    };


    wiki.focus = function() {
        searchInput.node().focus();
    };


    return utilRebind(wiki, dispatch, 'on');
}
