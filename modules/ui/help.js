import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import marked from 'marked';
import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg';
import { uiIntro } from './intro';
import { uiShortcuts } from './shortcuts';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';

import { icon } from 'intro/helper';


export function uiHelp(context) {
    var key = t('help.key');

    var docKeys = [
          ['help.help.',['intro','opendata','beforestart','opensource']],
          ['help.overview.',['intro','features','screen','navigation']],
          ['help.editing.',['intro','multiselect','edit','save','upload','comeback']],
          ['help.roads.',['intro','move','connect','attributes','delete','create']],
          ['help.gps.',['intro','using']],
          ['help.buildings.',['intro','select','modify','create','delete']],
          ['help.addresses.',['intro','nodup','recommendation','points']],
          ['help.feature_editor.',['intro','select','fields','tags','undo']],
          ['help.imagery.',['intro','background','offset']],
          ['help.relations.',['intro','members','maintain','edit','multipolygons','turnrestrictions']]
        ];

    var icont = {
          apply: icon('#icon-apply', 'pre-text'),
          area: icon('#icon-area', 'pre-text'),
          help: icon('#icon-help', 'pre-text'),
          line: icon('#icon-line', 'pre-text'),
          minus: icon('#icon-minus', 'pre-text'),
          plus: icon('#icon-plus', 'pre-text'),
          point: icon('#icon-point', 'pre-text'),
          mapdata: icon('#logo-layers', 'pre-text'),
          circularize: icon('#operation-circularize', 'pre-text'),
          delete: icon('#operation-delete', 'pre-text'),
          orthogonalize: icon('#operation-orthogonalize', 'pre-text'),
          split: icon('#operation-split', 'pre-text'),
          undo: icon('#operation-undo', 'pre-text'),
          redo: icon('#operation-redo', 'pre-text'),
          save: icon('#operation-save', 'pre-text'),
          move: icon('#operation-move', 'pre-text'),
          disconnect: icon('#operation-disconnect', 'pre-text')
        };

    var docs = docKeys.map(function(key) {
        var text = key[1].reduce(function(all,part) { return all + t(key[0].concat(part),icont); }, '');
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
            if (d3_event) d3_event.preventDefault();
            tooltipBehavior.hide(button);
            setVisible(!button.classed('active'));
        }


        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;

                if (show) {
                    selection.on('mousedown.help-inside', function() {
                        return d3_event.stopPropagation();
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
                            d3_select(this).style('display', 'none');
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

        var keybinding = d3_keybinding('help')
            .on(key, toggle)
            .on([t('background.key'), t('map_data.key')], hide);

        d3_select(document)
            .call(keybinding);

        context.surface().on('mousedown.help-outside', hide);
        context.container().on('mousedown.help-outside', hide);
    }

    return help;
}
