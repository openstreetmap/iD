import { event as d3_event } from 'd3-selection';
import { uiQuickLinks } from './quick_links';

import { uiTaskingTaskHeader } from './taskingTaskHeader';
import { uiTaskingTaskDetails } from './taskingTaskDetails';


export function uiTaskingTaskEditor(context) {

    var quickLinks = uiQuickLinks();

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
            .call(toggleQuickLinks)
            .call(toggleTaskDetails);

        // if (_datum.features) {
        //     editor
        //         .call(quickLinks.choices(choices))
        //         .merge(editor)
        //         .call(taskDetails.datum(_datum));
        // }

    }


    function toggleQuickLinks(selection) {
        // quick links
        var choices = [{
            id: 'zoom_to',
            label: 'inspector.zoom_to.title',
            click: function zoomTo() {
              d3_event.preventDefault();
              d3_event.stopPropagation();
              context.layers().layer('tasking').fitZoom();
            }
        }];

        if (_datum.features) {
            selection
                .call(quickLinks.choices(choices));
        }
    }


    function toggleTaskDetails(selection) {
        if (_datum.features) {
            selection
                .call(taskDetails.datum(_datum));
        }
    }


    taskEditor.datum = function(val) {
        if (!arguments.length) return _datum;
        _datum = val;
        return this;
    };


    return taskEditor;
}
