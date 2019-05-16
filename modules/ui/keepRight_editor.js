import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';

import { uiKeepRightDetails } from './keepRight_details';
import { uiKeepRightHeader } from './keepRight_header';
import { uiQuickLinks } from './quick_links';
import { uiTooltipHtml } from './tooltipHtml';
import { uiViewOnKeepRight } from './view_on_keepRight';

import { utilNoAuto, utilRebind } from '../util';


export function uiKeepRightEditor(context) {
    var dispatch = d3_dispatch('change');
    var keepRightDetails = uiKeepRightDetails(context);
    var keepRightHeader = uiKeepRightHeader(context);
    var quickLinks = uiQuickLinks();

    var _error;


    function keepRightEditor(selection) {
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
            .text(t('QA.keepRight.title'));


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
            .call(keepRightHeader.error(_error))
            .call(quickLinks.choices(choices))
            .call(keepRightDetails.error(_error))
            .call(keepRightSaveSection);


        var footer = selection.selectAll('.footer')
            .data([0]);

        footer.enter()
            .append('div')
            .attr('class', 'footer')
            .merge(footer)
            .call(uiViewOnKeepRight(context).what(_error));
    }


    function keepRightSaveSection(selection) {
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

        buttonSection.select('.comment-button')   // select and propagate data
            .attr('disabled', function(d) {
                return d.newComment === undefined ? true : null;
            })
            .on('click.comment', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var keepRight = services.keepRight;
                if (keepRight) {
                    keepRight.postKeepRightUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
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
                    keepRight.postKeepRightUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
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
                    keepRight.postKeepRightUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
                }
            });
    }


    keepRightEditor.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return keepRightEditor;
    };


    return utilRebind(keepRightEditor, dispatch, 'on');
}
