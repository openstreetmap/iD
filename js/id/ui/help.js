iD.ui.Help = function(context) {
    var key = 'H';

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
                    selection.on('mousedown.help-inside', function() {
                        return d3.event.stopPropagation();
                    });
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
                    selection.on('mousedown.help-inside', null);
                }
            }
        }

        function clickHelp(d, i) {
            pane.property('scrollTop', 0);
            doctitle.html(d.title);
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
                prevLink.append('span').html('&#9668; ' + docs[i - 1].title);
            }
            if (i < docs.length - 1) {
                var nextLink = nav.append('a')
                    .attr('class', 'next')
                    .on('click', function() {
                        clickHelp(docs[i + 1], i + 1);
                    });
                nextLink.append('span').html(docs[i + 1].title + ' &#9658;');
            }
        }

        function clickWalkthrough() {
            d3.select(document.body).call(iD.ui.intro(context));
            setVisible(false);
        }


        var pane = selection.append('div')
                .attr('class', 'help-wrap map-overlay fillL col5 content hide'),
            tooltip = bootstrap.tooltip()
                .placement('left')
                .html(true)
                .title(iD.ui.tooltipHtml(t('help.title'), key)),
            button = selection.append('button')
                .attr('tabindex', -1)
                .on('click', toggle)
                .call(iD.svg.Icon('#icon-help', 'light'))
                .call(tooltip),
            shown = false;


        var toc = pane.append('ul')
            .attr('class', 'toc');

        var menuItems = toc.selectAll('li')
            .data(docs)
            .enter()
            .append('li')
            .append('a')
            .html(function(d) { return d.title; })
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
            .on(key, toggle)
            .on('B', hide)
            .on('F', hide);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.help-outside', hide);
        context.container().on('mousedown.help-outside', hide);
    }

    return help;
};
