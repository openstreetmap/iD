import { select as d3_select } from 'd3-selection';
import { utilFunctor, type Functor } from '../util/util';

let _popoverID = 0;
const MIN_MARGIN = 10;

// use pointer events on supported platforms; fallback to mouse events
const _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';

export class uiPopover {
    private _id = _popoverID++;
    private klass: string;

    private _anchorSelection: d3.Selection<HTMLElement> = d3_select(null!);
    private _animation: Functor<boolean> = utilFunctor(false);
    private _placement: Functor<string> = utilFunctor('top'); // top, bottom, left, right
    private _alignment: Functor<string> = utilFunctor('center');  // leading, center, trailing
    private _scrollContainer: Functor<d3.Selection<HTMLElement>> = utilFunctor(d3_select(null!));
    private _content : Functor<(selection: d3.Selection<HTMLElement>) => void> = () => () => {};
    private _displayType: Functor<string> = utilFunctor('');
    private _hasArrow: Functor<boolean> = utilFunctor(true);

    constructor(klass?: string) {
        this.klass = klass || '';
    }

    render(selection: d3.Selection<HTMLElement>) {
        this._anchorSelection = selection;
        selection.each(this.setup);
    }

    displayType(): Functor<string>;
    displayType(val: string | Functor<string>): this;
    displayType(val?: string | Functor<string>) {
        if (arguments.length) {
            this._displayType = utilFunctor(val!);
            return this;
        } else {
            return this._displayType;
        }
    }

    hasArrow(): Functor<boolean>;
    hasArrow(val: boolean | Functor<boolean>): this;
    hasArrow(val?: boolean | Functor<boolean>) {
        if (arguments.length) {
            this._hasArrow = utilFunctor(val!);
            return this;
        } else {
            return this._hasArrow;
        }
    }

    placement(): Functor<string>;
    placement(val: string | Functor<string>): this;
    placement(val?: string | Functor<string>) {
        if (arguments.length) {
            this._placement = utilFunctor(val!);
            return this;
        } else {
            return this._placement;
        }
    }

    alignment(): Functor<string>;
    alignment(val: string | Functor<string>): this;
    alignment(val?: string | Functor<string>) {
        if (val !== undefined) {
            this._alignment = utilFunctor(val);
            return this;
        } else {
            return this._alignment;
        }
    }

    scrollContainer(): Functor<d3.Selection<HTMLElement>>;
    scrollContainer(val: d3.Selection<HTMLElement> | Functor<d3.Selection<HTMLElement>>): this;
    scrollContainer(val?: d3.Selection<HTMLElement> | Functor<d3.Selection<HTMLElement>>) {
        if (arguments.length) {
            this._scrollContainer = utilFunctor(val!);
            return this;
        } else {
            return this._scrollContainer;
        }
    }

    content(): Functor<(selection: d3.Selection<HTMLElement>) => void>;
    content(val: Functor<(selection: d3.Selection<HTMLElement>) => void>): this;
    content(val?: Functor<(selection: d3.Selection<HTMLElement>) => void>) {
        if (arguments.length) {
            this._content = val!;
            return this;
        } else {
            return this._content;
        }
    }

    isShown(): boolean {
        const popoverSelection = this._anchorSelection.select('.popover-' + this._id);
        return !popoverSelection.empty() && popoverSelection.classed('in');
    }

    show(): void {
        if (this._anchorSelection.empty()) return;
        this._anchorSelection.each(show);
    }

    updateContent(): void {
        this._anchorSelection.each(updateContent);
    }

    hide(): void {
        this._anchorSelection.each(hide);
    }

    toggle(): void {
        this._anchorSelection.each(toggle);
    }

    destroy(selection: d3.Selection<HTMLElement>, selector?: string): void {
        // by default, just destroy the current popover
        selector = selector || '.popover-' + this._id;

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
    }

    destroyAny(selection: d3.Selection<HTMLElement>) {
        selection.call(this.destroy, '.popover');
    }

