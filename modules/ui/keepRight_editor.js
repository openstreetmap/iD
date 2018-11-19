import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from '../modes';
import { svgIcon } from '../svg';

import {
    uiKeepRightComment,
    uiKeepRightDetails,
    uiKeepRightHeader,
    uiViewOnKeepRight,
} from './index';

import {
    utilNoAuto,
    utilRebind
} from '../util';


export function uiKeepRightEditor(context) {
    var dispatch = d3_dispatch('change');
    var keepRightComment = uiKeepRightComment();
    var keepRightDetails = uiKeepRightDetails(context);
    var keepRightHeader = uiKeepRightHeader(context);

    var _error;


    function keepRightEditor(selection) {
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
            .attr('class', 'modal-section keepRight-editor')
            .merge(editor)
            .call(keepRightHeader.error(_error))
            .call(keepRightDetails.error(_error))
            .call(keepRightComment.error(_error))
            .call(errorSaveSection);


        var footer = selection.selectAll('.footer')
            .data([0]);

        footer.enter()
            .append('div')
            .attr('class', 'footer')
            .merge(footer)
            .call(uiViewOnKeepRight(context).what(_error));
    }


    function errorSaveSection(selection) {
        var isSelected = (_error && _error.id === context.selectedErrorID());
        var errorSave = selection.selectAll('.error-save')
            .data((isSelected ? [_error] : []), function(d) { return d.status + d.id; });

        // exit
        errorSave.exit()
            .remove();

        // enter
        var errorSaveEnter = errorSave.enter()
            .append('div')
            .attr('class', 'keepRight-save save-section cf');

        errorSaveEnter
            .append('h4')
            .attr('class', '.error-save-header')
            .text(function(d) {
                return d.comment ? t('QA.keepRight.updateComment') : t('QA.keepRight.newComment');
            });

        errorSaveEnter
            .append('textarea')
            .attr('class', 'new-comment-input')
            .attr('placeholder', function(d) {
                return d.comment ? t('QA.keepRight.updateInputPlaceholder') : t('QA.keepRight.newInputPlaceholder');
            })
            .attr('maxlength', 1000)
            .property('value', function(d) { return d.newComment; })
            .call(utilNoAuto)
            .on('input', changeInput)
            .on('blur', changeInput);

        // update
        errorSave = errorSaveEnter
            .merge(errorSave)
            .call(userDetails)
            .call(errorSaveButtons);


        function changeInput() {
            var input = d3_select(this);
            var val = input.property('value').trim() || undefined;

            // store the unsaved comment with the error itself
            _error = _error.update({ newComment: val });

            var keepRight = services.keepRight;
            if (keepRight) {
                keepRight.replaceError(_error);  // update keepright cache
            }

            errorSave
                .call(errorSaveButtons);
        }
    }


    function userDetails(selection) {
        var detailSection = selection.selectAll('.detail-section')
            .data([0]);

        detailSection = detailSection.enter()
            .append('div')
            .attr('class', 'detail-section')
            .merge(detailSection);

        var osm = services.osm;
        if (!osm) return;

        // Add warning if user is not logged in
        var hasAuth = osm.authenticated();
        var authWarning = detailSection.selectAll('.auth-warning')
            .data(hasAuth ? [] : [0]);

        authWarning.exit()
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();

        var authEnter = authWarning.enter()
            .insert('div', '.tag-reference-body')
            .attr('class', 'field-warning auth-warning')
            .style('opacity', 0);

        authEnter
            .call(svgIcon('#iD-icon-alert', 'inline'));

        authEnter
            .append('span')
            .text(t('note.login'));

        authEnter
            .append('a')
            .attr('target', '_blank')
            .call(svgIcon('#iD-icon-out-link', 'inline'))
            .append('span')
            .text(t('login'))
            .on('click.error-login', function() {
                d3_event.preventDefault();
                osm.authenticate();
            });

        authEnter
            .transition()
            .duration(200)
            .style('opacity', 1);


        var prose = detailSection.selectAll('.error-save-prose')
            .data(hasAuth ? [0] : []);

        prose.exit()
            .remove();

        prose = prose.enter()
            .append('p')
            .attr('class', 'error-save-prose')
            .text(t('QA.keepRight.upload_explanation'))
            .merge(prose);

        osm.userDetails(function(err, user) {
            if (err) return;

            var userLink = d3_select(document.createElement('div'));

            if (user.image_url) {
                userLink
                    .append('img')
                    .attr('src', user.image_url)
                    .attr('class', 'icon pre-text user-icon');
            }

            userLink
                .append('a')
                .attr('class', 'user-info')
                .text(user.display_name)
                .attr('href', osm.userURL(user.display_name))
                .attr('tabindex', -1)
                .attr('target', '_blank');

            prose
                .html(t('QA.keepRight.upload_explanation_with_user', { user: userLink.html() }));
        });
    }


    function errorSaveButtons(selection) {
        var osm = services.osm;
        var hasAuth = osm && osm.authenticated();

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
            .attr('class', 'button resolve-button action');

        buttonEnter
            .append('button')
            .attr('class', 'button ignore-button action');

        buttonEnter
            .append('button')
            .attr('class', 'button comment-button action')
            .text(t('note.comment'));


        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        buttonSection.select('.cancel-button')   // select and propagate data
            .on('click.cancel', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var keepRight = services.keepRight;
                if (keepRight) {
                    keepRight.removeError(d);
                }
                context.enter(modeBrowse(context));
                dispatch.call('change');
            });

        buttonSection.select('.resolve-button')   // select and propagate data
            .attr('disabled', (hasAuth ? null : true))
            .text(function(d) {
                // NOTE: no state is available because keepRight export only exports open errors
                var andComment = (d.newComment ? '_comment' : '');
                return t('QA.keepRight.resolve' + andComment);
            })
            .on('click.state', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var keepRight = services.keepRight;
                if (keepRight) {

                    d.state = d.state === 'ignore_t' ? '' : 'ignore_t';
                    keepRight.postKeepRightUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
                }
            });

        buttonSection.select('.ignore-button')   // select and propagate data
            .attr('disabled', (hasAuth ? null : true))
            .text(function(d) {
                var andComment = (d.newComment ? '_comment' : '');
                return t('QA.keepRight.ignore' + andComment);
            })
            .on('click.state', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var keepRight = services.keepRight;
                if (keepRight) {
                    d.state = d.state === 'ignore' ? '' : 'ignore';
                    keepRight.postKeepRightUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
                }
            });

        buttonSection.select('.comment-button')   // select and propagate data
            .attr('disabled', function(d) {
                return (hasAuth && d.newComment) ? null : true;
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
    }


    keepRightEditor.error = function(_) {
        if (!arguments.length) return _error;
        _error = _;
        return keepRightEditor;
    };


    return utilRebind(keepRightEditor, dispatch, 'on');
}
