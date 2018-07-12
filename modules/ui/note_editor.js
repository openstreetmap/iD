import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';

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

        header.enter()
            .append('div')
            .attr('class', 'header fillL')
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
            .call(utilNoAuto)
            .on('input', change)
            .on('blur', change);

        // update
        noteSave = noteSaveEnter
            .merge(noteSave);

        change();

        function change() {
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

        buttonSection.selectAll('.status-button')
            .text(function(d) {
                var n = d3_select('#new-comment-input').node();
                var setStatus = (d.status === 'open' ? 'close' : 'open');
                var andComment = ((n && n.value.length) ? '_comment' : '');
                return t('note.' + setStatus + andComment);
            })
            .on('click.status', function() {
                this.blur();    // avoid keeping focus on the button - #4641
                // todo: the thing
            });

        buttonSection.selectAll('.comment-button')
            .attr('disabled', function() {
                var n = d3_select('#new-comment-input').node();
                return (n && n.value.length) ? null : true;
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
