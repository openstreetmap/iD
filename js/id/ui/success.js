iD.ui.Success = function(context) {
    var event = d3.dispatch('cancel', 'save');

    function success(selection) {
        var changeset = selection.datum(),
            header = selection.append('div').attr('class', 'header modal-section'),
            body = selection.append('div').attr('class', 'body');

        header.append('h3').text(t('just_edited'));

        var m = changeset.comment ?
            changeset.comment.substring(0, 130) : '';

        var message = (m || t('success.edited_osm')) + ' ' +
            context.connection().changesetURL(changeset.id);

        var links = body.append('div').attr('class','modal-actions cf');

        links.append('a')
            .attr('class','col4 osm')
            .attr('target', '_blank')
            .attr('href', function() {
                return context.connection().changesetURL(changeset.id);
            })
            .text(t('view_on_osm'));

        links.append('a')
            .attr('class','col4 twitter')
            .attr('target', '_blank')
            .attr('href', function() {
                return 'https://twitter.com/intent/tweet?source=webclient&text=' +
                    encodeURIComponent(message);
            })
            .text(t('success.tweet'));

        links.append('a')
            .attr('class','col4 facebook')
            .attr('target', '_blank')
            .attr('href', function() {
                return 'https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(message);
            })
            .text(t('success.facebook'));

        var section = body.append('div').attr('class','modal-section cf');

        section.append('button')
            .attr('class', 'action col2')
            .on('click.save', function() {
                event.cancel();
            })
            .text(t('success.okay'))
            .node().focus();
    }

    return d3.rebind(success, event, 'on');
};
