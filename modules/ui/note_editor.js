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
    uiNoteComments,
    uiNoteHeader,
    uiNoteReport,
    uiViewOnOSM,
} from './index';

import {
    utilNoAuto,
    utilRebind
} from '../util';


export function uiNoteEditor(context) {
    var dispatch = d3_dispatch('change');
    var noteComments = uiNoteComments();
    var noteHeader = uiNoteHeader();
    var _note;


    function noteEditor(selection) {
        var header = selection.selectAll('.header')
            .data([0]);

        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'header fillL');

        headerEnter
            .append('button')
            .attr('class', 'fr note-editor-close')
            .on('click', function() {
                var osm = services.osm;
                if (_note.isNew()) { osm.removeNote(_note); } // delete new note
                context.enter(modeBrowse(context));
            })
            .call(svgIcon('#iD-icon-close'));

        headerEnter
            .append('h3')
            .text(t('note.title'));


        var body = selection.selectAll('.body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'body')
            .merge(body);

        var editor = body.selectAll('.note-editor')
            .data([0]);

        editor = editor.enter()
            .append('div')
            .attr('class', 'modal-section note-editor')
            .merge(editor)
            .call(noteHeader.note(_note))
            .call(noteComments.note(_note))
            .call(noteSaveSection);


        var footer = selection.selectAll('.footer')
            .data([0]);

        footer = footer.enter()
            .append('div')
            .attr('class', 'footer')
            .merge(footer)
            .call(uiViewOnOSM(context).what(_note))
            .call(uiNoteReport(context).note(_note));


        // rerender the note editor on any auth change
        var osm = services.osm;
        if (osm) {
            osm.on('change.note-save', function() {
                selection.call(noteEditor);
            });
        }
    }


    function noteSaveSection(selection) {
        var isSelected = (_note && _note.id === context.selectedNoteID());
        var noteSave = selection.selectAll('.note-save')
            .data((isSelected ? [_note] : []), function(d) { return d.status + d.id; });

        // exit
        noteSave.exit()
            .remove();

        // enter
        var noteSaveEnter = noteSave.enter()
            .append('div')
            .attr('class', 'note-save save-section cf');

        noteSaveEnter
            .append('h4')
            .attr('class', '.note-save-header')
            .text(function() {
                return _note.isNew() ? t('note.newDescription') : t('note.newComment');
            });

        noteSaveEnter
            .append('textarea')
            .attr('id', 'new-comment-input')
            .attr('placeholder', t('note.inputPlaceholder'))
            .attr('maxlength', 1000)
            .property('value', function(d) { return d.newComment; })
            .call(utilNoAuto)
            .on('input', change)
            .on('blur', change);

        // update
        noteSave = noteSaveEnter
            .merge(noteSave)
            .call(userDetails)
            .call(noteSaveButtons);


        function change() {
            var input = d3_select(this);
            var val = input.property('value').trim() || undefined;

            // store the unsaved comment with the note itself
            _note = _note.update({ newComment: val });

            var osm = services.osm;
            if (osm) {
                osm.replaceNote(_note);  // update note cache
            }

            noteSave
                .call(noteSaveButtons);
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
            .on('click.note-login', function() {
                d3_event.preventDefault();
                osm.authenticate();
            });

        authEnter
            .transition()
            .duration(200)
            .style('opacity', 1);


        var prose = detailSection.selectAll('.note-save-prose')
            .data(hasAuth ? [0] : []);

        prose.exit()
            .remove();

        prose = prose.enter()
            .append('p')
            .attr('class', 'note-save-prose')
            .text(t('note.upload_explanation'))
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
                .html(t('note.upload_explanation_with_user', { user: userLink.html() }));
        });
    }


    function noteSaveButtons(selection) {
        var osm = services.osm;
        var hasAuth = osm && osm.authenticated();

        var isSelected = (_note && _note.id === context.selectedNoteID());
        var buttonSection = selection.selectAll('.buttons')
            .data((isSelected ? [_note] : []), function(d) { return d.status + d.id; });

        // exit
        buttonSection.exit()
            .remove();

        // enter
        var buttonEnter = buttonSection.enter()
            .append('div')
            .attr('class', 'buttons');

        buttonEnter
            .append('button')
            .attr('class', function() {
                return _note.isNew() ? 'button add-note-button action' : 'button status-button action';
            })
            .append('span')
            .attr('class', 'label');

        if (!_note.isNew()) {
            buttonEnter
                .append('button')
                .attr('class', 'button comment-button action')
                .append('span')
                .attr('class', 'label')
                .text(t('note.comment'));
        }

        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        buttonSection.select('.status-button')   // select and propagate data
            .attr('disabled', (hasAuth ? null : true))
            .text(function(d) {
                var action = (d.status === 'open' ? 'close' : 'open');
                var andComment = (d.newComment ? '_comment' : '');
                return t('note.' + action + andComment);
            })
            .on('click.status', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var osm = services.osm;
                if (osm) {
                    var setStatus = (d.status === 'open' ? 'closed' : 'open');
                    osm.postNoteUpdate(d, setStatus, function(err, note) {
                        dispatch.call('change', note);
                    });
                }
            });

        buttonSection.select('.comment-button')   // select and propagate data
            .attr('disabled', function(d) {
                return (hasAuth && d.status === 'open' && d.newComment) ? null : true;
            })
            .on('click.save', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var osm = services.osm;
                if (osm) {
                    osm.postNoteUpdate(d, d.status, function(err, note) {
                        dispatch.call('change', note);
                    });
                }
            });

        buttonSection.select('.add-note-button')   // select and propagate data
            .text(t('note.newNote'))
            .attr('disabled', function(d) {
                return (d.status === 'open' && d.newComment) ? null : true;
            })
            .on('click.save', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var osm = services.osm;
                if (osm) {
                    osm.postNoteCreate(d, function(err, note) {
                        dispatch.call('change', note);
                    });
                }
            });
    }


    noteEditor.note = function(_) {
        if (!arguments.length) return _note;
        _note = _;
        return noteEditor;
    };


    return utilRebind(noteEditor, dispatch, 'on');
}
