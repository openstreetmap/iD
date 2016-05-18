iD.ui.Save = function(context) {
    var history = context.history(),
        key = iD.ui.cmd('⌘S');


    function saving() {
        return context.mode().id === 'save';
    }

    function save() {
        d3.event.preventDefault();
        if (!context.inIntro() && !saving() && history.hasChanges()) {
            context.enter(iD.modes.Save(context));
        }
    }

    function getBackground(numChanges) {
        var step;
        if (numChanges === 0) {
            return null;
        } else if (numChanges <= 50) {
            step = numChanges / 50;
            return d3.interpolateRgb('#fff', '#ff8')(step);  // white -> yellow
        } else {
            step = Math.min((numChanges - 50) / 50, 1.0);
            return d3.interpolateRgb('#ff8', '#f88')(step);  // yellow -> red
        }
    }

    return function(selection) {
        var tooltip = bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(iD.ui.tooltipHtml(t('save.no_changes'), key));

        var button = selection.append('button')
            .attr('class', 'save col12 disabled')
            .attr('tabindex', -1)
            .on('click', save)
            .call(tooltip);

        button.append('span')
            .attr('class', 'label')
            .text(t('save.title'));

        button.append('span')
            .attr('class', 'count')
            .text('0');

        var keybinding = d3.keybinding('undo-redo')
            .on(key, save, true);

        d3.select(document)
            .call(keybinding);

        var numChanges = 0;

        context.history().on('change.save', function() {
            var _ = history.difference().summary().length;
            if (_ === numChanges)
                return;
            numChanges = _;

            tooltip.title(iD.ui.tooltipHtml(t(numChanges > 0 ?
                    'save.help' : 'save.no_changes'), key));

            var background = getBackground(numChanges);

            button
                .classed('disabled', numChanges === 0)
                .classed('has-count', numChanges > 0)
                .style('background', background);

            button.select('span.count')
                .text(numChanges)
                .style('background', background)
                .style('border-color', background);
        });

        context.on('enter.save', function() {
            button.property('disabled', saving());
            if (saving()) button.call(tooltip.hide);
        });
    };
};
