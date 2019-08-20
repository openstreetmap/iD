
import { uiRawTagEditor } from './raw_tag_editor';

export function uiDataEditor(context) {
    var rawTagEditor = uiRawTagEditor(context);
    var _datum;


    function dataEditor(selection) {

        var body = selection.selectAll('.inspector-body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'inspector-body sep-top')
            .merge(body);

        var editor = body.selectAll('.data-editor')
            .data([0]);

        // enter/update
        editor.enter()
            .merge(editor);

        var rte = body.selectAll('.raw-tag-editor')
            .data([0]);

        // enter/update
        rte.enter()
            .append('div')
            .attr('class', 'raw-tag-editor inspector-inner data-editor')
            .merge(rte)
            .call(rawTagEditor
                .expanded(true)
                .readOnlyTags([/./])
                .tags((_datum && _datum.properties) || {})
                .state('hover')
            )
            .selectAll('textarea.tag-text')
            .attr('readonly', true)
            .classed('readonly', true);
    }


    dataEditor.datum = function(val) {
        if (!arguments.length) return _datum;
        _datum = val;
        return this;
    };


    return dataEditor;
}
