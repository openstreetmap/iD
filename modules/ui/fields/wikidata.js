import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    event as d3_event
} from 'd3-selection';

import { svgIcon } from '../../svg/index';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';

import { t } from '../../util/locale';


export function uiFieldWikidata(field) {
    var dispatch = d3_dispatch('change'),
        link = d3_select(null),
        title = d3_select(null),
        wikiURL = '',
        entity;


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


        var items = list.selectAll('li')
            .data(field.keys);

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'preset-access-' + d; });

        enter
            .append('span')
            .attr('class', 'label preset-label-access')
            .attr('for', function(d) { return 'preset-input-wikidata-' + d; })
            .text(t('wikidata.identifier'));

        var inputWrap = enter
            .append('div')
            .attr('class', 'preset-input-wikidata-wrap');

        title = inputWrap.append('input')
            .attr('type', 'text')
            .attr('class', 'preset-input-wikidata')
            .attr('id', function(d) { return 'preset-input-wikidata-' + d; })
            .call(utilNoAuto)
            .merge(title);

        title
            .on('blur', blur)
            .on('change', change);

        link = enter
            .append('button')
            .attr('class', 'form-field-button wiki-link')
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-out-link'))
            .merge(link);

        link
            .on('click', function() {
                d3_event.preventDefault();
                if (wikiURL) window.open(wikiURL, '_blank');
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
        var value = tags[field.key] || '',
            matches = value.match(/^Q[0-9]*$/);

        utilGetSetValue(title, value);

        // value in correct format
        if (matches) {
            wikiURL = 'https://wikidata.org/wiki/' + value;
        // unrecognized value format
        } else {
            if (value && value !== '') {
                wikiURL = 'https://wikidata.org/wiki/Special:Search?search=' + value;
            } else {
                wikiURL = '';
            }
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


    return utilRebind(wiki, dispatch, 'on');
}
