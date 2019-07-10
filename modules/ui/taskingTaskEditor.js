

import { uiTaskingTaskHeader } from './taskingTaskHeader';
import { uiTaskingTaskDetails } from './taskingTaskDetails';


export function uiTaskingTaskEditor(context) {

    var taskHeader = uiTaskingTaskHeader();
    var taskDetails = uiTaskingTaskDetails();
    var _datum;


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
            .attr('class', 'modal-section tasking-editor');

        // update
        editor = editorEnter
            .merge(editor)
            .call(taskHeader.datum(_datum))
            .call(taskDetails.datum(_datum, context));


    }


    taskEditor.datum = function(val) {
        if (!arguments.length) return _datum;
        _datum = val;
        return this;
    };


    return taskEditor;
}
