import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    event as d3_event
} from 'd3-selection';

import { services } from '../../services/index';

import { svgIcon } from '../../svg/index';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';

import { t } from '../../util/locale';


export function uiFieldWikidata(field) {
    var wikidata = services.wikidata;
    var dispatch = d3_dispatch('change');
    var link = d3_select(null);
    var title = d3_select(null);
    var _wikiURL = '';


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
            .attr('class', 'labeled-inputs')
            .merge(list);

        var wikidataProperties = ['identifier', 'label', 'description'];

        var items = list.selectAll('li')
            .data(wikidataProperties);

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'preset-wikidata-' + d; });

        enter
            .append('span')
            .attr('class', 'label')
            .attr('for', function(d) { return 'preset-input-wikidata-' + d; })
            .text(function(d) { return t('wikidata.' + d); });

        var inputWrap = enter
            .append('div')
            .attr('class', 'input-wrap');

        inputWrap
            .append('input')
            .attr('type', 'text')
            .attr('class', 'preset-input-wikidata')
            .attr('id', function(d) { return 'preset-input-wikidata-' + d; });


        title = wrap.select('.preset-wikidata-identifier input')
            .call(utilNoAuto)
            .merge(title);

        title
            .on('blur', blur)
            .on('change', change);

        var idItem = wrap.select('.preset-wikidata-identifier');

        idItem.select('button')
            .remove();

        link = idItem
            .append('button')
            .attr('class', 'form-field-button wiki-link')
            .attr('title', t('icons.open_wikidata'))
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-out-link'))
            .merge(link);

        link
            .on('click', function() {
                d3_event.preventDefault();
                if (_wikiURL) window.open(_wikiURL, '_blank');
            });

        var readOnlyItems = wrap.selectAll('li:not(.preset-wikidata-identifier)');

        readOnlyItems.select('input')
            .classed('disabled', 'true')
            .attr('readonly', 'true');

        readOnlyItems.select('button')
            .remove();

        readOnlyItems.append('button')
            .attr('class', 'form-field-button wiki-link')
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


    function blur() {
        change();
    }


    function change() {
        var syncTags = {
            wikidata: utilGetSetValue(title)
        };
        dispatch.call('change', this, syncTags);
    }


    wiki.tags = function(tags) {
        var value = tags[field.key] || '';
        utilGetSetValue(title, value);

        if (!/^Q[0-9]*$/.test(value)) {   // not a proper QID
            unrecognized();
            return;
        }

        // QID value in correct format
        _wikiURL = 'https://wikidata.org/wiki/' + value;
        wikidata.entityByQID(value, function(err, entity) {
            if (err) {
                unrecognized();
                return;
            }

            var label = '';
            var description = '';

            if (entity.labels && Object.keys(entity.labels).length > 0) {
                label = entity.labels[Object.keys(entity.labels)[0]].value;
            }
            if (entity.descriptions && Object.keys(entity.descriptions).length > 0) {
                description = entity.descriptions[Object.keys(entity.descriptions)[0]].value;
            }

            d3_select('.preset-wikidata-label')
                .style('display', function(){
                    return label.length > 0 ? 'flex' : 'none';
                })
                .select('input')
                .attr('value', label);

            d3_select('.preset-wikidata-description')
                .style('display', function(){
                    return description.length > 0 ? 'flex' : 'none';
                })
                .select('input')
                .attr('value', description);
        });


        // not a proper QID
        function unrecognized() {
            d3_select('.preset-wikidata-label')
                .style('display', 'none');
            d3_select('.preset-wikidata-description')
                .style('display', 'none');

            if (value && value !== '') {
                _wikiURL = 'https://wikidata.org/wiki/Special:Search?search=' + value;
            } else {
                _wikiURL = '';
            }
        }
    };


    wiki.focus = function() {
        title.node().focus();
    };


    return utilRebind(wiki, dispatch, 'on');
}
