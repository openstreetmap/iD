iD.ui.FullScreen = function(context) {
    var element = context.container().node(),
        key = iD.ui.cmd('⌃f11');

    /*function saving() {
        return context.mode().id === 'save';
    }*/

    function getFullScreenFn() {
        var prefixes = ['moz', 'webkit', 'ms'];
        if (element.requestFullscreen)
            return element.requestFullscreen;

        for (var i = 0; i < prefixes.length; i++) {
            var fn = element[prefixes[i] + 'RequestFullScreen'];
            if (fn)
                return fn;
        }
    }

    function is_supported() {
        return !!getFullScreenFn();
    }

    function fullScreen() {
        d3.event.preventDefault();
        getFullScreenFn().apply(element);
    }

    return function(selection) {
        if (!is_supported())
            return;

        var tooltip = bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(iD.ui.tooltipHtml(t('full_screen.tooltip'), key));

        var button = selection.append('button')
            .attr('class', 'save col12')
            .attr('tabindex', -1)
            .on('click', fullScreen)
            .call(tooltip);

        button.append('span')
            .attr('class', 'label')
            .text(t('full_screen.title'));

        var keybinding = d3.keybinding('full-screen')
            .on(key, fullScreen, true);

        d3.select(document)
            .call(keybinding);

        /*var numChanges = 0;

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
        });*/

        /*context.on('enter.save', function() {
            button.property('disabled', saving());
            if (saving()) button.call(tooltip.hide);
        });*/
    };
};
