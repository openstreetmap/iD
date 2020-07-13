import { easeLinear as d3_easeLinear } from 'd3-ease';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { localizer } from '../core/localizer';
import { uiToggle } from './toggle';


// Tooltips and svg mask used to highlight certain features
export function uiCurtain(containerNode) {

    var surface = d3_select(null),
        tooltip = d3_select(null),
        darkness = d3_select(null);

    function curtain(selection) {
        surface = selection
            .append('svg')
            .attr('class', 'curtain')
            .style('top', 0)
            .style('left', 0);

        darkness = surface.append('path')
            .attr('x', 0)
            .attr('y', 0)
            .attr('class', 'curtain-darkness');

        d3_select(window).on('resize.curtain', resize);

        tooltip = selection.append('div')
            .attr('class', 'tooltip');

        tooltip
            .append('div')
            .attr('class', 'popover-arrow');

        tooltip
            .append('div')
            .attr('class', 'popover-inner');

        resize();


        function resize() {
            surface
                .attr('width', containerNode.clientWidth)
                .attr('height', containerNode.clientHeight);
            curtain.cut(darkness.datum());
        }
    }


    /**
     * Reveal cuts the curtain to highlight the given box,
     * and shows a tooltip with instructions next to the box.
     *
     * @param  {String|ClientRect} [box]   box used to cut the curtain
     * @param  {String}    [text]          text for a tooltip
     * @param  {Object}    [options]
     * @param  {string}    [options.tooltipClass]    optional class to add to the tooltip
     * @param  {integer}   [options.duration]        transition time in milliseconds
     * @param  {string}    [options.buttonText]      if set, create a button with this text label
     * @param  {function}  [options.buttonCallback]  if set, the callback for the button
     * @param  {function}  [options.padding]         extra margin in px to put around bbox
     * @param  {String|ClientRect} [options.tooltipBox]  box for tooltip position, if different from box for the curtain
     */
    curtain.reveal = function(box, text, options) {
        options = options || {};

        if (typeof box === 'string') {
            box = d3_select(box).node();
        }
        if (box && box.getBoundingClientRect) {
            box = copyBox(box.getBoundingClientRect());
            var containerRect = containerNode.getBoundingClientRect();
            box.top -= containerRect.top;
            box.left -= containerRect.left;
        }
        if (box && options.padding) {
            box.top -= options.padding;
            box.left -= options.padding;
            box.bottom += options.padding;
            box.right += options.padding;
            box.height += options.padding * 2;
            box.width += options.padding * 2;
        }

        var tooltipBox;
        if (options.tooltipBox) {
            tooltipBox = options.tooltipBox;
            if (typeof tooltipBox === 'string') {
                tooltipBox = d3_select(tooltipBox).node();
            }
            if (tooltipBox && tooltipBox.getBoundingClientRect) {
                tooltipBox = copyBox(tooltipBox.getBoundingClientRect());
            }
        } else {
            tooltipBox = box;
        }

        if (tooltipBox && text) {
            // pseudo markdown bold text for the instruction section..
            var parts = text.split('**');
            var html = parts[0] ? '<span>' + parts[0] + '</span>' : '';
            if (parts[1]) {
                html += '<span class="instruction">' + parts[1] + '</span>';
            }

            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');   // emphasis
            html = html.replace(/\{br\}/g, '<br/><br/>');       // linebreak

            if (options.buttonText && options.buttonCallback) {
                html += '<div class="button-section">' +
                    '<button href="#" class="button action">' + options.buttonText + '</button></div>';
            }

            var classes = 'curtain-tooltip popover tooltip arrowed in ' + (options.tooltipClass || '');
            tooltip
                .classed(classes, true)
                .selectAll('.popover-inner')
                .html(html);

            if (options.buttonText && options.buttonCallback) {
                var button = tooltip.selectAll('.button-section .button.action');
                button
                    .on('click', function() {
                        d3_event.preventDefault();
                        options.buttonCallback();
                    });
            }

            var tip = copyBox(tooltip.node().getBoundingClientRect()),
                w = containerNode.clientWidth,
                h = containerNode.clientHeight,
                tooltipWidth = 200,
                tooltipArrow = 5,
                side, pos;


            // hack: this will have bottom placement,
            // so need to reserve extra space for the tooltip illustration.
            if (options.tooltipClass === 'intro-mouse') {
                tip.height += 80;
            }

            // trim box dimensions to just the portion that fits in the container..
            if (tooltipBox.top + tooltipBox.height > h) {
                tooltipBox.height -= (tooltipBox.top + tooltipBox.height - h);
            }
            if (tooltipBox.left + tooltipBox.width > w) {
                tooltipBox.width -= (tooltipBox.left + tooltipBox.width - w);
            }

            // determine tooltip placement..

            if (tooltipBox.top + tooltipBox.height < 100) {
                // tooltip below box..
                side = 'bottom';
                pos = [
                    tooltipBox.left + tooltipBox.width / 2 - tip.width / 2,
                    tooltipBox.top + tooltipBox.height
                ];

            } else if (tooltipBox.top > h - 140) {
                // tooltip above box..
                side = 'top';
                pos = [
                    tooltipBox.left + tooltipBox.width / 2 - tip.width / 2,
                    tooltipBox.top - tip.height
                ];

            } else {
                // tooltip to the side of the tooltipBox..
                var tipY = tooltipBox.top + tooltipBox.height / 2 - tip.height / 2;

                if (localizer.textDirection() === 'rtl') {
                    if (tooltipBox.left - tooltipWidth - tooltipArrow < 70) {
                        side = 'right';
                        pos = [tooltipBox.left + tooltipBox.width + tooltipArrow, tipY];

                    } else {
                        side = 'left';
                        pos = [tooltipBox.left - tooltipWidth - tooltipArrow, tipY];
                    }

                } else {
                    if (tooltipBox.left + tooltipBox.width + tooltipArrow + tooltipWidth > w - 70) {
                        side = 'left';
                        pos = [tooltipBox.left - tooltipWidth - tooltipArrow, tipY];
                    }
                    else {
                        side = 'right';
                        pos = [tooltipBox.left + tooltipBox.width + tooltipArrow, tipY];
                    }
                }
            }

            if (options.duration !== 0 || !tooltip.classed(side)) {
                tooltip.call(uiToggle(true));
            }

            tooltip
                .style('top', pos[1] + 'px')
                .style('left', pos[0] + 'px')
                .attr('class', classes + ' ' + side);


            // shift popover-inner if it is very close to the top or bottom edge
            // (doesn't affect the placement of the popover-arrow)
            var shiftY = 0;
            if (side === 'left' || side === 'right') {
                if (pos[1] < 60) {
                    shiftY = 60 - pos[1];
                }
                else if (pos[1] + tip.height > h - 100) {
                    shiftY = h - pos[1] - tip.height - 100;
                }
            }
            tooltip.selectAll('.popover-inner')
                .style('top', shiftY + 'px');

        } else {
            tooltip
                .classed('in', false)
                .call(uiToggle(false));
        }

        curtain.cut(box, options.duration);

        return tooltip;
    };


    curtain.cut = function(datum, duration) {
        darkness.datum(datum)
            .interrupt();

        var selection;
        if (duration === 0) {
            selection = darkness;
        } else {
            selection = darkness
                .transition()
                .duration(duration || 600)
                .ease(d3_easeLinear);
        }

        selection
            .attr('d', function(d) {
                var containerWidth = containerNode.clientWidth;
                var containerHeight = containerNode.clientHeight;
                var string = 'M 0,0 L 0,' + containerHeight + ' L ' +
                    containerWidth + ',' + containerHeight + 'L' +
                    containerWidth + ',0 Z';

                if (!d) return string;
                return string + 'M' +
                    d.left + ',' + d.top + 'L' +
                    d.left + ',' + (d.top + d.height) + 'L' +
                    (d.left + d.width) + ',' + (d.top + d.height) + 'L' +
                    (d.left + d.width) + ',' + (d.top) + 'Z';

            });
    };


    curtain.remove = function() {
        surface.remove();
        tooltip.remove();
        d3_select(window).on('resize.curtain', null);
    };


    // ClientRects are immutable, so copy them to an object,
    // in case we need to trim the height/width.
    function copyBox(src) {
        return {
            top: src.top,
            right: src.right,
            bottom: src.bottom,
            left: src.left,
            width: src.width,
            height: src.height
        };
    }


    return curtain;
}
