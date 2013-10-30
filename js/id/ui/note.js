iD.ui.Note = function(context, data) {

    var timeFormat = d3.time.format('%Y/%m/%d ');

    function note(selection) {

        var header = selection.append('div')
            .attr('class', 'header fillL cf')
            .datum(data.properties);

        header.append('h3')
            .text(t('notes.panel.title'));

        var body = selection.append('div')
            .attr('class', 'body')
            .datum(data.properties);

        var commentWrap = body.append('div')
            .attr('class', 'inspector-inner inspector-border');

        function drawComments() {
            var comments = commentWrap.selectAll('div.note-comment')
                .data(data.properties.comments, function(d) {
                    return d.date;
                });

            comments.exit().remove();

            var commentsEnter = comments.enter()
                .append('div')
                .attr('class', 'note-comment .form-field fillL');

            var meta = commentsEnter.append('div');

            meta.append('span')
                .text(function(d) {
                    return timeFormat(new Date(d.date));
                });

            meta.append('span')
                .each(function(d) {
                    if (d.uid && d.user) {
                        d3.select(this)
                            .append('a')
                            .attr('target', '_blank')
                            .attr('href', context.connection().userURL(d.user))
                            .text(function(d) {
                                return d.user;
                            });
                    } else {
                        d3.select(this)
                            .text('anonymous');
                    }
                    return d.date;
                });

            commentsEnter.append('div')
                .html(function(d) { return d.html; });
        }

        drawComments();

        var form = body.append('div')
            .attr('class', 'inspector-inner form-field');

        form.append('label')
            .attr('class', 'form-label')
            .text(t('notes.panel.text'));

        var noteComment = form.append('textarea')
            .attr('rows', 3);

        var submitRow = form.append('div')
            .attr('class', 'cf button');

        var saveButton = submitRow.append('button')
            .attr('class', 'action col3 button')
            .on('click.save', function(d) {
                context.connection().putNoteComment(d.id, noteComment.node().value, posted);
            });

        function posted(err, result) {
            if (err) {
                return iD.ui.flash(context.container())
                    .select('.content')
                    .text(t('notes.panel.failed'));
            } else {
                data.properties.comments.push({
                    text: noteComment.node().value,
                    date: (new Date()).toISOString()
                });
                drawComments();
                noteComment.node().value = '';
            }
        }

        saveButton.append('span')
            .attr('class', 'label')
            .text(t('notes.panel.save'));

        var link = body
            .append('div')
            .attr('class', 'footer')
            .append('a')
            .attr('href', function(d) { return context.connection().noteURL(d.id); })
            .attr('target', '_blank')
            .attr('class', 'view-on-osm');

        link
            .append('span')
            .attr('class', 'icon icon-pre-text out-link');

        link
            .append('span')
            .text(t('notes.panel.link'));
    }

    return note;
};
