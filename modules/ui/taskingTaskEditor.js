import { event as d3_event } from 'd3-selection';

import { t } from '../util/locale';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';

import { uiTaskingTaskHeader } from './taskingTaskHeader';
import { uiQuickLinks } from './quick_links';
import { uiRawTagEditor } from './raw_tag_editor';
import { uiTooltipHtml } from './tooltipHtml';


export function uiTaskingTaskEditor(context) {
    var taskHeader = uiTaskingTaskHeader();
    var quickLinks = uiQuickLinks();
    var rawTagEditor = uiRawTagEditor(context);
    var _datum;


    function taskEditor(selection) {
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


        var body = selection.selectAll('.body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'body')
            .merge(body);

        var editor = body.selectAll('.data-editor')
            .data([0]);

        // enter/update
        var editorEnter = editor.enter()
            .append('div')
            .attr('class', 'modal-section data-editor');

        // update
        editor = editorEnter
            .merge(editor)
            .call(taskHeader.datum(_datum));

        if (_datum && _datum.features) {

            editor
                .call(quickLinks.choices(choices));

            var details = body.selectAll('.testClass')
            .data(
                (_datum && _datum.features ? [_datum] : [0]),
                function(d) { return d.__featurehash__; }
            );

            details.enter()
                .append('div')
                .attr('class', function(d) {
                    return 'task-' + d.features[0].properties.taskId;
                });

            // var rte = body.selectAll('.raw-tag-editor')
            //     .data([0]);

            // // enter/update
            // rte.enter()
            //     .append('div')
            //     .attr('class', 'raw-tag-editor inspector-inner data-editor')
            //     .merge(rte)
            //     .call(rawTagEditor
            //         .expanded(true)
            //         .readOnlyTags([/./])
            //         .tags((_datum && _datum.properties) || {})
            //         .state('hover')
            //     )
            //     .selectAll('textarea.tag-text')
            //     .property('disabled', true)
            //     .classed('readonly', true);
        }
    }


    taskEditor.datum = function(val) {
        if (!arguments.length) return _datum;
        _datum = val;
        return this;
    };


    return taskEditor;
}
