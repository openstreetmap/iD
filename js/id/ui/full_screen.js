iD.ui.FullScreen = function(context) {
    var history = context.history(),
        key = iD.ui.cmd('⌘S');

    function saving() {
        return context.mode().id === 'save';
    }

    function fullScreen() {
        d3.event.preventDefault();
        context.container().node().webkitRequestFullscreen();
    }

    return function(selection) {
        /*var tooltip = bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(iD.ui.tooltipHtml(t('save.no_changes'), key));*/

        var button = selection.append('button')
            .attr('class', 'save col12')
            .attr('tabindex', -1)
            .on('click', fullScreen)
            /*.call(tooltip)*/;

        button.append('span')
            .attr('class', 'label')
            .text(t('full_screen.title'));

        /*var keybinding = d3.keybinding('undo-redo')
            .on(key, save, true);*/

        /*d3.select(document)
            .call(keybinding);*/

        var numChanges = 0;

        context.history().on('change.save', function() {
            var _ = history.difference().summary().length;
            if (_ === numChanges)
                return;
            numChanges = _;

            tooltip.title(iD.ui.tooltipHtml(t(numChanges > 0 ?
                    'save.help' : 'save.no_changes'), key));

            button
                .classed('disabled', numChanges === 0)
                .classed('has-count', numChanges > 0);

            button.select('span.count')
                .text(numChanges);
        });

        context.on('enter.save', function() {
            button.property('disabled', saving());
            if (saving()) button.call(tooltip.hide);
        });
    };
};