    setup(node: HTMLElement, ...args: any[]) {
        const anchor = d3_select(node);
        const animate = this._animation.apply(this, args);
        let popoverSelection = anchor.selectAll<HTMLDivElement, any>('.popover-' + this._id)
            .data([0]);


        const enter = popoverSelection.enter()
            .append('div')
            .classed(`popover popover-${this._id}`, true)
            .classed(this.klass, true)
            .classed('arrowed', this._hasArrow.apply(node, args));

        enter
            .append('div')
            .classed('popover-arrow', true);

        enter
            .append('div')
            .classed('popover-inner', true);

        popoverSelection = enter
            .merge(popoverSelection);

        if (animate) {
            popoverSelection.classed('fade', true);
        }

        const display = this._displayType.apply(node, args);

        if (display === 'hover') {
            let _lastNonMouseEnterTime: number;
            const self = this;
            anchor.on(_pointerPrefix + 'enter.popover', function(d3_event: PointerEvent) {

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

                self._show(node, ...args);
            })
            .on(_pointerPrefix + 'leave.popover', function() {
                self._hide(node, ...args);
            })
            // show on focus too for better keyboard navigation support
            .on('focus.popover', function() {
                self._show(node, ...args);
            })
            .on('blur.popover', function() {
                self._hide(node, ...args);
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
                    anchor.each(function() {
                        self._hide(node, ...args);
                    });
                });
        }
    }


    private _show(node: HTMLElement, ...args: any[]) {
        const anchor = d3_select<HTMLElement, any>(node);
        const popoverSelection = anchor.selectAll<HTMLDivElement, any>('.popover-' + this._id);

        if (popoverSelection.empty()) {
            // popover was removed somehow, put it back
            const self = this;
            anchor.call(function() { self.destroy(this); });
            anchor.each(this.setup);
            popoverSelection = anchor.selectAll('.popover-' + _id);
        }

        popoverSelection.classed('in', true);

        var displayType = _displayType.apply(this, args as []);
        if (displayType === 'clickFocus') {
            anchor.classed('active', true);
            popoverSelection.node()!.focus();
        }

        anchor.each(updateContent);
    }

    private updateContent(node: HTMLElement, ...args: any[]) {
        var anchor = d3_select(this);

        if (_content) {
            anchor.selectAll<HTMLElement, any>('.popover-' + _id + ' > .popover-inner')
                .call(_content.apply(this, args));
        }

        updatePosition.apply(this, args);
        // hack: update multiple times to fix instances where the absolute offset is
        // set before the dynamic popover size is calculated by the browser
        updatePosition.apply(this, args);
        updatePosition.apply(this, args);
    }


    function updatePosition(this: HTMLElement, ...args: any[]) {
        var anchor = d3_select(this);
        var popoverSelection = anchor.selectAll<HTMLDivElement, any>('.popover-' + _id);

        var scrollContainer = _scrollContainer && _scrollContainer.apply(this, args);
        var scrollNode = scrollContainer && !scrollContainer.empty() && scrollContainer.node();
        var scrollLeft = scrollNode ? scrollNode.scrollLeft : 0;
        var scrollTop = scrollNode ? scrollNode.scrollTop : 0;

        var placement = _placement.apply(this, args as []);
        popoverSelection
            .classed('left', false)
            .classed('right', false)
            .classed('top', false)
            .classed('bottom', false)
            .classed(placement, true);

        var alignment = _alignment.apply(this, args as []);
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

            popoverSelection.style('left', ~~position.x + 'px').style('top', ~~position.y + 'px');
        } else {
            popoverSelection.style('left', null).style('top', null);
        }

        function getFrame(node: HTMLElement) {
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


    function hide(this: HTMLElement, ...args: any[]) {
        var anchor = d3_select(this);
        if (_displayType.apply(this, args) === 'clickFocus') {
            anchor.classed('active', false);
        }
        anchor.selectAll('.popover-' + _id).classed('in', false);
    }


    function toggle(this: HTMLElement, args: any[]) {
        if (d3_select(this).select('.popover-' + _id).classed('in')) {
            hide.apply(this, args);
        } else {
            show.apply(this, args);
        }
    }


    return popover;
}
