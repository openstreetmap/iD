import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';

import { uiImproveOsmComments } from './improveOSM_comments';
import { uiImproveOsmDetails } from './improveOSM_details';
import { uiImproveOsmHeader } from './improveOSM_header';
import { uiQuickLinks } from './quick_links';
import { uiTooltipHtml } from './tooltipHtml';

import { utilNoAuto, utilRebind } from '../util';


export function uiImproveOsmEditor(context) {
    var dispatch = d3_dispatch('change');
    var errorDetails = uiImproveOsmDetails(context);
    var errorComments = uiImproveOsmComments(context);
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
            .attr('class', 'fr error-editor-close')
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

        var editor = body.selectAll('.error-editor')
            .data([0]);

        editor.enter()
            .append('div')
            .attr('class', 'modal-section error-editor')
            .merge(editor)
            .call(errorHeader.error(_error))
            .call(quickLinks.choices(choices))
            .call(errorDetails.error(_error))
            .call(errorComments.error(_error))
            .call(improveOsmSaveSection);
    }

    function improveOsmSaveSection(selection) {
        var isSelected = (_error && _error.id === context.selectedErrorID());
        var isShown = (_error && (isSelected || _error.newComment || _error.comment));
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

        saveSectionEnter
            .append('h4')
            .attr('class', '.error-save-header')
            .text(t('note.newComment'));

        saveSectionEnter
            .append('textarea')
            .attr('class', 'new-comment-input')
            .attr('placeholder', t('QA.keepRight.comment_placeholder'))
            .attr('maxlength', 1000)
            .property('value', function(d) { return d.newComment; })
            .call(utilNoAuto)
            .on('input', changeInput)
            .on('blur', changeInput);

        // update
        saveSection = saveSectionEnter
            .merge(saveSection)
            .call(errorSaveButtons);

        function changeInput() {
            var input = d3_select(this);
            var val = input.property('value').trim();

            if (val === '') {
                val = undefined;
            }

            // store the unsaved comment with the error itself
            _error = _error.update({ newComment: val });

            var errorService = services.improveOSM;
            if (errorService) {
                errorService.replaceError(_error);
            }

            saveSection
                .call(errorSaveButtons);
        }
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
            .attr('class', 'button comment-button action')
            .text(t('QA.keepRight.save_comment'));

        buttonEnter
            .append('button')
            .attr('class', 'button close-button action');

        buttonEnter
            .append('button')
            .attr('class', 'button ignore-button action');


        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        buttonSection.select('.comment-button')
            .attr('disabled', function(d) {
                return d.newComment === undefined ? true : null;
            })
            .on('click.comment', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var errorService = services.improveOSM;
                if (errorService) {
                    errorService.postUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
                }
            });

        buttonSection.select('.close-button')
            .text(function(d) {
                var andComment = (d.newComment !== undefined ? '_comment' : '');
                return t('QA.keepRight.close' + andComment);
            })
            .on('click.close', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var errorService = services.improveOSM;
                if (errorService) {
                    d.newStatus = 'SOLVED';
                    errorService.postUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
                }
            });

        buttonSection.select('.ignore-button')
            .text(function(d) {
                var andComment = (d.newComment !== undefined ? '_comment' : '');
                return t('QA.keepRight.ignore' + andComment);
            })
            .on('click.ignore', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var errorService = services.improveOSM;
                if (errorService) {
                    d.newStatus = 'INVALID';
                    errorService.postUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
                }
            });
    }

    improveOsmEditor.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return improveOsmEditor;
    };


    return utilRebind(improveOsmEditor, dispatch, 'on');
}
