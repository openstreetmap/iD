

import { uiTaskingTaskHeader } from './taskingTaskHeader';
import { uiTaskingTaskDetails } from './taskingTaskDetails';


export function uiTaskingTaskEditor(context) {

    var taskHeader = uiTaskingTaskHeader();
    var taskDetails = uiTaskingTaskDetails(context);
    var _task;


    function taskEditor(selection) {


        var body = selection.selectAll('.tasking-task-body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'tasking-task-body')
            .merge(body);

        var editor = body.selectAll('.tasking-task-editor')
            .data([0]);

        // enter/update
        var editorEnter = editor.enter()
            .append('div')
            .attr('class', 'tasking-task-editor');

        // update
        editor = editorEnter
            .merge(editor)
            .call(taskHeader.task(_task))
            .call(taskDetails.task(_task));


    }


    taskEditor.task = function(val) {
        if (!arguments.length) return _task;
        _task = val;
        return this;
    };


    return taskEditor;
}
