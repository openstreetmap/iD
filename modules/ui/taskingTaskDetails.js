import { event as d3_event } from 'd3-selection';
import { uiQuickLinks } from './quick_links';

import { t } from '../util/locale';

export function uiTaskingTaskDetails() {

    var quickLinks = uiQuickLinks();

    var _datum;
    var _context;


    function taskingTaskDetails(selection) {
         // quick links
         var choices = [{
            id: 'zoom_to',
            label: 'inspector.zoom_to.title',
            click: function zoomTo() {
              d3_event.preventDefault();
              d3_event.stopPropagation();
              _context.layers().layer('tasking').fitZoom();
            }
        }];


        var details = selection.selectAll('.task-details')
            .data(
                (_datum && _datum.properties ? [_datum] : []),
                function(d) { return d.__featurehash__; }
            );

        // exit
        details.exit()
            .remove();

        // enter
        var detailsEnter = details.enter()
            .append('div')
            .attr('class', 'task-details');

        detailsEnter
            .append('div')
            .attr('class', 'task-status');


        details = detailsEnter
            .merge(details);

        details
            .call(quickLinks.choices(choices));

        details.select('.task-status')
            .text(function(d) {
                return t('tasking.task.status', { status:
                    function() {
                        var status = 'tasking.task.statuses.' + d.properties.status.toLowerCase();
                        return t(status);
                    }()
                });
            });

    }


    taskingTaskDetails.datum = function(val, context) {
        if (!arguments.length) return _datum;
        _datum = val;

        if (context) { _context = context; }
        return this;
    };


    return taskingTaskDetails;
}