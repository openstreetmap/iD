import * as d3 from 'd3';
import { textDirection } from '../util/locale';
import { uiToggle } from './toggle';


// Tooltips and svg mask used to highlight certain features
export function uiCurtain() {

    var surface = d3.select(null),
        tooltip = d3.select(null),
        darkness = d3.select(null);

    function curtain(selection) {
        surface = selection
            .append('svg')
            .attr('id', 'curtain')
            .style('z-index', 1000)
            .style('pointer-events', 'none')
            .style('position', 'absolute')
            .style('top', 0)
            .style('left', 0);

        darkness = surface.append('path')
            .attr('x', 0)
            .attr('y', 0)
            .attr('class', 'curtain-darkness');

        d3.select(window).on('resize.curtain', resize);

        tooltip = selection.append('div')
            .attr('class', 'tooltip')
            .style('z-index', 1002);

        tooltip
            .append('div')
            .attr('class', 'tooltip-arrow');

        tooltip
            .append('div')
            .attr('class', 'tooltip-inner');

        resize();


        function resize() {
            surface
                .attr('width', window.innerWidth)
                .attr('height', window.innerHeight);
            curtain.cut(darkness.datum());
        }
    }


    curtain.reveal = function(box, text, options) {
        if (typeof box === 'string') box = d3.select(box).node();
        if (box && box.getBoundingClientRect) box = copyBox(box.getBoundingClientRect());

        options = options || {};

        if (text) {
            // pseudo markdown bold text hack
            var parts = text.split('**');
            var html = parts[0] ? '<span>' + parts[0] + '</span>' : '';
            if (parts[1]) {
                html += '<span class="bold">' + parts[1] + '</span>';
            }

            if (options.buttonText && options.buttonCallback) {
                html += '<div class="button-section">' +
                    '<button href="#" class="button action col8">' + options.buttonText + '</button></div>';
            }

            var classes = 'curtain-tooltip tooltip in ' + (options.tooltipClass || '');
            tooltip
                .classed(classes, true)
                .selectAll('.tooltip-inner')
                .html(html);

            if (options.buttonText && options.buttonCallback) {
                var button = tooltip.selectAll('.button-section .button.action');
                button
                    .on('click', function() {
                        d3.event.preventDefault();
                        options.buttonCallback();
                    });
            }

            // var dimensions = utilGetDimensions(selection, true),
            var tip = copyBox(tooltip.node().getBoundingClientRect()),
                w = window.innerWidth,
                h = window.innerHeight,
                tooltipWidth = 200,
                tooltipArrow = 5,
                side, pos;

            // trim box dimensions to just the portion that fits in the window..
            if (box.top + box.height > h) {
                box.height -= (box.top + box.height - h);
            }
            if (box.left + box.width > w) {
                box.width -= (box.left + box.width - w);
            }

            // determine tooltip placement..

            if (box.top + box.height < 100) {
                // tooltip below box..
                side = 'bottom';
                pos = [box.left + box.width / 2 - tip.width / 2, box.top + box.height];

            } else if (box.top > h - 140) {
                // tooltip above box..
                side = 'top';
                pos = [box.left + box.width / 2 - tip.width / 2, box.top - tip.height];

            } else {
                // tooltip to the side of the box..
                var tipY = box.top + box.height / 2 - tip.height / 2;

                if (textDirection === 'rtl') {
                    if (box.left - tooltipWidth - tooltipArrow < 70) {
                        side = 'right';
                        pos = [box.left + box.width + tooltipArrow, tipY];

                    } else {
                        side = 'left';
                        pos = [box.left - tooltipWidth - tooltipArrow, tipY];
                    }

                } else {
                    if (box.left + box.width + tooltipArrow + tooltipWidth > w - 70) {
                        side = 'left';
                        pos = [box.left - tooltipWidth - tooltipArrow, tipY];
                    }
                    else {
                        side = 'right';
                        pos = [box.left + box.width + tooltipArrow, tipY];
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


            // shift tooltip-inner if it is very close to the top or bottom edge
            // (doesn't affect the placement of the tooltip-arrow)
            var shiftY = 0;
            if (side === 'left' || side === 'right') {
                if (pos[1] < 60) {
                    shiftY = 60 - pos[1];
                }
                else if (pos[1] + tip.height > h - 100) {
                    shiftY = h - pos[1] - tip.height - 100;
                }
            }
            tooltip.selectAll('.tooltip-inner')
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
                .ease(d3.easeLinear);
        }

        selection
            .attr('d', function(d) {
                var string = 'M 0,0 L 0,' + window.innerHeight + ' L ' +
                    window.innerWidth + ',' + window.innerHeight + 'L' +
                    window.innerWidth + ',0 Z';

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
        d3.select(window).on('resize.curtain', null);
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
