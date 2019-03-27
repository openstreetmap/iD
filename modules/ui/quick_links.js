import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { tooltip } from '../util/tooltip';


export function uiQuickLinks() {
    var _choices = [];


    function quickLinks(selection) {
        var container = selection.selectAll('.quick-links')
            .data([0]);

        container = container.enter()
            .append('div')
            .attr('class', 'quick-links')
            .merge(container);

        var items = container.selectAll('.quick-link')
            .data(_choices, function(d) { return d.id; });

        items.exit()
            .remove();

        items.enter()
            .append('a')
            .attr('class', function(d) { return 'quick-link quick-link-' + d.id; })
            .attr('href', '#')
            .text(function(d) { return t(d.label); })
            .each(function(d) {
                if (typeof d.tooltip !== 'function') return;
                d3_select(this)
                    .call(tooltip().html(true).title(d.tooltip).placement('bottom'));
            })
            .on('click', function(d) {
                if (typeof d.click !== 'function') return;
                d3_event.preventDefault();
                d.click(d);
            });
    }


    //  val should be an array of choices like:
    //    [{
    //       id: 'link-id',
    //       label: 'translation.key',
    //       tooltip: function(d),
    //       click: function(d)
    //    }, ..]
    quickLinks.choices = function(val) {
        if (!arguments.length) return _choices;
        _choices = val;
        return quickLinks;
    };


    return quickLinks;
}
