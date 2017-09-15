import * as d3 from 'd3';
import marked from 'marked';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg';
import { uiIntro } from './intro';
import { uiShortcuts } from './shortcuts';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';


export function uiHelp(context) {
    var key = t('help.key');

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
            tooltipBehavior.hide(button);
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
                        .on('end', function() {
                            d3.select(this).style('display', 'none');
                        });
                    selection.on('mousedown.help-inside', null);
                }
            }
        }


        function clickHelp(d, i) {
            var rtl = (textDirection === 'rtl');
            pane.property('scrollTop', 0);
            doctitle.html(d.title);

            body.html(d.html);
            body.selectAll('a')
                .attr('target', '_blank');
            menuItems.classed('selected', function(m) {
                return m.title === d.title;
            });

            nav.html('');
            if (rtl) {
                nav.call(drawNext).call(drawPrevious);
            } else {
                nav.call(drawPrevious).call(drawNext);
            }


            function drawNext(selection) {
                if (i < docs.length - 1) {
                    var nextLink = selection
                        .append('a')
                        .attr('class', 'next')
                        .on('click', function() {
                            clickHelp(docs[i + 1], i + 1);
                        });

                    nextLink
                        .append('span')
                        .text(docs[i + 1].title)
                        .call(svgIcon((rtl ? '#icon-backward' : '#icon-forward'), 'inline'));
                }
            }


            function drawPrevious(selection) {
                if (i > 0) {
                    var prevLink = selection
                        .append('a')
                        .attr('class', 'previous')
                        .on('click', function() {
                            clickHelp(docs[i - 1], i - 1);
                        });

                    prevLink
                        .call(svgIcon((rtl ? '#icon-forward' : '#icon-backward'), 'inline'))
                        .append('span')
                        .text(docs[i - 1].title);
                }
            }
        }


        function clickWalkthrough() {
            if (context.inIntro()) return;
            context.container().call(uiIntro(context));
            setVisible(false);
        }


        function clickShortcuts() {
            context.container().call(uiShortcuts(context), true);
        }


        var pane = selection.append('div')
                .attr('class', 'help-wrap map-overlay fillL col5 content hide'),
            tooltipBehavior = tooltip()
                .placement((textDirection === 'rtl') ? 'right' : 'left')
                .html(true)
                .title(uiTooltipHtml(t('help.title'), key)),
            button = selection.append('button')
                .attr('tabindex', -1)
                .on('click', toggle)
                .call(svgIcon('#icon-help', 'light'))
                .call(tooltipBehavior),
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

        var shortcuts = toc
            .append('li')
            .attr('class', 'shortcuts')
            .call(tooltip()
                .html(true)
                .title(uiTooltipHtml(t('shortcuts.tooltip'), '?'))
                .placement('top')
            )
            .append('a')
            .on('click', clickShortcuts);

        shortcuts
            .append('div')
            .text(t('shortcuts.title'));

        var walkthrough = toc
            .append('li')
            .attr('class', 'walkthrough')
            .append('a')
            .on('click', clickWalkthrough);

        walkthrough
            .append('svg')
            .attr('class', 'logo logo-walkthrough')
            .append('use')
            .attr('xlink:href', '#logo-walkthrough');

        walkthrough
            .append('div')
            .text(t('splash.walkthrough'));


        var content = pane.append('div')
            .attr('class', 'left-content');

        var doctitle = content.append('h2')
            .text(t('help.title'));

        var body = content.append('div')
            .attr('class', 'body');

        var nav = content.append('div')
            .attr('class', 'nav');

        clickHelp(docs[0], 0);

        var keybinding = d3keybinding('help')
            .on(key, toggle)
            .on([t('background.key'), t('map_data.key')], hide);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.help-outside', hide);
        context.container().on('mousedown.help-outside', hide);
    }

    return help;
}
