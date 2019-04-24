import { select as d3_select } from 'd3-selection';
import { utilFunctor } from './util';

var _tooltipID = 0;

export function tooltip(klass) {
    var _id = _tooltipID++;
    var tooltip = function(selection) {
        selection.each(setup);
    };
    var _animation = utilFunctor(false);
    var _title = function() {
        var title = this.getAttribute('data-original-title');
        if (title) {
            return title;
        } else {
            title = this.getAttribute('title');
            this.removeAttribute('title');
            this.setAttribute('data-original-title', title);
        }
        return title;
    };
    var _html = utilFunctor(false);
    var _placement = utilFunctor('top');


    tooltip.title = function(val) {
        if (arguments.length) {
            _title = utilFunctor(val);
            return tooltip;
        } else {
            return _title;
        }
    };


    tooltip.html = function(val) {
        if (arguments.length) {
            _html = utilFunctor(val);
            return tooltip;
        } else {
            return _html;
        }
    };


    tooltip.placement = function(val) {
        if (arguments.length) {
            _placement = utilFunctor(val);
            return tooltip;
        } else {
            return _placement;
        }
    };


    tooltip.show = function(selection) {
        selection.each(show);
    };


    tooltip.hide = function(selection) {
        selection.each(hide);
    };


    tooltip.toggle = function(selection) {
        selection.each(toggle);
    };


    tooltip.destroy = function(selection, selector) {
        // by default, just destroy the current tooltip
        selector = selector || '.tooltip-' + _id;

        selection
            .on('mouseenter.tooltip', null)
            .on('mouseleave.tooltip', null)
            .attr('title', function() {
                return this.getAttribute('data-original-title') || this.getAttribute('title');
            })
            .attr('data-original-title', null)
            .selectAll(selector)
            .remove();
    };


    tooltip.destroyAny = function(selection) {
        selection.call(tooltip.destroy, '.tooltip');
    };

    var isTouchEvent = false;

    function setup() {
        var root = d3_select(this);
        var animate = _animation.apply(this, arguments);
        var tip = root.selectAll('.tooltip-' + _id)
            .data([0]);

        var enter = tip.enter()
            .append('div')
            .attr('class', 'tooltip tooltip-' + _id + ' ' + (klass ? klass : ''));

        enter
            .append('div')
            .attr('class', 'tooltip-arrow');

        enter
            .append('div')
            .attr('class', 'tooltip-inner');

        tip = enter
            .merge(tip);

        if (animate) {
            tip.classed('fade', true);
        }

        var place = _placement.apply(this, arguments);
        tip.classed(place, true);

        root.on('touchstart.tooltip', function() {
            // hack to avoid showing tooltips upon touch input
            isTouchEvent = true;
        });
        root.on('mouseenter.tooltip', show);
        root.on('mouseleave.tooltip', hide);
    }


    function show() {
        if (isTouchEvent) {
            isTouchEvent = false;
            return;
        }
        var root = d3_select(this);
        var content = _title.apply(this, arguments);
        var tip = root.selectAll('.tooltip-' + _id);

        if (tip.empty()) {   // tooltip was removed somehow, put it back
            root.call(tooltip.destroy);
            root.each(setup);
            tip = root.selectAll('.tooltip-' + _id);
        }

        tip.classed('in', true);
        var markup = _html.apply(this, arguments);

        tip.selectAll('.tooltip-inner')[markup ? 'html' : 'text'](content);
        var place = _placement.apply(this, arguments);
        var outer = getPosition(root.node());
        var inner = getPosition(tip.node());
        var pos;

        switch (place) {
            case 'top':
            pos = { x: outer.x + (outer.w - inner.w) / 2, y: outer.y - inner.h };
            break;
            case 'right':
            pos = { x: outer.x + outer.w, y: outer.y + (outer.h - inner.h) / 2 };
            break;
            case 'left':
            pos = { x: outer.x - inner.w, y: outer.y + (outer.h - inner.h) / 2 };
            break;
            case 'bottom':
            pos = { x: outer.x + (outer.w - inner.w) / 2, y: outer.y + outer.h };
            break;
        }

        if (pos) {
            tip.style('left', ~~pos.x + 'px').style('top', ~~pos.y + 'px');
        } else {
            tip.style('left', null).style('top', null);
        }

        this.tooltipVisible = true;


        function getPosition(node) {
            var mode = d3_select(node).style('position');
            if (mode === 'absolute' || mode === 'static') {
                return {
                    x: node.offsetLeft,
                    y: node.offsetTop,
                    w: node.offsetWidth,
                    h: node.offsetHeight
                };
            } else {
                return {
                    x: 0,
                    y: 0,
                    w: node.offsetWidth,
                    h: node.offsetHeight
                };
            }
        }
    }


    function hide() {
        d3_select(this).selectAll('.tooltip-' + _id).classed('in', false);
        this.tooltipVisible = false;
    }


    function toggle() {
        if (this.tooltipVisible) {
            hide.apply(this, arguments);
        } else {
            show.apply(this, arguments);
        }
    }


    return tooltip;
}
