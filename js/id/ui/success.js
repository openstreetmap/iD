iD.success = function() {
    var event = d3.dispatch('cancel', 'save');

    function success(selection) {
        var changeset = selection.datum(),
            header = selection.append('div').attr('class', 'header modal-section'),
            body = selection.append('div').attr('class', 'body');

        var section = body.append('div').attr('class','modal-section');

        header.append('h2').text('You Just Edited OpenStreetMap!');
        header.append('p').text('You just improved the world\'s best free map');

        var m = '';
        if (changeset.comment) {
            m = '"' + changeset.comment.substring(0, 20) + '" ';
        }

        var message = 'Edited OpenStreetMap! ' + m +
            'http://osm.org/browse/changeset/' + changeset.id;

        section.append('a')
            .attr('href', function(d) {
                return 'https://twitter.com/intent/tweet?source=webclient&text=' +
                    encodeURIComponent(message);
            })
            .text('Tweet: ' + message);

        var buttonwrap = section.append('div')
            .attr('class', 'buttons');

        var okbutton = buttonwrap.append('button')
            .attr('class', 'action wide')
            .on('click.save', function() {
                event.cancel();
            });

        okbutton.append('span').attr('class','icon apply icon-pre-text');
        okbutton.append('span').attr('class','label').text('OK');
    }

    return d3.rebind(success, event, 'on');
};
