iD.ui.UndoRedo = function(context) {
    return function(selection) {
        var tooltip = bootstrap.tooltip()
            .placement('bottom')
            .html(true);

        var undoButton = selection.append('button')
            .attr('class', 'col6 disabled')
            .html('<span class="undo icon"/>')
            .on('click', context.undo)
            .call(tooltip);

        var redoButton = selection.append('button')
            .attr('class', 'col6 disabled')
            .html('<span class="redo icon"/>')
            .on('click', context.redo)
            .call(tooltip);

        var keybinding = d3.keybinding('undo')
            .on(iD.ui.cmd('⌘Z'), context.undo)
            .on(iD.ui.cmd('⌘⇧Z'), context.redo);

        d3.select(document)
            .call(keybinding);

        context.history().on('change.editor', function() {
            var undo = context.history().undoAnnotation(),
                redo = context.history().redoAnnotation();

            function refreshTooltip(selection) {
                if (selection.property('tooltipVisible')) {
                    selection.call(tooltip.show);
                }
            }

            undoButton
                .classed('disabled', !undo)
                .attr('data-original-title', iD.ui.tooltipHtml(undo || t('nothing_to_undo'), iD.ui.cmd('⌘Z')))
                .call(refreshTooltip);

            redoButton
                .classed('disabled', !redo)
                .attr('data-original-title', iD.ui.tooltipHtml(redo || t('nothing_to_redo'), iD.ui.cmd('⌘⇧Z')))
                .call(refreshTooltip);
        });
    }
};
