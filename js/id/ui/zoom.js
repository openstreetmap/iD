iD.ui.Zoom = function(context) {
    var zooms = [{
        id: 'zoom-in',
        icon: 'plus',
        title: t('zoom.in'),
        action: context.zoomIn,
        key: '+'
    }, {
        id: 'zoom-out',
        icon: 'minus',
        title: t('zoom.out'),
        action: context.zoomOut,
        key: '-'
    }];

    function zoomIn() {
        d3.event.preventDefault();
        if (!context.inIntro()) context.zoomIn();
    }

    function zoomOut() {
        d3.event.preventDefault();
        if (!context.inIntro()) context.zoomOut();
    }

    function zoomInFurther() {
        d3.event.preventDefault();
        if (!context.inIntro()) context.zoomInFurther();
    }

    function zoomOutFurther() {
        d3.event.preventDefault();
        if (!context.inIntro()) context.zoomOutFurther();
    }


    return function(selection) {
        var button = selection.selectAll('button')
            .data(zooms)
            .enter().append('button')
            .attr('tabindex', -1)
            .attr('class', function(d) { return d.id; })
            .on('click.editor', function(d) { d.action(); })
            .call(bootstrap.tooltip()
                .placement('left')
                .html(true)
                .title(function(d) {
                    return iD.ui.tooltipHtml(d.title, d.key);
                }));

        button.each(function(d) {
            d3.select(this)
                .call(iD.svg.Icon('#icon-' + d.icon, 'light'));
        });

        var keybinding = d3.keybinding('zoom');

        _.each(['=','ffequals','plus','ffplus'], function(key) {
            keybinding.on(key, zoomIn);
            keybinding.on('⇧' + key, zoomIn);
            keybinding.on(iD.ui.cmd('⌘' + key), zoomInFurther);
            keybinding.on(iD.ui.cmd('⌘⇧' + key), zoomInFurther);
        });
        _.each(['-','ffminus','_','dash'], function(key) {
            keybinding.on(key, zoomOut);
            keybinding.on('⇧' + key, zoomOut);
            keybinding.on(iD.ui.cmd('⌘' + key), zoomOutFurther);
            keybinding.on(iD.ui.cmd('⌘⇧' + key), zoomOutFurther);
        });

        d3.select(document)
            .call(keybinding);
    };
};
