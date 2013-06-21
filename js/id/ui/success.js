iD.ui.Success = function(context) {
    var event = d3.dispatch('cancel'),
        changeset;

    function success(selection) {
        var message = (changeset.comment || t('success.edited_osm')).substring(0, 130) +
            ' ' + context.connection().changesetURL(changeset.id);

        var header = selection.append('div')
            .attr('class', 'header');

        header.append('button')
            .attr('class', 'fr')
            .append('span')
            .attr('class', 'icon close light')
            .on('click', event.cancel);

        header.append('h3')
            .text(t('just_edited'));

        var body = selection.append('div')
            .attr('class', 'body');

        var links = body.append('div')
            .attr('class', 'modal-actions cf');

        links.append('a')
            .attr('class', 'col4 osm')
            .attr('target', '_blank')
            .attr('href', function() {
                return context.connection().changesetURL(changeset.id);
            })
            .text(t('view_on_osm'));

        links.append('a')
            .attr('class', 'col4 twitter')
            .attr('target', '_blank')
            .attr('href', function() {
                return 'https://twitter.com/intent/tweet?source=webclient&text=' +
                    encodeURIComponent(message);
            })
            .text(t('success.tweet'));

        links.append('a')
            .attr('class', 'col4 facebook')
            .attr('target', '_blank')
            .attr('href', function() {
                return 'https://facebook.com/sharer/sharer.php?u=' +
                    encodeURIComponent(message);
            })
            .text(t('success.facebook'));

        var section = body.append('div')
            .attr('class', 'modal-section cf');

        section.append('button')
            .attr('class', 'action col2')
            .on('click', event.cancel)
            .text(t('success.okay'))
            .node().focus();
    }

    success.changeset = function(_) {
        if (!arguments.length) return changeset;
        changeset = _;
        return success;
    };

    return d3.rebind(success, event, 'on');
};
