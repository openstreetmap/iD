import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from '../modes/browse';
import { modeSelectError } from '../modes/select_error';

import { uiKeepRightDetails } from './keepRight_details';
import { uiViewOnKeepRight } from './view_on_keepRight';

import { utilNoAuto } from '../util';


export function uiKeepRightEditor(context) {
    var keepRightDetails = uiKeepRightDetails(context);

    var _error;

    function keepRightEditor(selection) {

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
            .call(keepRightDetails.error(_error))
            .call(keepRightSaveSection);


        var footer = selection.selectAll('.inspector-footer')
            .data([0]);

        footer.enter()
            .append('div')
            .attr('class', 'inspector-footer')
            .merge(footer)
            .call(uiViewOnKeepRight(context).what(_error));
    }


    function keepRightSaveSection(selection) {
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
            .text(t('QA.keepRight.comment'));

        saveSectionEnter
            .append('textarea')
            .attr('class', 'new-comment-input')
            .attr('placeholder', t('QA.keepRight.comment_placeholder'))
            .attr('maxlength', 1000)
            .property('value', function(d) { return d.newComment || d.comment; })
            .call(utilNoAuto)
            .on('input', changeInput)
            .on('blur', changeInput);

        // update
        saveSection = saveSectionEnter
            .merge(saveSection)
            .call(keepRightSaveButtons);


        function changeInput() {
            var input = d3_select(this);
            var val = input.property('value').trim();

            if (val === _error.comment) {
                val = undefined;
            }

            // store the unsaved comment with the error itself
            _error = _error.update({ newComment: val });

            var keepRight = services.keepRight;
            if (keepRight) {
                keepRight.replaceError(_error);  // update keepright cache
            }

            saveSection
                .call(keepRightSaveButtons);
        }
    }


    function keepRightSaveButtons(selection) {
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

        buttonSection.select('.comment-button')   // select and propagate data
            .attr('disabled', function(d) {
                return d.newComment === undefined ? true : null;
            })
            .on('click.comment', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var keepRight = services.keepRight;
                if (keepRight) {
                    keepRight.postKeepRightUpdate(d, remoteUpdateCallback);
                }
            });

        buttonSection.select('.close-button')   // select and propagate data
            .text(function(d) {
                var andComment = (d.newComment !== undefined ? '_comment' : '');
                return t('QA.keepRight.close' + andComment);
            })
            .on('click.close', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var keepRight = services.keepRight;
                if (keepRight) {
                    d.state = 'ignore_t';   // ignore temporarily (error fixed)
                    keepRight.postKeepRightUpdate(d, remoteUpdateCallback);
                }
            });

        buttonSection.select('.ignore-button')   // select and propagate data
            .text(function(d) {
                var andComment = (d.newComment !== undefined ? '_comment' : '');
                return t('QA.keepRight.ignore' + andComment);
            })
            .on('click.ignore', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var keepRight = services.keepRight;
                if (keepRight) {
                    d.state = 'ignore';   // ignore permanently (false positive)
                    keepRight.postKeepRightUpdate(d, remoteUpdateCallback);
                }
            });
    }

    function remoteUpdateCallback(err, error) {
        context.map().pan([0,0]);  // trigger a redraw

        if (err || !error || !error.id) {
            context.enter(modeBrowse(context));
        } else {
            context.enter(modeSelectError(context, error.id, 'keepRight'));
        }
    }


    keepRightEditor.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return keepRightEditor;
    };


    return keepRightEditor;
}
