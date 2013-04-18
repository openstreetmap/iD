iD.ui.Success = function(connection) {
    var event = d3.dispatch('cancel', 'save');

    function success(selection) {
        var changeset = selection.datum(),
            header = selection.append('div').attr('class', 'header modal-section'),
            body = selection.append('div').attr('class', 'body');

        header.append('h3').text(t('just_edited'));

        var m = '';
        if (changeset.comment) {
            m = '"' + changeset.comment.substring(0, 20) + '" ';
        }

        var message = (m || 'Edited OSM!') +
            connection.changesetURL(changeset.id);

        var links = body.append('div').attr('class','modal-actions cf');

        links.append('a')
            .attr('class','col6 osm')
            .attr('target', '_blank')
            .attr('href', function() {
                return connection.changesetURL(changeset.id);
            })
            .text(t('view_on_osm'));

        links.append('a')
            .attr('class','col6 twitter')
            .attr('target', '_blank')
            .attr('href', function() {
                return 'https://twitter.com/intent/tweet?source=webclient&text=' +
                    encodeURIComponent(message);
            })
            .text('Tweet');

        var section = body.append('div').attr('class','modal-section cf');

        section.append('button')
            .attr('class', 'action col2')
            .on('click.save', function() {
                event.cancel();
            })
            .text('Okay')
            .node().focus();
    }

    return d3.rebind(success, event, 'on');
};
