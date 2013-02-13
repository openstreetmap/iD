iD.ui.Success = function(connection) {
    var event = d3.dispatch('cancel', 'save');

    function success(selection) {
        var changeset = selection.datum(),
            header = selection.append('div').attr('class', 'header fillL modal-section'),
            body = selection.append('div').attr('class', 'body');

        var section = body.append('div').attr('class','modal-section fillD');

        header.append('h2').text(t('just_edited'));

        var m = '';
        if (changeset.comment) {
            m = '"' + changeset.comment.substring(0, 20) + '" ';
        }

        var message = (m || 'Edited OSM!') +
            connection.changesetUrl(changeset.id);

        header.append('a')
            .attr('href', function(d) {
                return connection.changesetUrl(changeset.id);
            })
            .attr('target', '_blank')
            .attr('class', 'success-action')
            .text(t('view_on_osm'));

        header.append('a')
            .attr('target', '_blank')
            .attr('href', function(d) {
                return 'https://twitter.com/intent/tweet?source=webclient&text=' +
                    encodeURIComponent(message);
            })
            .attr('class', 'success-action')
            .text('Tweet');

        var buttonwrap = section.append('div')
            .attr('class', 'buttons cf');

        var okbutton = buttonwrap.append('button')
            .attr('class', 'action col2')
            .on('click.save', function() {
                event.cancel();
            });

        okbutton.append('span').attr('class','icon apply icon-pre-text');
        okbutton.append('span').attr('class','label').text('Okay');
    }

    return d3.rebind(success, event, 'on');
};
