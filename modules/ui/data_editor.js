import { t } from '../core/localizer';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';

import { uiDataHeader } from './data_header';
import { uiSectionRawTagEditor } from './sections/raw_tag_editor';


export function uiDataEditor(context) {
    const dataHeader = uiDataHeader();
    const rawTagEditor = uiSectionRawTagEditor('custom-data-tag-editor', context)
        .expandedByDefault(true)
        .readOnlyTags([/./]);
    let _datum;


    function dataEditor(selection) {

        const header = selection.selectAll('.header')
            .data([0]);

        const headerEnter = header.enter()
            .append('div')
            .attr('class', 'header fillL');

        headerEnter
            .append('button')
            .attr('class', 'close')
            .attr('title', t('icons.close'))
            .on('click', function() {
                context.enter(modeBrowse(context));
            })
            .call(svgIcon('#iD-icon-close'));

        headerEnter
            .append('h2')
            .call(t.append('map_data.title'));


        let body = selection.selectAll('.body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'body')
            .merge(body);

        const editor = body.selectAll('.data-editor')
            .data([0]);

        // enter/update
        editor.enter()
            .append('div')
            .attr('class', 'modal-section data-editor')
            .merge(editor)
            .call(dataHeader.datum(_datum));

        const rte = body.selectAll('.raw-tag-editor')
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
