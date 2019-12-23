import { event as d3_event, select as d3_select } from 'd3-selection';
import { utilFunctor } from './util';

var _popoverID = 0;

export function popover(klass) {
    var _id = _popoverID++;
    var _anchorSelection = d3_select(null);
    var popover = function(selection) {
        _anchorSelection = selection;
        selection.each(setup);
    };
    var _animation = utilFunctor(false);
    var _placement = utilFunctor('top'); // top, bottom, left, right
    var _alignment = utilFunctor('center');  // leading, center, trailing
    var _scrollContainer = utilFunctor(d3_select(null));
    var _content;
    var _displayType = utilFunctor('');
    var _hasArrow = utilFunctor(true);

    popover.displayType = function(val) {
        if (arguments.length) {
            _displayType = utilFunctor(val);
            return popover;
        } else {
            return _displayType;
        }
    };

    popover.hasArrow = function(val) {
        if (arguments.length) {
            _hasArrow = utilFunctor(val);
            return popover;
        } else {
            return _hasArrow;
        }
    };

    popover.placement = function(val) {
        if (arguments.length) {
            _placement = utilFunctor(val);
            return popover;
        } else {
            return _placement;
        }
    };

    popover.alignment = function(val) {
        if (arguments.length) {
            _alignment = utilFunctor(val);
            return popover;
        } else {
            return _alignment;
        }
    };

    popover.scrollContainer = function(val) {
        if (arguments.length) {
            _scrollContainer = utilFunctor(val);
            return popover;
        } else {
            return _scrollContainer;
        }
    };

    popover.content = function(val) {
        if (arguments.length) {
            _content = val;
            return popover;
        } else {
            return _content;
        }
    };

    popover.isShown = function() {
        var popoverSelection = d3_select('.popover-' + _id);
        return !popoverSelection.empty() && popoverSelection.classed('in');
    };

    popover.show = function() {
        _anchorSelection.each(show);
    };

    popover.updateContent = function() {
        _anchorSelection.each(updateContent);
    };

    popover.hide = function() {
        _anchorSelection.each(hide);
    };

    popover.toggle = function() {
        _anchorSelection.each(toggle);
    };

    popover.destroy = function(selection, selector) {
        // by default, just destroy the current popover
        selector = selector || '.popover-' + _id;

        selection
            .on('mouseenter.popover', null)
            .on('mouseleave.popover', null)
            .on('mouseup.popover', null)
            .on('mousedown.popover', null)
            .on('click.popover', null)
            .attr('title', function() {
                return this.getAttribute('data-original-title') || this.getAttribute('title');
            })
            .attr('data-original-title', null)
            .selectAll(selector)
            .remove();
    };


    popover.destroyAny = function(selection) {
        selection.call(popover.destroy, '.popover');
    };

    var isTouchEvent = false;

    function setup() {
        var anchor = d3_select(this);
        var animate = _animation.apply(this, arguments);
        var popoverSelection = anchor.selectAll('.popover-' + _id)
            .data([0]);


        var enter = popoverSelection.enter()
            .append('div')
            .attr('class', 'popover popover-' + _id + ' ' + (klass ? klass : ''))
            .classed('arrowed', _hasArrow.apply(this, arguments));

        enter
            .append('div')
            .attr('class', 'popover-arrow');

        enter
            .append('div')
            .attr('class', 'popover-inner');

        popoverSelection = enter
            .merge(popoverSelection);

        if (animate) {
            popoverSelection.classed('fade', true);
        }

        var placement = _placement.apply(this, arguments);
        popoverSelection.classed(placement, true);

        var display = _displayType.apply(this, arguments);

        if (display === 'hover') {
            anchor.on('touchstart.popover', function() {
                // hack to avoid showing popovers upon touch input
                isTouchEvent = true;
            });
            anchor.on('mouseenter.popover', show);
            anchor.on('mouseleave.popover', hide);

        } else if (display === 'clickFocus') {
            anchor
                .on('mousedown.popover', function() {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                })
                .on('mouseup.popover', function() {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                })
                .on('click.popover', toggle);

            popoverSelection
                .attr('tabindex', 0)
                .on('blur.popover', function() {
                    anchor.each(function() {
                        hide.apply(this, arguments);
                    });
                });
        }
    }


    function show() {
        if (isTouchEvent) {
            isTouchEvent = false;
            return;
        }
        var anchor = d3_select(this);
        var popoverSelection = anchor.selectAll('.popover-' + _id);

        if (popoverSelection.empty()) {   // popover was removed somehow, put it back
            anchor.call(popover.destroy);
            anchor.each(setup);
            popoverSelection = anchor.selectAll('.popover-' + _id);
        }

        popoverSelection.classed('in', true);

        if (_displayType.apply(this, arguments) === 'clickFocus') {
            anchor.classed('active', true);
            popoverSelection.node().focus();
        }

        anchor.each(updateContent);
    }

    function updateContent() {
        var anchor = d3_select(this);
        var popoverSelection = anchor.selectAll('.popover-' + _id);

        if (_content) popoverSelection.selectAll('.popover-inner').call(_content.apply(this, arguments));

        updatePosition.apply(this, arguments);
        // hack: update twice to fix instances where the absolute offset is
        // set before the dynamic popover size is calculated by the browser
        updatePosition.apply(this, arguments);
    }


    function updatePosition() {

        var anchor = d3_select(this);
        var popoverSelection = anchor.selectAll('.popover-' + _id);

        var scrollContainer = _scrollContainer && _scrollContainer.apply(this, arguments);
        var scrollNode = scrollContainer && !scrollContainer.empty() && scrollContainer.node();
        var scrollLeft = scrollNode ? scrollNode.scrollLeft : 0;
        var scrollTop = scrollNode ? scrollNode.scrollTop : 0;

        var placement = _placement.apply(this, arguments);
        var alignment = _alignment.apply(this, arguments);
        var alignFactor = 0.5;
        if (alignment === 'leading') {
            alignFactor = 0;
        } else if (alignment === 'trailing') {
            alignFactor = 1;
        }
        var anchorFrame = getFrame(anchor.node());
        var popoverFrame = getFrame(popoverSelection.node());
        var position;

        switch (placement) {
            case 'top':
            position = {
                x: anchorFrame.x + (anchorFrame.w - popoverFrame.w) * alignFactor,
                y: anchorFrame.y - popoverFrame.h
            };
            break;
            case 'bottom':
            position = {
                x: anchorFrame.x + (anchorFrame.w - popoverFrame.w) * alignFactor,
                y: anchorFrame.y + anchorFrame.h
            };
            break;
            case 'left':
            position = {
                x: anchorFrame.x - popoverFrame.w,
                y: anchorFrame.y + (anchorFrame.h - popoverFrame.h) * alignFactor
            };
            break;
            case 'right':
            position = {
                x: anchorFrame.x + anchorFrame.w,
                y: anchorFrame.y + (anchorFrame.h - popoverFrame.h) * alignFactor
            };
            break;
        }

        if (position) {

            if (scrollNode && (placement === 'top' || placement === 'bottom')) {

                var initialPosX = position.x;

                if (position.x + popoverFrame.w > scrollNode.offsetWidth - 10) {
                    position.x = scrollNode.offsetWidth - 10 - popoverFrame.w;
                } else if (position.x < 10) {
                    position.x = 10;
                }

                var arrow = popoverSelection.selectAll('.popover-arrow');
                // keep the arrow centered on the button, or as close as possible
                var arrowPosX = Math.min(Math.max(popoverFrame.w / 2 - (position.x - initialPosX), 10), popoverFrame.w - 10);
                arrow.style('left', ~~arrowPosX + 'px');
            }

            popoverSelection.style('left', ~~position.x + 'px').style('top', ~~position.y + 'px');
        } else {
            popoverSelection.style('left', null).style('top', null);
        }

        function getFrame(node) {
            var positionStyle = d3_select(node).style('position');
            if (positionStyle === 'absolute' || positionStyle === 'static') {
                return {
                    x: node.offsetLeft - scrollLeft,
                    y: node.offsetTop - scrollTop,
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
        var anchor = d3_select(this);
        if (_displayType.apply(this, arguments) === 'clickFocus') {
            anchor.classed('active', false);
        }
        anchor.selectAll('.popover-' + _id).classed('in', false);
    }


    function toggle() {
        if (d3_select(this).select('.popover-' + _id).classed('in')) {
            hide.apply(this, arguments);
        } else {
            show.apply(this, arguments);
        }
    }


    return popover;
}
