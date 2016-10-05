import * as d3 from 'd3';
import { utilRebind } from '../util/rebind';
import { uiToggle } from './toggle';


export function uiDisclosure() {
    var dispatch = d3.dispatch('toggled'),
        title,
        expanded = false,
        content = function () {};


    var disclosure = function(selection) {
        var hideToggle = selection.selectAll('.hide-toggle')
            .data([0]);

        hideToggle = hideToggle.enter()
            .append('a')
            .attr('href', '#')
            .attr('class', 'hide-toggle')
            .merge(hideToggle);

        hideToggle
            .text(title)
            .on('click', toggle)
            .classed('expanded', expanded);


        var wrap = selection.selectAll('div')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .merge(wrap);

        wrap
            .classed('hide', !expanded)
            .call(content);


        function toggle() {
            expanded = !expanded;
            hideToggle.classed('expanded', expanded);
            wrap.call(uiToggle(expanded));
            dispatch.call('toggled', this, expanded);
        }
    };


    disclosure.title = function(_) {
        if (!arguments.length) return title;
        title = _;
        return disclosure;
    };


    disclosure.expanded = function(_) {
        if (!arguments.length) return expanded;
        expanded = _;
        return disclosure;
    };


    disclosure.content = function(_) {
        if (!arguments.length) return content;
        content = _;
        return disclosure;
    };


    return utilRebind(disclosure, dispatch, 'on');
}
