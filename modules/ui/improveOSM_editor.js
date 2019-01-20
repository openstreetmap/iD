import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from '../modes';
import { svgIcon } from '../svg';

import {
    uiImproveOsmDetails,
    uiImproveOsmHeader,
    uiQuickLinks,
    uiTooltipHtml
} from './index';

import { utilNoAuto, utilRebind } from '../util';


export function uiImproveOsmEditor(context) {
    var dispatch = d3_dispatch('change');
    var errorDetails = uiImproveOsmDetails(context);
    var errorHeader = uiImproveOsmHeader(context);
    var quickLinks = uiQuickLinks();

    var _error;


    function improveOsmEditor(selection) {
        // quick links
        var choices = [{
            id: 'zoom_to',
            label: 'inspector.zoom_to.title',
            tooltip: function() {
                return uiTooltipHtml(t('inspector.zoom_to.tooltip_issue'), t('inspector.zoom_to.key'));
            },
            click: function zoomTo() {
                context.mode().zoomToSelected();
            }
        }];


        var header = selection.selectAll('.header')
            .data([0]);

        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'header fillL');

        headerEnter
            .append('button')
            .attr('class', 'fr keepRight-editor-close')
            .on('click', function() {
                context.enter(modeBrowse(context));
            })
            .call(svgIcon('#iD-icon-close'));

        headerEnter
            .append('h3')
            .text(t('QA.improveOSM.title'));


        var body = selection.selectAll('.body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'body')
            .merge(body);

        var editor = body.selectAll('.keepRight-editor')
            .data([0]);

        editor.enter()
            .append('div')
            .attr('class', 'modal-section keepRight-editor')
            .merge(editor)
            .call(errorHeader.error(_error))
            .call(quickLinks.choices(choices))
            .call(errorDetails.error(_error));
    }

    improveOsmEditor.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return improveOsmEditor;
    };


    return utilRebind(improveOsmEditor, dispatch, 'on');
}
