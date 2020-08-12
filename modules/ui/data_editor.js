import { t } from '../core/localizer';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';

import { uiDataHeader } from './data_header';
import { uiSectionRawTagEditor } from './sections/raw_tag_editor';


export function uiDataEditor(context) {
    var dataHeader = uiDataHeader();
    var rawTagEditor = uiSectionRawTagEditor('custom-data-tag-editor', context)
        .expandedByDefault(true)
        .readOnlyTags([/./]);
    var _datum;


    function dataEditor(selection) {

        var header = selection.selectAll('.header')
            .data([0]);

        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'header fillL');

        headerEnter
            .append('button')
            .attr('class', 'close')
            .on('click', function() {
                context.enter(modeBrowse(context));
            })
            .call(svgIcon('#iD-icon-close'));

        headerEnter
            .append('h3')
            .text(t('map_data.title'));


        var body = selection.selectAll('.body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'body')
            .merge(body);

        var editor = body.selectAll('.data-editor')
            .data([0]);

        // enter/update
        editor.enter()
            .append('div')
            .attr('class', 'modal-section data-editor')
            .merge(editor)
            .call(dataHeader.datum(_datum));

        var rte = body.selectAll('.raw-tag-editor')
            .data([0]);

        // enter/update
        rte.enter()
            .append('div')
            .attr('class', 'raw-tag-editor data-editor')
            .merge(rte)
            .call(rawTagEditor
                .tags((_datum && _datum.properties) || {})
                .state('hover')
                .render
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
