iD.ui.Help = function(context) {

    var key = 'h';

    function help(selection) {

        var shown = false, pane;

        function setup() {
            pane = context.container()
                .select('.help-wrap')
                .html('');

            var toc = pane.append('ul')
                .attr('class', 'toc');

            function clickHelp(d) {
                doctitle.text(d.title);
                body.html(d.html);
                body.selectAll('a')
                    .attr('target', '_blank');
                menuItems.classed('selected', function(m) {
                    return m.title === d.title;
                });
            }

            var menuItems = toc.selectAll('li')
                .data(iD.data.doc)
                .enter()
                .append('li')
                .append('a')
                .text(function(d) { return d.title; })
                .on('click', clickHelp);

            var content = pane.append('div')
                    .attr('class', 'left-content'),
                doctitle = content.append('h2')
                    .text(t('help.title')),
                body = content.append('div')
                    .attr('class', 'body');

            clickHelp(iD.data.doc[0]);
        }

        function hide() { setVisible(false); }
        function toggle() {
            if (d3.event) d3.event.preventDefault();
            tooltip.hide(button);
            setVisible(!button.classed('active'));
        }

        function blockClick() {
            pane.on('mousedown.help-inside', function() {
                return d3.event.stopPropagation();
            });
            selection.on('mousedown.help-inside', function() {
                return d3.event.stopPropagation();
            });
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;
                if (show) {
                    pane.style('display', 'block')
                        .style('left', '-500px')
                        .transition()
                        .duration(200)
                        .style('left', '0px')
                        .each('end', blockClick);
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

        setup();

        var keybinding = d3.keybinding('help');
        keybinding.on(key, toggle);
        d3.select(document).call(keybinding);
    }

    return help;
};
