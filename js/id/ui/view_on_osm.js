iD.ui.ViewOnOSM = function(context) {
    return function(selection, entity) {
        selection.style('display', entity.isNew() ? 'none' : null);

        var osmLink = selection.selectAll('.view-on-osm')
            .data([entity]);

        var enter = osmLink.enter().append('a')
            .attr('class', 'view-on-osm')
            .attr('target', '_blank');

        enter.append('span')
            .attr('class', 'icon icon-pre-text out-link');
        enter.append('span')
            .text(t('inspector.view_on_osm'));

        osmLink.attr('href', context.connection().entityURL(entity));
    }
};
