import { dispatch as d3_dispatch } from 'd3-dispatch';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';

import { uiOsmoseDetails } from './osmose_details';
import { uiOsmoseHeader } from './osmose_header';
import { uiQuickLinks } from './quick_links';
import { uiTooltipHtml } from './tooltipHtml';

import { utilRebind } from '../util';


export function uiOsmoseEditor(context) {
    var dispatch = d3_dispatch('change');
    var errorDetails = uiOsmoseDetails(context);
    var errorHeader = uiOsmoseHeader(context);
    var quickLinks = uiQuickLinks();

    var _error;


    function osmoseEditor(selection) {
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
            .attr('class', 'fr error-editor-close')
            .on('click', function() {
                context.enter(modeBrowse(context));
            })
            .call(svgIcon('#iD-icon-close'));

        headerEnter
            .append('h3')
            .text(t('QA.osmose.title'));


        var body = selection.selectAll('.body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'body')
            .merge(body);

        var editor = body.selectAll('.error-editor')
            .data([0]);

        editor.enter()
            .append('div')
            .attr('class', 'modal-section error-editor')
            .merge(editor)
            .call(errorHeader.error(_error))
            .call(quickLinks.choices(choices))
            .call(errorDetails.error(_error))
            .call(osmoseSaveSection);
    }

    function osmoseSaveSection(selection) {
        var isSelected = (_error && _error.id === context.selectedErrorID());
        var isShown = (_error && isSelected);
        var saveSection = selection.selectAll('.error-save')
            .data(
                (isShown ? [_error] : []),
                function(d) { return d.id + '-' + (d.status || 0); }
            );

        // exit
        saveSection.exit()
            .remove();

        // enter
        var saveSectionEnter = saveSection.enter()
            .append('div')
            .attr('class', 'error-save save-section cf');

        // update
        saveSection = saveSectionEnter
            .merge(saveSection)
            .call(errorSaveButtons);
    }

    function errorSaveButtons(selection) {
        var isSelected = (_error && _error.id === context.selectedErrorID());
        var buttonSection = selection.selectAll('.buttons')
            .data((isSelected ? [_error] : []), function(d) { return d.status + d.id; });

        // exit
        buttonSection.exit()
            .remove();

        // enter
        var buttonEnter = buttonSection.enter()
            .append('div')
            .attr('class', 'buttons');

        buttonEnter
            .append('button')
            .attr('class', 'button close-button action');

        buttonEnter
            .append('button')
            .attr('class', 'button ignore-button action');


        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        buttonSection.select('.close-button')
            .text(function(d) {
                return t('QA.keepRight.close');
            })
            .on('click.close', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var errorService = services.osmose;
                if (errorService) {
                    d.newStatus = '/done';
                    errorService.postUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
                }
            });

        buttonSection.select('.ignore-button')
            .text(function(d) {
                return t('QA.keepRight.ignore');
            })
            .on('click.ignore', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var errorService = services.osmose;
                if (errorService) {
                    d.newStatus = '/false';
                    errorService.postUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
                }
            });
    }

    osmoseEditor.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return osmoseEditor;
    };


    return utilRebind(osmoseEditor, dispatch, 'on');
}