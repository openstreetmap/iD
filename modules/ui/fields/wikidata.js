import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { actionChangeTags } from '../../actions/change_tags';
import { services } from '../../services/index';
import { svgIcon } from '../../svg/icon';
import { utilGetSetValue, utilNoAuto, utilRebind } from '../../util';
import { uiCombobox } from '../combobox';
import { t } from '../../core/localizer';


export function uiFieldWikidata(field, context) {
    const wikidata = services.wikidata;
    const dispatch = d3_dispatch('change');

    let _selection = d3_select(null);
    let _searchInput = d3_select(null);
    let _qid = null;
    let _wikidataEntity = null;
    let _wikiURL = '';
    let _entityIDs = [];

    const _wikipediaKey = field.keys && field.keys.find(function(key) {
        return key.includes('wikipedia');
    });
    const _hintKey = field.key === 'wikidata' ? 'name' : field.key.split(':')[0];

    const combobox = uiCombobox(context, 'combo-' + field.safeid)
        .caseSensitive(true)
        .minItems(1);


    function wiki(selection) {
        _selection = selection;

        let wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);


        let list = wrap.selectAll('ul')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'rows')
            .merge(list);

        let searchRow = list.selectAll('li.wikidata-search')
            .data([0]);

        const searchRowEnter = searchRow.enter()
            .append('li')
            .attr('class', 'wikidata-search');

        searchRowEnter
            .append('input')
            .attr('type', 'text')
            .attr('id', field.domId)
            .style('flex', '1')
            .call(utilNoAuto)
            .on('focus', function() {
                const node = d3_select(this).node();
                node.setSelectionRange(0, node.value.length);
            })
            .on('blur', function() {
                setLabelForEntity();
            })
            .call(combobox.fetcher(fetchWikidataItems));

        combobox.on('accept', function(d) {
            if (d) {
                _qid = d.id;
                change();
            }
        }).on('cancel', function() {
            setLabelForEntity();
        });

        searchRowEnter
            .append('button')
            .attr('class', 'form-field-button wiki-link')
            .attr('title', t('icons.view_on', { domain: 'wikidata.org' }))
            .call(svgIcon('#iD-icon-out-link'))
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                if (_wikiURL) window.open(_wikiURL, '_blank');
            });

        searchRow = searchRow.merge(searchRowEnter);

        _searchInput = searchRow.select('input');

        const wikidataProperties = ['description', 'identifier'];

        const items = list.selectAll('li.labeled-input')
            .data(wikidataProperties);

        // Enter
        const enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'labeled-input preset-wikidata-' + d; });

        enter
            .append('div')
            .attr('class', 'label')
            .html(function(d) { return t.html('wikidata.' + d); });

        enter
            .append('input')
            .attr('type', 'text')
            .call(utilNoAuto)
            .classed('disabled', 'true')
            .attr('readonly', 'true');

        enter
            .append('button')
            .attr('class', 'form-field-button')
            .attr('title', t('icons.copy'))
            .call(svgIcon('#iD-operation-copy'))
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                d3_select(this.parentNode)
                    .select('input')
                    .node()
                    .select();
                document.execCommand('copy');
            });

    }

    function fetchWikidataItems(q, callback) {
        if (!q && _hintKey) {
            // other tags may be good search terms
            for (const i in _entityIDs) {
                const entity = context.hasEntity(_entityIDs[i]);
                if (entity.tags[_hintKey]) {
                    q = entity.tags[_hintKey];
                    break;
                }
            }
        }

        wikidata.itemsForSearchQuery(q, function(err, data) {
            if (err) {
                if (err !== 'No query') console.error(err); // eslint-disable-line
                return;
            }

            const result = data.map(function (item) {
                return {
                    id: item.id,
                    value: item.display.label.value + ' (' + item.id + ')',
                    display: selection => selection.append('span')
                        .attr('class', 'localized-text')
                        .attr('lang', item.display.label.language)
                        .text(item.display.label.value),
                    title: item.display.description && item.display.description.value,
                    terms: item.aliases
                };
            });

            if (callback) callback(result);
        });
    }


    function change() {
        const syncTags = {};
        syncTags[field.key] = _qid;
        dispatch.call('change', this, syncTags);

        // attempt asynchronous update of wikidata tag..
        const initGraph = context.graph();
        const initEntityIDs = _entityIDs;

        wikidata.entityByQID(_qid, function(err, entity) {
            if (err) return;

            // If graph has changed, we can't apply this update.
            if (context.graph() !== initGraph) return;

            if (!entity.sitelinks) return;

            const langs = wikidata.languagesToQuery();
            // use the label and description languages as fallbacks
            ['labels', 'descriptions'].forEach(function(key) {
                if (!entity[key]) return;

                const valueLangs = Object.keys(entity[key]);
                if (valueLangs.length === 0) return;
                const valueLang = valueLangs[0];

                if (langs.indexOf(valueLang) === -1) {
                    langs.push(valueLang);
                }
            });

            let newWikipediaValue;

            if (_wikipediaKey) {
                let foundPreferred;
                for (const i in langs) {
                    const lang = langs[i];
                    const siteID = lang.replace('-', '_') + 'wiki';
                    if (entity.sitelinks[siteID]) {
                        foundPreferred = true;
                        newWikipediaValue = lang + ':' + entity.sitelinks[siteID].title;
                        // use the first match
                        break;
                    }
                }

                if (!foundPreferred) {
                    // No wikipedia sites available in the user's language or the fallback languages,
                    // default to any wikipedia sitelink

                    const wikiSiteKeys = Object.keys(entity.sitelinks).filter(function(site) {
                        return site.endsWith('wiki');
                    });

                    if (wikiSiteKeys.length === 0) {
                        // if no wikipedia pages are linked to this wikidata entity, delete that tag
                        newWikipediaValue = null;
                    } else {
                        const wikiLang = wikiSiteKeys[0].slice(0, -4).replace('_', '-');
                        const wikiTitle = entity.sitelinks[wikiSiteKeys[0]].title;
                        newWikipediaValue = wikiLang + ':' + wikiTitle;
                    }
                }
            }

            if (newWikipediaValue) {
                newWikipediaValue = context.cleanTagValue(newWikipediaValue);
            }

            if (typeof newWikipediaValue === 'undefined') return;

            const actions = initEntityIDs.map(function(entityID) {
                const entity = context.hasEntity(entityID);
                if (!entity) return null;

                const currTags = Object.assign({}, entity.tags);  // shallow copy
                if (newWikipediaValue === null) {
                    if (!currTags[_wikipediaKey]) return null;

                    delete currTags[_wikipediaKey];
                } else {
                    currTags[_wikipediaKey] = newWikipediaValue;
                }

                return actionChangeTags(entityID, currTags);
            }).filter(Boolean);

            if (!actions.length) return;

            // Coalesce the update of wikidata tag into the previous tag change
            context.overwrite(
                function actionUpdateWikipediaTags(graph) {
                    actions.forEach(function(action) {
                        graph = action(graph);
                    });
                    return graph;
                },
                context.history().undoAnnotation()
            );

            // do not dispatch.call('change') here, because entity_editor
            // changeTags() is not intended to be called asynchronously
        });
    }

    function setLabelForEntity() {
        let label = {
          value: ''
        };
        if (_wikidataEntity) {
            label = entityPropertyForDisplay(_wikidataEntity, 'labels');
            if (label.value.length === 0) {
                label.value = _wikidataEntity.id.toString();
            }
        }
        utilGetSetValue(_searchInput, label.value)
            .attr('lang', label.language);
    }


    wiki.tags = function(tags) {

        const isMixed = Array.isArray(tags[field.key]);
        _searchInput
            .attr('title', isMixed ? tags[field.key].filter(Boolean).join('\n') : null)
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : '')
            .classed('mixed', isMixed);

        _qid = typeof tags[field.key] === 'string' && tags[field.key] || '';

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

            const description = entityPropertyForDisplay(entity, 'descriptions');

            _selection.select('button.wiki-link')
                .classed('disabled', false);

            _selection.select('.preset-wikidata-description')
                .style('display', function(){
                    return description.value.length > 0 ? 'flex' : 'none';
                })
                .select('input')
                .attr('value', description.value)
                .attr('lang', description.language);

            _selection.select('.preset-wikidata-identifier')
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

            _selection.select('.preset-wikidata-description')
                .style('display', 'none');
            _selection.select('.preset-wikidata-identifier')
                .style('display', 'none');

            _selection.select('button.wiki-link')
                .classed('disabled', true);

            if (_qid && _qid !== '') {
                _wikiURL = 'https://wikidata.org/wiki/Special:Search?search=' + _qid;
            } else {
                _wikiURL = '';
            }
        }
    };

    function entityPropertyForDisplay(wikidataEntity, propKey) {
        const blankResponse = { value: '' };
        if (!wikidataEntity[propKey]) return blankResponse;
        const propObj = wikidataEntity[propKey];
        const langKeys = Object.keys(propObj);
        if (langKeys.length === 0) return blankResponse;
        // sorted by priority, since we want to show the user's language first if possible
        const langs = wikidata.languagesToQuery();
        for (const i in langs) {
            const lang = langs[i];
            const valueObj = propObj[lang];
            if (valueObj && valueObj.value && valueObj.value.length > 0) return valueObj;
        }
        // default to any available value
        return propObj[langKeys[0]];
    }


    wiki.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        return wiki;
    };


    wiki.focus = function() {
        _searchInput.node().focus();
    };


    return utilRebind(wiki, dispatch, 'on');
}
