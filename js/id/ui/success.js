iD.ui.Success = function(context) {
    var dispatch = d3.dispatch('cancel'),
        changeset;

    function success(selection) {
        var message = (changeset.comment || t('success.edited_osm')).substring(0, 130) +
            ' ' + context.connection().changesetURL(changeset.id);

        var header = selection.append('div')
            .attr('class', 'header fillL');

        header.append('button')
            .attr('class', 'fr')
            .on('click', function() { dispatch.cancel(); })
            .call(iD.svg.Icon('#icon-close'));

        header.append('h3')
            .text(t('success.just_edited'));

        var body = selection.append('div')
            .attr('class', 'body save-success fillL');

        body.append('p')
            .html(t('success.help_html'));

        body.append('a')
            .attr('class', 'details')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .call(iD.svg.Icon('#icon-out-link', 'inline'))
            .attr('href', t('success.help_link_url'))
            .append('span')
            .text(t('success.help_link_text'));

        var changesetURL = context.connection().changesetURL(changeset.id);

        body.append('a')
            .attr('class', 'button col12 osm')
            .attr('target', '_blank')
            .attr('href', changesetURL)
            .text(t('success.view_on_osm'));

        var sharing = {
            facebook: 'https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(changesetURL),
            twitter: 'https://twitter.com/intent/tweet?source=webclient&text=' + encodeURIComponent(message),
            google: 'https://plus.google.com/share?url=' + encodeURIComponent(changesetURL)
        };

        body.selectAll('.button.social')
            .data(d3.entries(sharing))
            .enter()
            .append('a')
            .attr('class', 'button social col4')
            .attr('target', '_blank')
            .attr('href', function(d) { return d.value; })
            .call(bootstrap.tooltip()
                .title(function(d) { return t('success.' + d.key); })
                .placement('bottom'))
            .each(function(d) { d3.select(this).call(iD.svg.Icon('#logo-' + d.key, 'social')); });
    }

    success.changeset = function(_) {
        if (!arguments.length) return changeset;
        changeset = _;
        return success;
    };

    return d3.rebind(success, dispatch, 'on');
};
