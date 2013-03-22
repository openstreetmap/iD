iD.ui.Help = function(context) {

    var key = 'h';

    function help(selection) {

        var shown = false;

        function hide() { setVisible(false); }
        function toggle() {
            if (d3.event) d3.event.preventDefault();
            tooltip.hide(button);
            setVisible(!button.classed('active'));
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;

                var pane = context.container()
                    .select('.help-wrap');

                if (show) {

                    pane.style('display', 'block')
                        .style('left', '-500px')
                        .transition()
                        .duration(200)
                        .style('left', '0px')
                        .each('end', function() {

                            pane.html('');

                            var toc = pane.append('div')
                                .attr('class', 'toc')
                                .append('ul');

                            toc
                                .selectAll('li')
                                .data(iD.data.doc)
                                .enter()
                                .append('li')
                                .append('a')
                                .text(function(d) { return d.title; })
                                .on('click', function(d) {
                                    doctitle.text(d.title);
                                    body.html(d.html);
                                });

                            var doctitle = pane.append('h2')
                                    .text(t('help.title')),
                                body = pane.append('div')
                                    .attr('class', 'body');

                            pane.on('mousedown.help-inside', function() {
                                return d3.event.stopPropagation();
                            });
                            selection.on('mousedown.help-inside', function() {
                                return d3.event.stopPropagation();
                            });
                        });

                } else {

                    pane.style('left', '0px')
                        .transition()
                        .duration(200)
                        .style('left', '-500px')
                        .each('end', function() {
                            d3.select(this).style('display', 'none');
                        });

                    pane.on('mousedown.help-inside', null);
                }
            }
        }

        var tooltip = bootstrap.tooltip()
            .placement('right')
            .html(true)
            .title(iD.ui.tooltipHtml(t('help.title'), key));

        var button = selection.append('button')
            .attr('tabindex', -1)
            .on('click', toggle)
            .call(tooltip);

        button.append('span')
            .attr('class', 'icon help light');

        context.surface().on('mousedown.help-outside', hide);
        context.container().on('mousedown.b.help-outside', hide);

        var keybinding = d3.keybinding('help');
        keybinding.on(key, toggle);
        d3.select(document).call(keybinding);
    }

    return help;
};
