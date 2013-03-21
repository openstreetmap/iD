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
            connection.changesetUrl(changeset.id);

        var links = body.append('div').attr('class','cf');

        links.append('a')
            .attr('class','col6 success-action modal-section osm')
            .attr('target', '_blank')
            .attr('href', function() {
                return connection.changesetUrl(changeset.id);
            })
            .text(t('view_on_osm'));

        links.append('a')
            .attr('class','col6 success-action modal-section twitter')
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
            .append('span').attr('class','label').text('Okay');
    }

    return d3.rebind(success, event, 'on');
};
