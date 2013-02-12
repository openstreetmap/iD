iD.ui.Zoom = function(context) {
    var zooms = [{
        id: 'zoom-in',
        title: t('zoom.in'),
        action: context.zoomIn,
        key: '+'
    }, {
        id: 'zoom-out',
        title: t('zoom.out'),
        action: context.zoomOut,
        key: '-'
    }];

    return function(selection) {
        var button = selection.selectAll('button')
            .data(zooms)
            .enter().append('button')
            .attr('tabindex', -1)
            .attr('class', function(d) { return d.id; })
            .on('click.editor', function(d) { d.action(); })
            .call(bootstrap.tooltip()
                .placement('right')
                .html(true)
                .title(function(d) {
                    return iD.ui.tooltipHtml(d.title, d.key);
                }));

        button.append('span')
            .attr('class', function(d) { return d.id + ' icon'; });

        var keybinding = d3.keybinding('zoom')
            .on('+', function() { context.zoomIn(); })
            .on('-', function() { context.zoomOut(); })
            .on('⇧=', function() { context.zoomIn(); })
            .on('dash', function() { context.zoomOut(); });

        d3.select(document)
            .call(keybinding);
    }
};
