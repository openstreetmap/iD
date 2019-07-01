import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from '../modes/browse';
import { modeSelectError } from '../modes/select_error';

import { uiImproveOsmComments } from './improveOSM_comments';
import { uiImproveOsmDetails } from './improveOSM_details';

import { utilNoAuto } from '../util';


export function uiImproveOsmEditor(context) {
    var errorDetails = uiImproveOsmDetails(context);
    var errorComments = uiImproveOsmComments(context);

    var _error;

    function improveOsmEditor(selection) {

        var body = selection.selectAll('.inspector-body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'inspector-body sep-top')
            .merge(body);

        var editor = body.selectAll('.error-editor')
            .data([0]);

        editor.enter()
            .append('div')
            .attr('class', 'modal-section error-editor')
            .merge(editor)
            .call(errorDetails.error(_error))
            .call(errorComments.error(_error))
            .call(improveOsmSaveSection);
    }

    function improveOsmSaveSection(selection) {
        var isSelected = (_error && context.mode().selectedErrorID && _error.id === context.mode().selectedErrorID());
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
        var isSelected = (_error && context.mode().selectedErrorID && _error.id === context.mode().selectedErrorID());
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
                    errorService.postUpdate(d, remoteUpdateCallback);
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
                    errorService.postUpdate(d, remoteUpdateCallback);
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
                    errorService.postUpdate(d, remoteUpdateCallback);
                }
            });
    }

    function remoteUpdateCallback(err, error) {
        context.map().pan([0,0]);  // trigger a redraw

        if (err || !error || !error.id) {
            context.enter(modeBrowse(context));
        } else {
            context.enter(modeSelectError(context, error.id, 'improveOSM'));
        }
    }

    improveOsmEditor.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return improveOsmEditor;
    };


    return improveOsmEditor;
}
