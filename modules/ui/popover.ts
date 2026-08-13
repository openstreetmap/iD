import { select as d3_select, type ValueFn } from 'd3-selection';
import { utilFunctor } from '../util/util';

var _popoverID = 0;

type Placement = 'top' | 'bottom' | 'left' | 'right';
type Alignment = 'leading' | 'center' | 'trailing';
type DisplayType = 'hover' | 'clickFocus' | '';

type ContentFn<T, This extends Element> = ValueFn<This, T, d3.Selector>;

export interface uiPopover<This extends HTMLElement, T> {
    (selection: d3.Selection<This>): void
    displayType: GetSetFunctor<this, DisplayType>;
    hasArrow: GetSetFunctor<this, boolean>;
    placement: GetSetFunctor<this, Placement>;
    alignment: GetSetFunctor<this, Alignment>;
    scrollContainer: GetSetFunctor<this, d3.Selection<HTMLElement>>;
    content: GetSet<this, ContentFn<T, This>>;

    isShown(): boolean;
    show(): void;
    updateContent(): void;
    hide(): void;
    toggle(): void;
    destroy(selection: d3.Selection<This>, selector?: string): void;
    destroyAny(selection: d3.Selection<This>): void;
}

export function uiPopover<This extends HTMLElement, T>(klass: string) {
    var _id = _popoverID++;
    var _anchorSelection: d3.Selection<any> = d3_select(null!);
    const popover: uiPopover<This, T> = function(selection) {
        _anchorSelection = selection;
        selection.each(setup);
    };
    var _animation = utilFunctor(false);
    var _placement = utilFunctor<Placement, [d: T]>('top');
    var _alignment = utilFunctor<Alignment, [d: T]>('center');
    var _scrollContainer = utilFunctor(d3_select<HTMLElement, 0>(null!));
    var _content: ContentFn<T, This> | undefined;
    var _displayType = utilFunctor<DisplayType, [d: T]>('');
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
    } as uiPopover<This, T>['displayType'];

    popover.hasArrow = function(val) {
        if (arguments.length) {
            _hasArrow = utilFunctor(val);
            return popover;
        } else {
            return _hasArrow;
        }
    } as uiPopover<This, T>['hasArrow'];

    popover.placement = function(val) {
        if (arguments.length) {
            _placement = utilFunctor(val);
            return popover;
        } else {
            return _placement;
        }
    } as uiPopover<This, T>['placement'];

    popover.alignment = function(val) {
        if (arguments.length) {
            _alignment = utilFunctor(val);
            return popover;
        } else {
            return _alignment;
        }
    } as uiPopover<This, T>['alignment'];

    popover.scrollContainer = function(val) {
        if (arguments.length) {
            _scrollContainer = utilFunctor(val);
            return popover;
        } else {
            return _scrollContainer;
        }
    } as uiPopover<This, T>['scrollContainer'];

    popover.content = function(val) {
        if (arguments.length) {
            _content = val;
            return popover;
        } else {
            return _content;
        }
    } as uiPopover<This, T>['content'];

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
            .on('focus.popover', null)
            .on('blur.popover', null)
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

    function setup(this: This, ...args: [d: T]) {
        var anchor = d3_select<This, T>(this);
        var animate = _animation.apply(this, args);
        var popoverSelection = anchor.selectAll<HTMLDivElement, 0>('.popover-' + _id)
            .data([0]);


        var enter = popoverSelection.enter()
            .append('div')
            .attr('class', 'popover popover-' + _id + ' ' + (klass ? klass : ''))
            .classed('arrowed', _hasArrow.apply(this, args));

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

        var display = _displayType.apply(this, args);

        if (display === 'hover') {
            var _lastNonMouseEnterTime: number;
            anchor.on(_pointerPrefix + 'enter.popover', function(d3_event: PointerEvent, ...args) {

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

                show.apply(this, args);
            })
            .on(_pointerPrefix + 'leave.popover', function(event, ...args) {
                hide.apply(this, args);
            })
            // show on focus too for better keyboard navigation support
            .on('focus.popover', function(event, ...args) {
                show.apply(this, args);
            })
            .on('blur.popover', function(event, ...args) {
                hide.apply(this, args);
            });

        } else if (display === 'clickFocus') {
            anchor
                .on(_pointerPrefix + 'down.popover', function(d3_event) {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                })
                .on(_pointerPrefix + 'up.popover', function(d3_event) {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                })
                .on('click.popover', toggle);

            popoverSelection
                // This attribute lets the popover take focus
                .attr('tabindex', 0)
                .on('blur.popover', function() {
                    anchor.each(function(d) {
                        hide.apply(this, [d]);
                    });
                });
        }
    }


    function show(this: This, ...args: [T]) {
        var anchor = d3_select<This, T>(this);
        var popoverSelection = anchor.selectAll<HTMLElement, 0>('.popover-' + _id);

        if (popoverSelection.empty()) {
            // popover was removed somehow, put it back
            anchor.call(popover.destroy);
            anchor.each(setup);
            popoverSelection = anchor.selectAll('.popover-' + _id);
        }

        popoverSelection.classed('in', true);

        var displayType = _displayType.apply(this, args);
        if (displayType === 'clickFocus') {
            anchor.classed('active', true);
            popoverSelection.node()!.focus();
        }

        anchor.each(updateContent);
    }

    const updateContent: ValueFn<This, T, void> = function(...args) {
        var anchor = d3_select(this);

        if (_content) {
            anchor.selectAll<HTMLElement, 0>('.popover-' + _id + ' > .popover-inner')
                .call(_content.apply(this, args));
        }

        updatePosition.apply(this, args);
        // hack: update multiple times to fix instances where the absolute offset is
        // set before the dynamic popover size is calculated by the browser
        updatePosition.apply(this, args);
        updatePosition.apply(this, args);
    };


    const updatePosition: ValueFn<This, T, void> = function(...args) {

        var anchor = d3_select(this);
        var popoverSelection = anchor.selectAll<This, 0>('.popover-' + _id);

        var scrollContainer = _scrollContainer && _scrollContainer.apply(this, args);
        var scrollNode = scrollContainer && !scrollContainer.empty() && scrollContainer.node();
        var scrollLeft = scrollNode ? scrollNode.scrollLeft : 0;
        var scrollTop = scrollNode ? scrollNode.scrollTop : 0;

        var placement = _placement.apply(this, [args[0]]);
        popoverSelection
            .classed('left', false)
            .classed('right', false)
            .classed('top', false)
            .classed('bottom', false)
            .classed(placement, true);

        var alignment = _alignment.apply(this, [args[0]]);
        var alignFactor = 0.5;
        if (alignment === 'leading') {
            alignFactor = 0;
        } else if (alignment === 'trailing') {
            alignFactor = 1;
        }
        var anchorFrame = getFrame(anchor.node()!);
        var popoverFrame = getFrame(popoverSelection.node()!);
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
            if (scrollNode) {
                const MIN_MARGIN = 10;
                const popoverRect = popoverSelection.node()!.getBoundingClientRect();
                const scrollNodeRect = scrollNode.getBoundingClientRect();
                const arrow = anchor.selectAll('.popover-' + _id + ' > .popover-arrow');

                if (placement === 'top' || placement === 'bottom') {
                    const initialPosX = position.x;
                    if (popoverRect.right > scrollNodeRect.right - MIN_MARGIN) {
                        position.x -= popoverRect.right - (scrollNodeRect.right - MIN_MARGIN);
                    } else if (popoverRect.left < scrollNodeRect.left) {
                        position.x += (scrollNodeRect.left + MIN_MARGIN) - popoverRect.left;
                    }
                    // keep the arrow centered on the button, or as close as possible
                    const arrowPosX = Math.min(Math.max(popoverFrame.w / 2 - (position.x - initialPosX), MIN_MARGIN), popoverFrame.w - MIN_MARGIN);
                    arrow.style('left', ~~arrowPosX + 'px');

                } else if (placement === 'left' || placement === 'right') {
                    const initialPosY = position.y;
                    if (popoverRect.bottom > scrollNodeRect.bottom - MIN_MARGIN) {
                        position.y -= popoverRect.bottom - (scrollNodeRect.bottom - MIN_MARGIN);
                    } else if (popoverRect.top < scrollNodeRect.top + MIN_MARGIN) {
                        position.y += (scrollNodeRect.top + MIN_MARGIN) - popoverRect.top;
                    }
                    // keep the arrow centered on the button, or as close as possible
                    const arrowPosY = Math.min(Math.max(popoverFrame.h / 2 - (position.y - initialPosY), MIN_MARGIN), popoverFrame.h - MIN_MARGIN);
                    arrow.style('top', ~~arrowPosY + 'px');
                }
            }

            popoverSelection
                .style('left', ~~position.x + 'px')
                .style('top', ~~position.y + 'px');
        } else {
            popoverSelection
                .style('left', null)
                .style('top', null);
        }

        function getFrame(node: This) {
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
    };


    function hide(this: This, ...args: [T]) {
        var anchor = d3_select(this);
        if (_displayType.apply(this, args) === 'clickFocus') {
            anchor.classed('active', false);
        }
        anchor.selectAll('.popover-' + _id).classed('in', false);
    }


    function toggle(this: This, ...args: [T]) {
        if (d3_select(this).select('.popover-' + _id).classed('in')) {
            hide.apply(this, args);
        } else {
            show.apply(this, args);
        }
    }


    return popover;
}
