iD.ui.Help = function(context) {
    var key = 'h';

    var docKeys = [
        'help.help',
        'help.editing_saving',
        'help.roads',
        'help.gps',
        'help.imagery',
        'help.addresses',
        'help.inspector',
        'help.buildings',
        'help.relations'];

    var docs = docKeys.map(function(key) {
        var text = t(key);
        return {
            title: text.split('\n')[0].replace('#', '').trim(),
            html: marked(text.split('\n').slice(1).join('\n'))
        };
    });

    function help(selection) {
        var shown = false;

        function hide() {
            setVisible(false);
        }

        function toggle() {
            if (d3.event) d3.event.preventDefault();
            tooltip.hide(button);
            setVisible(!button.classed('active'));
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;
                if (show) {
                    pane.style('display', 'block')
                        .style('right', '-500px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');
                } else {
                    pane.style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-500px')
                        .each('end', function() {
                            d3.select(this).style('display', 'none');
                        });
                }
            }
        }

        function clickHelp(d, i) {
            pane.property('scrollTop', 0);
            doctitle.text(d.title);
            body.html(d.html);
            body.selectAll('a')
                .attr('target', '_blank');
            menuItems.classed('selected', function(m) {
                return m.title === d.title;
            });

            nav.html('');

            if (i > 0) {
                var prevLink = nav.append('a')
                    .attr('class', 'previous')
                    .on('click', function() {
                        clickHelp(docs[i - 1], i - 1);
                    });
                prevLink.append('span').attr('class', 'icon back blue');
                prevLink.append('span').text(docs[i - 1].title);
            }
            if (i < docs.length - 1) {
                var nextLink = nav.append('a')
                    .attr('class', 'next')
                    .on('click', function() {
                        clickHelp(docs[i + 1], i + 1);
                    });
                nextLink.append('span').text(docs[i + 1].title);
                nextLink.append('span').attr('class', 'icon forward blue');
            }
        }

        function clickWalkthrough() {
            d3.select(document.body).call(iD.ui.intro(context));
            setVisible(false);
        }

        var tooltip = bootstrap.tooltip()
            .placement('left')
            .html(true)
            .title(iD.ui.tooltipHtml(t('help.title'), key));

        var button = selection.append('button')
            .attr('tabindex', -1)
            .on('click', toggle)
            .call(tooltip);

        button.append('span')
            .attr('class', 'icon help light');

        var pane = context.container()
            .select('.help-wrap');

        var toc = pane.append('ul')
            .attr('class', 'toc');

        var menuItems = toc.selectAll('li')
            .data(docs)
            .enter()
            .append('li')
            .append('a')
            .text(function(d) { return d.title; })
            .on('click', clickHelp);

        toc.append('li')
            .attr('class','walkthrough')
            .append('a')
            .text(t('splash.walkthrough'))
            .on('click', clickWalkthrough);

        var content = pane.append('div')
            .attr('class', 'left-content');

        var doctitle = content.append('h2')
            .text(t('help.title'));

        var body = content.append('div')
            .attr('class', 'body');

        var nav = content.append('div')
            .attr('class', 'nav');

        clickHelp(docs[0], 0);

        var keybinding = d3.keybinding('help')
            .on(key, toggle);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.help-outside', hide);
        context.container().on('mousedown.b.help-outside', hide);

        pane.on('mousedown.help-inside', function() {
            return d3.event.stopPropagation();
        });

        selection.on('mousedown.help-inside', function() {
            return d3.event.stopPropagation();
        });
    }

    return help;
};
