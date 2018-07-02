import { dispatch as d3_dispatch } from 'd3-dispatch';
import { uiFormFields } from './form_fields';

import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../util';

import { uiField } from './field';
import { utilDetect } from '../util/detect';

var _newComment;


export function uiNoteEditor(context) {
    var dispatch = d3_dispatch('change', 'cancel', 'save');
    var formFields = uiFormFields(context);
    var _fieldsArr;
    var _note;

    function localeDateString(s) {
        if (!s) return null;
        var detected = utilDetect();
        var options = { day: 'numeric', month: 'short', year: 'numeric' };
        var d = new Date(s);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString(detected.locale, options);
    }


    function noteEditor(selection) {
        render(selection);
    }


    function noteHeader(selection) {
        selection.selectAll('.note-header')
            .data([_note], function(d) { return d.id; })
            .enter()
            .append('h3')
            .attr('class', 'note-header')
            .text(function(d) { return String(t('note.note') + ' ' + d.id); });
    }


    function noteComments(selection) {
        function noteCreator(d) {
            var userName = d.user ? d.user : t('note.anonymous');
            return String(userName + ' ' + localeDateString(d.date));
        }

        var comments = selection.selectAll('.comments')
            .data([0]);

        comments = comments.enter()
            .append('div')
            .attr('class', 'comments')
            .merge(comments);

        var commentEnter = comments.selectAll('.comment')
            .data(_note.comments, function(d) { return d.uid; })
            .enter()
            .append('div')
            .attr('class', 'comment');

        commentEnter
            .append('p')
            .attr('class', 'commentText')
            .text(function(d) { return d.text; });

        commentEnter
            .append('p')
            .attr('class', 'commentCreator')
            .text(function(d) { return noteCreator(d); });

    }

    function saveHeader(selection) {
        var header = selection.selectAll('.notesSaveHeader')
            .data([0]);
        header = header.enter()
            .append('h4')
            .attr('class', '.notesSaveHeader')
            .text(t('note.newComment'))
            .merge(header);
    }

    function input(selection) {

        // Input
        var input = selection.selectAll('textarea')
            .data([0]);

        // enter
        input = input.enter()
            .append('textarea')
            .attr('id', 'new-comment-input')
            .attr('placeholder', t('note.inputPlaceholder'))
            .attr('maxlength', 1000)
            .call(utilNoAuto)
            // .on('input', change(true))
            .on('blur', change())
            .on('change', change())
            .merge(input);


        function change(onInput) {
            return function() {
                var t = {};
                // t[field.key] = utilGetSetValue(input) || undefined;
                dispatch.call('change', this, t, onInput);
            };
    }

        // // Input
        // var inputSection = selection.selectAll('.note-input')
        //     .data([0]);

        // // enter
        // var inputEnter = inputSection.enter()
        //     .append('div')
        //     .attr('class', 'tempClassName');

        // update
    }

    function buttons(selection) {
        // Buttons
        var buttonSection = selection.selectAll('.buttons')
            .data([0]);

        // enter
        var buttonEnter = buttonSection.enter()
            .append('div')
            .attr('class', 'buttons cf');

        buttonEnter
            .append('button')
            .attr('class', 'secondary-action col5 button cancel-button')
            .append('span')
            .attr('class', 'label')
            .text(t('note.cancel'));

        buttonEnter
            .append('button')
            .attr('class', 'action col5 button save-button')
            .append('span')
            .attr('class', 'label')
            .text(t('note.save'));

        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        buttonSection.selectAll('.cancel-button')
            .on('click.cancel', function() {
                // var selectedID = commitChanges.entityID(); TODO: cancel note event
                // dispatch.call('cancel', this, selectedID);
            });

        buttonSection.selectAll('.save-button')
            .attr('disabled', function() {
                var n = d3_select('#new-comment-input').node();
                return (n && n.value.length) ? null : true;
            })
            .on('click.save', function() {
                this.blur();    // avoid keeping focus on the button - #4641
                // dispatch.call('saveNote', this, _newComment); TODO: saveNote event
            });
    }

    function newComment(selection) {
        // New Comment
        var saveSection = selection.selectAll('.save-section')
            .data([0]);

        // saveSection = saveSection.enter()
        //     .append('h4')
        //     .text(t('note.newComment'))
        //     .merge(saveSection);

        saveSection = saveSection.enter()
            .append('div')
            .attr('class','save-section cf')
            .merge(saveSection);

        saveSection
            .call(saveHeader)
            .call(input)
            .call(buttons);
    }


    function render(selection) {
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
            .call(noteHeader)
            .call(noteComments)
            .call(newComment);
    }


    noteEditor.note = function(_) {
        if (!arguments.length) return _note;
        _note = _;
        _fieldsArr = null;
        return noteEditor;
    };


    return utilRebind(noteEditor, dispatch, 'on');
}
