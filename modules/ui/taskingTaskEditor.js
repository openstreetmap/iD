

import { uiTaskingTaskHeader } from './taskingTaskHeader';
import { uiTaskingTaskDetails } from './taskingTaskDetails';


export function uiTaskingTaskEditor(context) {

    var taskHeader = uiTaskingTaskHeader();
    var taskDetails = uiTaskingTaskDetails();
    var _task;


    function taskEditor(selection) {


        var body = selection.selectAll('.tasking-body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'tasking-body')
            .merge(body);

        var editor = body.selectAll('.tasking-editor')
            .data([0]);

        // enter/update
        var editorEnter = editor.enter()
            .append('div')
            .attr('class', 'tasking-editor');

        // update
        editor = editorEnter
            .merge(editor)
            .call(taskHeader.task(_task))
            .call(taskDetails.task(_task, context));


    }


    taskEditor.task = function(val) {
        if (!arguments.length) return _task;
        _task = val;
        return this;
    };


    return taskEditor;
}
