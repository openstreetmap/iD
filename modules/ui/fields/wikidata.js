import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    event as d3_event
} from 'd3-selection';

import { uiCombobox } from '../index';

import { services } from '../../services/index';

import { svgIcon } from '../../svg/index';
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
            .attr('title', t('icons.open_wikidata'))
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
            q = context.entity(_entity.id).tags.name || '';
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
        var syncTags = {
            wikidata: _qid
        };
        dispatch.call('change', this, syncTags);
    }

    function setLabelForEntity() {
        var label = '';
        if (_wikidataEntity) {
            if (_wikidataEntity.labels && Object.keys(_wikidataEntity.labels).length > 0) {
                label = _wikidataEntity.labels[Object.keys(_wikidataEntity.labels)[0]].value;
            }
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

            var description = '';

            if (entity.descriptions && Object.keys(entity.descriptions).length > 0) {
                description = entity.descriptions[Object.keys(entity.descriptions)[0]].value;
            }

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
