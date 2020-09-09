import { event as d3_event, select as d3_select } from 'd3-selection';
import { utilFunctor } from '../util/util';

var _popoverID = 0;

export function uiPopover(klass) {
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

    // use pointer events on supported platforms; fallback to mouse events
    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';

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
        var popoverSelection = _anchorSelection.select('.popover-' + _id);
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
            .on(_pointerPrefix + 'enter.popover', null)
            .on(_pointerPrefix + 'leave.popover', null)
            .on(_pointerPrefix + 'up.popover', null)
            .on(_pointerPrefix + 'down.popover', null)
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

        var display = _displayType.apply(this, arguments);

        if (display === 'hover') {
            var _lastNonMouseEnterTime;
            anchor.on(_pointerPrefix + 'enter.popover', function() {

                if (d3_event.pointerType) {
                    if (d3_event.pointerType !== 'mouse') {
                        _lastNonMouseEnterTime = d3_event.timeStamp;
                        // only allow hover behavior for mouse input
                        return;
                    } else if (_lastNonMouseEnterTime &&
                        d3_event.timeStamp - _lastNonMouseEnterTime < 1500) {
                        // HACK: iOS 13.4 sends an erroneous `mouse` type pointerenter
                        // event for non-mouse interactions right after sending
                        // the correct type pointerenter event. Workaround by discarding
                        // any mouse event that occurs immediately after a non-mouse event.
                        return;
                    }
                }

                // don't show if buttons are pressed, e.g. during click and drag of map
                if (d3_event.buttons !== 0) return;

                show.apply(this, arguments);
            });
            anchor.on(_pointerPrefix + 'leave.popover', function() {
                hide.apply(this, arguments);
            });

        } else if (display === 'clickFocus') {
            anchor
                .on(_pointerPrefix + 'down.popover', function() {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                })
                .on(_pointerPrefix + 'up.popover', function() {
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
        var anchor = d3_select(this);
        var popoverSelection = anchor.selectAll('.popover-' + _id);

        if (popoverSelection.empty()) {
            // popover was removed somehow, put it back
            anchor.call(popover.destroy);
            anchor.each(setup);
            popoverSelection = anchor.selectAll('.popover-' + _id);
        }

        popoverSelection.classed('in', true);

        var displayType = _displayType.apply(this, arguments);
        if (displayType === 'clickFocus') {
            anchor.classed('active', true);
            popoverSelection.node().focus();
        }

        anchor.each(updateContent);
    }

    function updateContent() {
        var anchor = d3_select(this);

        if (_content) {
            anchor.selectAll('.popover-' + _id + ' > .popover-inner')
                .call(_content.apply(this, arguments));
        }

        updatePosition.apply(this, arguments);
        // hack: update multiple times to fix instances where the absolute offset is
        // set before the dynamic popover size is calculated by the browser
        updatePosition.apply(this, arguments);
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
        popoverSelection
            .classed('left', false)
            .classed('right', false)
            .classed('top', false)
            .classed('bottom', false)
            .classed(placement, true);

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

                var arrow = anchor.selectAll('.popover-' + _id + ' > .popover-arrow');
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
