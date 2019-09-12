

import { uiTaskingProjectHeader } from './taskingProjectHeader';
import { uiTaskingProjectDetails } from './taskingProjectDetails';


export function uiTaskingProjectEditor(context) {

    var projectHeader = uiTaskingProjectHeader();
    var projectDetails = uiTaskingProjectDetails();
    var _project;


    function projectEditor(selection) {


        var body = selection.selectAll('.tasking-project-body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'tasking-project-body')
            .merge(body);

        var editor = body.selectAll('.tasking-project-editor')
            .data([0]);

        // enter/update
        var editorEnter = editor.enter()
            .append('div')
            .attr('class', 'tasking-project-editor');

        // update
        editor = editorEnter
            .merge(editor)
            .call(projectHeader.project(_project))
            .call(projectDetails.project(_project));


    }


    projectEditor.project = function(val) {
        if (!arguments.length) return _project;
        _project = val;
        return this;
    };


    return projectEditor;
}
