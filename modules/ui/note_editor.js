import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';

import { modeBrowse } from '../modes';
import { svgIcon } from '../svg';
import { uiNoteComments } from './note_comments';
import { uiNoteHeader } from './note_header';
import {
    utilNoAuto,
    utilRebind
} from '../util';


export function uiNoteEditor(context) {
    var dispatch = d3_dispatch('update');
    var noteHeader = uiNoteHeader();
    var noteComments = uiNoteComments();
    var _note;


    function noteEditor(selection) {
        var header = selection.selectAll('.header')
            .data([0]);

        var enter = header.enter()
            .append('div')
            .attr('class', 'header fillL');

        enter
            .append('button')
            .attr('class', 'fr note-editor-close')
            .on('click', function() { context.enter(modeBrowse(context)); })
            .call(svgIcon('#iD-icon-close'));

        enter
            .append('h3')
            .text(t('note.title'));


        var body = selection.selectAll('.body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'body')
            .merge(body);

        body.selectAll('.note-editor')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'modal-section note-editor')
            .call(noteHeader.note(_note))
            .call(noteComments.note(_note))
            .call(noteSave);
    }


    function noteSave(selection) {
        var isSelected = (_note && _note.id === context.selectedNoteID());
        var noteSave = selection.selectAll('.note-save-section')
            .data((isSelected ? [_note] : []), function(d) { return d.id; });

        // exit
        noteSave.exit()
            .remove();

        // enter
        var noteSaveEnter = noteSave.enter()
            .append('div')
            .attr('class', 'note-save-section save-section cf');

        noteSaveEnter
            .append('h4')
            .attr('class', '.note-save-header')
            .text(t('note.newComment'));

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


    function noteSaveButtons(selection) {
        var isSelected = (_note && _note.id === context.selectedNoteID());
        var buttonSection = selection.selectAll('.buttons')
            .data((isSelected ? [_note] : []), function(d) { return d.id; });

        // exit
        buttonSection.exit()
            .remove();

        // enter
        var buttonEnter = buttonSection.enter()
            .append('div')
            .attr('class', 'buttons');

        buttonEnter
            .append('button')
            .attr('class', 'button status-button action')
            .append('span')
            .attr('class', 'label');

        buttonEnter
            .append('button')
            .attr('class', 'button comment-button action')
            .append('span')
            .attr('class', 'label')
            .text(t('note.comment'));

        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        buttonSection.select('.status-button')   // select and propagate data
            .text(function(d) {
                var setStatus = (d.status === 'open' ? 'close' : 'open');
                var andComment = (d.newComment ? '_comment' : '');
                return t('note.' + setStatus + andComment);
            })
            .on('click.status', function() {
                this.blur();    // avoid keeping focus on the button - #4641
                // todo: the thing
            });

        buttonSection.select('.comment-button')   // select and propagate data
            .attr('disabled', function(d) {
                return d.newComment ? null : true;
            })
            .on('click.save', function() {
                this.blur();    // avoid keeping focus on the button - #4641
                // todo: the thing
            });
    }


    function save() {
        // var osm = context.connection();
        // if (!osm) {
        //     context.enter(modeBrowse(context));
        //     return;
        // }

        // // If user somehow got logged out mid-save, try to reauthenticate..
        // // This can happen if they were logged in from before, but the tokens are no longer valid.
        // if (!osm.authenticated()) {

        //     // TODO: dispatch 'notAuthenticated' to give warning

        //     osm.authenticate(function(err) {
        //         if (err) {    // quit save mode..
        //             context.enter(modeBrowse(context));
        //             return;
        //         } else {
        //             save(updateFunction);  // continue where we left off..
        //         }
        //     });
        //     return;
        // }

        // function parseResults(results) { // TODO: simplify result parsing
        //     dispatch.call('change', results);

        //     // call success
        //     if (results) {
        //         success(results);
        //     }
        //     // otherwise, call failure
        //     else {
        //         failure(results);
        //     }
        // }

        // function success(results) {
        //     console.log('success!', results); // TODO: handle success
        //     dispatch.apply('updateNote');
        // }

        // function failure(results) { // TODO: handle failure & errors
        //     console.log('failure!', results);
        // }

        // updateFunction(parseResults);
    }


    noteEditor.note = function(_) {
        if (!arguments.length) return _note;
        _note = _;
        return noteEditor;
    };


    return utilRebind(noteEditor, dispatch, 'on');
}
