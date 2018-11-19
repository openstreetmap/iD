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


export function uiFieldWikidata(field) {
    var dispatch = d3_dispatch('change'),
        link = d3_select(null),
        title = d3_select(null),
        wikiURL = '',
        entity;


    function wiki(selection) {

        title = selection.selectAll('input.wiki-title')
            .data([0]);

        title = title.enter()
            .append('input')
            .attr('type', 'text')
            .attr('class', 'wiki-title')
            .attr('id', 'preset-input-' + field.safeid)
            .call(utilNoAuto)
            .merge(title);

        title
            .on('blur', blur)
            .on('change', change);


        link = selection.selectAll('.wiki-link')
            .data([0]);

        link = link.enter()
            .append('button')
            .attr('class', 'button-input-action wiki-link minor')
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
