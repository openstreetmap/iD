iD.ui.Note = function(context, data) {

    function note(selection) {

        var header = selection.append('div')
            .attr('class', 'header fillL cf')
            .datum(data.properties);

        header.append('h3')
            .text(t('notes.panel.title'));

        header
            .append('a')
            .attr('target', '_blank')
            .attr('href', function(d) { return d.url; })
            .text(t('notes.panel.link'));

        var wrap = selection.append('div')
            .attr('class', 'inspector-body');

        var comments = wrap.selectAll('div.note-comment')
            .data(data.properties.comments);

        var commentsEnter = comments.enter()
            .append('div')
            .attr('class', 'note-comment');

        commentsEnter.append('p')
            .text(function(d) { return d.date; });

        commentsEnter.append('p')
            .html(function(d) { return d.html; });

        var form = selection.append('div');

        form.append('textarea')
            .attr('placeholder', t('notes.panel.comment'));

        // Confirm Button
        var saveButton = selection.append('button')
            .attr('class', 'action col3 button')
            .on('click.save', function() {
            });

        saveButton.append('span')
            .attr('class', 'label')
            .text(t('note.panel.save'));
    }

    return note;
};
