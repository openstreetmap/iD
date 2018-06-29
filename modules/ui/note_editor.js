import { dispatch as d3_dispatch } from 'd3-dispatch';
import { uiFormFields } from './form_fields';


import { uiField } from './field';
import { utilRebind } from '../util';
import { t } from '../util/locale';


export function uiNoteEditor(context) {
    var dispatch = d3_dispatch('change');
    var formFields = uiFormFields(context);
    var _fieldsArr;
    var _noteID;

    function noteEditor(selection, note) {
        render(selection, note);
    }

    function parseNoteUnresolved(selection, note) {

        var unresolved = selection.selectAll('.noteUnresolved')
            .data(note, function(d) { return d.id; })
            .enter()
            .append('h3')
            .attr('class', 'noteUnresolved')
            .text(function(d) { return String(t('note.unresolved') + ' ' + d.id); });

        selection.merge(unresolved);
        return selection;
    }

    function parseNoteComments(selection, note) {

        function noteCreator(d) {
            var userName = d.user ? d.user : t('note.anonymous');
            return String(t('note.creator') + ' ' + userName + ' ' + t('note.creatorOn') + ' ' + d.date);
        }

        var comments = selection
            .append('div')
            .attr('class', 'comments');

        var comment = comments.selectAll('.comment')
            .data(note.comments, function(d) { return d.uid; })
            .enter()
            .append('div')
            .attr('class', 'comment');

        // append the creator
        comment
            .append('p')
            .attr('class', 'commentCreator')
            .text(function(d) { return noteCreator(d); });

        // append the comment
        comment
            .append('p')
            .attr('class', 'commentText')
            .text(function(d) { return d.text; });

        comments.insert('h4', ':first-child')
            .text(t('note.description'));

        // TODO: have a better check to highlight the first/author comment (e.g., check if `author: true`)
        comments.select('div')
            .attr('class', 'comment-first');


        selection.merge(comments);
        return selection;
    }

    function render(selection, note) {

        var exampleNote = {
            close_url: 'example_close_url',
            comment_url: 'example_comment_url',
            comments: [
                {
                    action: 'opened',
                    date: '2016-11-20 00:50:20 UTC',
                    html: '&lt;p&gt;Test comment1.&lt;/p&gt;',
                    text: 'Test comment1',
                    uid: '111111',
                    user: 'User1',
                    user_url: 'example_user_url1'
                },
                {
                    action: 'opened',
                    date: '2016-11-20 00:50:20 UTC',
                    html: '&lt;p&gt;Test comment2.&lt;/p&gt;',
                    text: 'Test comment2',
                    uid: '222222',
                    user: 'User2',
                    user_url: 'example_user_url2'
                },
                {
                    action: 'opened',
                    date: '2016-11-20 00:50:20 UTC',
                    html: '&lt;p&gt;Test comment3.&lt;/p&gt;',
                    text: 'Test comment3',
                    uid: '333333',
                    user: 'User3',
                    user_url: 'example_user_url3'
                }
            ],
            date_created: '2016-11-20 00:50:20 UTC',
            id: 'note789148',
            loc: [
                -120.0219036,
                34.4611879
            ],
            status: 'open',
            type: 'note',
            url: 'https://api.openstreetmap.org/api/0.6/notes/789148',
            visible: true
        };

        var currentNote = note ? [note] : [exampleNote];

        var author = currentNote[0].comments[0];
        author.author = true;

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

        // Note Section
        var noteSection = body.selectAll('.changeset-editor')
            .data([0]);

        noteSection = noteSection.enter()
            .append('div')
            .attr('class', 'modal-section changeset-editor')
            .merge(noteSection);

        noteSection = noteSection.call(parseNoteUnresolved, currentNote);

        noteSection = noteSection.call(parseNoteComments, currentNote[0]);
        // TODO: revisit commit.js, changeset_editor.js to get warnings, fields array, button toggles, etc.
    }

    noteEditor.noteID = function(_) {
        if (!arguments.length) return _noteID;
        if (_noteID === _) return noteEditor;
        _noteID = _;
        _fieldsArr = null;
        return noteEditor;
    };

    return utilRebind(noteEditor, dispatch, 'on');
}