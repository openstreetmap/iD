iD.ui.Success = function(context) {
    var event = d3.dispatch('cancel'),
        changeset;

    function success(selection) {
        var message = (changeset.comment || t('success.edited_osm')).substring(0, 130) +
            ' ' + context.connection().changesetURL(changeset.id);

        var header = selection.append('div')
            .attr('class', 'header fillL');

        header.append('button')
            .attr('class', 'fr')
            .append('span')
            .attr('class', 'icon close')
            .on('click', function() { event.cancel(success) });

        header.append('h3')
            .text(t('success.just_edited'));

        var body = selection.append('div')
            .attr('class', 'body save-success');

        body.append('p')
            .html(t('success.help_html'));

        body.append('a')
            .attr('class', 'button col12 osm')
            .attr('target', '_blank')
            .attr('href', function() {
                return context.connection().changesetURL(changeset.id);
            })
            .text(t('success.view_on_osm'));

        body.append('a')
            .attr('class', 'button col12 twitter')
            .attr('target', '_blank')
            .attr('href', function() {
                return 'https://twitter.com/intent/tweet?source=webclient&text=' +
                    encodeURIComponent(message);
            })
            .text(t('success.tweet'));

        body.append('a')
            .attr('class', 'button col12 facebook')
            .attr('target', '_blank')
            .attr('href', function() {
                return 'https://facebook.com/sharer/sharer.php?u=' +
                    encodeURIComponent(context.connection().changesetURL(changeset.id));
            })
            .text(t('success.facebook'));
    }

    success.changeset = function(_) {
        if (!arguments.length) return changeset;
        changeset = _;
        return success;
    };

    return d3.rebind(success, event, 'on');
};
