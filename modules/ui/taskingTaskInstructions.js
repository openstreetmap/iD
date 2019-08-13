import { t } from '../util/locale';


export function uiTaskInstructions() {
    var _task;


    function taskInstructions(selection) {
        if (!Object.keys(_task).length) return;

        var instructions = selection.selectAll('.task-instructions-container')
            .data([0]);

        instructions = instructions.enter()
            .append('div')
            .attr('class', 'task-instructions-container')
            .merge(instructions);

        instructions
            .append('p')
            .attr('class', 'task-instructions')
            .text(_task.instructions());

        instructions
            .append('h3')
            .attr('class', 'perTaskInstructions-header')
            .text(function () {
                return _task.perTaskInstructions().length ?
                t('tasking.task.tabs.instructions.perTaskInstructions') :
                '';
            });

        instructions
            .append('p')
            .attr('class', 'task-instructions')
            .text(_task.perTaskInstructions());
    }


    taskInstructions.task = function(val) {
        if (!arguments.length) return _task;
        _task = val;
        return taskInstructions;
    };


    return taskInstructions;
}
