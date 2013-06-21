iD.ui.UndoRedo = function(context) {
    var commands = [{
        id: 'undo',
        cmd: iD.ui.cmd('⌘Z'),
        action: context.undo,
        annotation: function() { return context.history().undoAnnotation(); }
    }, {
        id: 'redo',
        cmd: iD.ui.cmd('⌘⇧Z'),
        action: context.redo,
        annotation: function() { return context.history().redoAnnotation(); }
    }];

    return function(selection) {
        var tooltip = bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(function (d) {
                return iD.ui.tooltipHtml(d.annotation() || t('nothing_to_' + d.id), d.cmd);
            });

        var buttons = selection.selectAll('button')
            .data(commands)
            .enter().append('button')
            .attr('class', 'col6 disabled')
            .on('click', function(d) { return d.action(); })
            .call(tooltip);

        buttons.append('span')
            .attr('class', function(d) { return 'icon light ' + d.id; });

        var keybinding = d3.keybinding('undo')
            .on(commands[0].cmd, function() { d3.event.preventDefault(); commands[0].action(); })
            .on(commands[1].cmd, function() { d3.event.preventDefault(); commands[1].action(); });

        d3.select(document)
            .call(keybinding);

        context.history().on('change.editor', function() {
            buttons
                .classed('disabled', function(d) { return !d.annotation(); })
                .each(function() {
                    var selection = d3.select(this);
                    if (selection.property('tooltipVisible')) {
                        selection.call(tooltip.show);
                    }
                });
        });
    };
};
