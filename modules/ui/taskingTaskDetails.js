import { t } from '../util/locale';

export function uiTaskingTaskDetails() {

    var _datum;


    function taskingTaskDetails(selection) {


        var details = selection.selectAll('.task-details')
            .data(
                (_datum && _datum.features ? [_datum.features[0].properties] : [0]),
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

        details.select('.task-status')
            .text(function(d) {
                return t('tasking.task.status', { status:
                    function() {
                        var status = 'tasking.task.statuses.' + d.taskStatus.toLowerCase();
                        return t(status);
                    }()
                });
            });

    }


    taskingTaskDetails.datum = function(val) {
        if (!arguments.length) return _datum;
        _datum = val;
        return this;
    };


    return taskingTaskDetails;
}