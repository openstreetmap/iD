iD.ui.Modes = function(context) {
    var modes = [
        iD.modes.AddPoint(context),
        iD.modes.AddLine(context),
        iD.modes.AddArea(context)];

    function editable() {
        return context.editable() && context.mode().id !== 'save';
    }

    return function(selection) {
        var buttons = selection.selectAll('button.add-button')
            .data(modes);

       buttons.enter().append('button')
           .attr('tabindex', -1)
           .attr('class', function(mode) { return mode.id + ' add-button col4'; })
           .on('click.mode-buttons', function(mode) {
               if (mode.id === context.mode().id) {
                   context.enter(iD.modes.Browse(context));
               } else {
                   context.enter(mode);
               }
           })
           .call(bootstrap.tooltip()
               .placement('bottom')
               .html(true)
               .title(function(mode) {
                   return iD.ui.tooltipHtml(mode.description, mode.key);
               }));

        context.map()
            .on('move.modes', _.debounce(update, 500));

        context
            .on('enter.modes', update);

        buttons.each(function(d) {
            d3.select(this)
                .call(iD.svg.Icon('#icon-' + d.button, 'pre-text'));
        });

        buttons.append('span')
            .attr('class', 'label')
            .text(function(mode) { return mode.title; });

        context.on('enter.editor', function(entered) {
            buttons.classed('active', function(mode) { return entered.button === mode.button; });
            context.container()
                .classed('mode-' + entered.id, true);
        });

        context.on('exit.editor', function(exited) {
            context.container()
                .classed('mode-' + exited.id, false);
        });

        var keybinding = d3.keybinding('mode-buttons');

        modes.forEach(function(m) {
            keybinding.on(m.key, function() { if (editable()) context.enter(m); });
        });

        d3.select(document)
            .call(keybinding);

        function update() {
            buttons.property('disabled', !editable());
        }
    };
};
