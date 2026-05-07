import { drag as d3_drag, type D3DragEvent } from 'd3-drag';

import { utilNormalizeAzimuthDegrees } from '../util/direction_degrees';


type DialRange = { start: number; end: number };
type DirectionDialValue = number | DialRange;
type DirectionDialCallback = (value: DirectionDialValue) => void;

type DialWrapperSelection = d3.Selection<HTMLDivElement>;

type DialSvgDatum = number;

type DialSvgDragEvent = D3DragEvent<SVGSVGElement, DialSvgDatum, DialSvgDatum>;

interface DirectionDial {
    (selection: DialWrapperSelection): void;
    value: (val: number | null) => DirectionDial;
    range: (val: DialRange | null) => DirectionDial;
    disabled: (val: boolean) => DirectionDial;
    /** Degrees between absolute snap positions (preset `increment`, e.g. 5 → 0, 5, 10, …). */
    step: (val: number) => DirectionDial;
    onInput: (callback: DirectionDialCallback) => DirectionDial;
    onCommit: (callback: DirectionDialCallback) => DirectionDial;
}


const DIAL_SIZE = 92;
const DIAL_CENTER = DIAL_SIZE / 2;
const DIAL_RADIUS = 34;
const DIAL_BASE_RENDER_SIZE = 28;
const DIAL_MAX_DRAG_DIAMETER = 180;
const DIAL_BASE_RADIUS_PX = DIAL_BASE_RENDER_SIZE / 2;
const DIAL_MAX_RADIUS_PX = DIAL_MAX_DRAG_DIAMETER / 2;
/** White disk to the dial edge (no ring stroke). */
const DIAL_WHITE_RADIUS = DIAL_RADIUS;
const DIAL_VIEWBOX_EXTENT = DIAL_RADIUS + 1;
const DIAL_VIEWBOX_MIN = DIAL_CENTER - DIAL_VIEWBOX_EXTENT;
const DIAL_VIEWBOX_SIZE = DIAL_VIEWBOX_EXTENT * 2;


/** Snap to absolute multiples of `step` on the circle (e.g. step 5 → …, 355, 0, 5, 10, …). */
function snapAbsolute(degrees: number, step: number): number {
    if (!step || step <= 0 || !isFinite(step)) return utilNormalizeAzimuthDegrees(degrees);
    const d = utilNormalizeAzimuthDegrees(degrees);
    const snapped = Math.round(d / step) * step;
    return utilNormalizeAzimuthDegrees(snapped);
}


function shortestAngleDelta(previousDegrees: number, nextDegrees: number): number {
    let delta = nextDegrees - previousDegrees;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta;
}


function precisionGain(distanceFromCenter: number): number {
    if (distanceFromCenter <= DIAL_RADIUS) return 1;
    return Math.max(0.2, DIAL_RADIUS / distanceFromCenter);
}


function dragPointerDistanceFromCenterPx(
    event: DialSvgDragEvent,
    node: SVGSVGElement,
    centerX?: number | null,
    centerY?: number | null
): { dx: number; dy: number; distanceFromCenter: number } | null {
    const sourceEvent = event.sourceEvent as MouseEvent | TouchEvent | undefined;
    if (!sourceEvent) return null;

    let clientX: number;
    let clientY: number;
    if (sourceEvent instanceof MouseEvent) {
        clientX = sourceEvent.clientX;
        clientY = sourceEvent.clientY;
    } else {
        const touch = (sourceEvent.touches && sourceEvent.touches[0]) ||
            (sourceEvent.changedTouches && sourceEvent.changedTouches[0]);
        if (!touch) return null;
        clientX = touch.clientX;
        clientY = touch.clientY;
    }

    const rect = node.getBoundingClientRect();
    const cx = (centerX !== null && centerX !== undefined) ? centerX : (rect.left + (rect.width / 2));
    const cy = (centerY !== null && centerY !== undefined) ? centerY : (rect.top + (rect.height / 2));
    const dx = clientX - cx;
    const dy = clientY - cy;
    return { dx, dy, distanceFromCenter: Math.hypot(dx, dy) };
}


/** Direction dial UI for `*:direction` numeric fields. */
export function uiDirectionDial(): DirectionDial {
    let _value: number | null = null;
    let _range: DialRange | null = null;
    let _disabled = false;
    let _step = 1;
    let _shiftHeld = false;
    let _shiftWindowListenersAttached = false;
    let _onShiftKeyChange: ((e: KeyboardEvent) => void) | undefined;
    let _selectionRef: DialWrapperSelection | null = null;
    let _onInput: DirectionDialCallback = function() {};
    let _onCommit: DirectionDialCallback = function() {};
    let _isDragging = false;
    let _isExpandedDrag = false;
    let _dragValue = 0;
    let _lastPointerAngle = 0;
    let _dragDialDiameter = DIAL_BASE_RENDER_SIZE;
    let _dragCenterClientX: number | null = null;
    let _dragCenterClientY: number | null = null;
    let _rangeSpan = 0;
    let _rangeAnchor: number | null = null;

    function attachWrapShiftListeners() {
        if (_shiftWindowListenersAttached || typeof window === 'undefined') return;
        _shiftWindowListenersAttached = true;

        _onShiftKeyChange = function(e: KeyboardEvent) {
            const next = e.shiftKey;
            if (next !== _shiftHeld) {
                _shiftHeld = next;
                if (_selectionRef) renderDial(_selectionRef);
            }
        };

        window.addEventListener('keydown', _onShiftKeyChange, true);
        window.addEventListener('keyup', _onShiftKeyChange, true);
    }

    function detachWrapShiftListeners() {
        if (!_shiftWindowListenersAttached || !_onShiftKeyChange) return;
        window.removeEventListener('keydown', _onShiftKeyChange, true);
        window.removeEventListener('keyup', _onShiftKeyChange, true);
        _shiftWindowListenersAttached = false;
        _onShiftKeyChange = undefined;
    }

    function shiftFromDragEvent(event: DialSvgDragEvent): boolean {
        const source = event.sourceEvent;
        if (!source || typeof source !== 'object') return false;
        if (source instanceof MouseEvent) return source.shiftKey;
        if (source instanceof KeyboardEvent) return source.shiftKey;
        return false;
    }

    function rangeModifierFromDragEvent(event: DialSvgDragEvent): boolean {
        const source = event.sourceEvent;
        if (!source || typeof source !== 'object') return false;
        if (source instanceof MouseEvent) return source.metaKey || source.ctrlKey;
        if (source instanceof KeyboardEvent) return source.metaKey || source.ctrlKey;
        return false;
    }

    function pointerStateFromEvent(
        event: DialSvgDragEvent,
        node: SVGSVGElement
    ): { angle: number; distanceFromCenter: number } | null {
        const state = dragPointerDistanceFromCenterPx(event, node, _dragCenterClientX, _dragCenterClientY);
        if (!state || !isFinite(state.distanceFromCenter)) return null;
        const radians = Math.atan2(state.dx, -state.dy);
        return {
            angle: utilNormalizeAzimuthDegrees(radians * (180 / Math.PI)),
            distanceFromCenter: state.distanceFromCenter
        };
    }

    function rangeSpan(start: number, end: number): number {
        return utilNormalizeAzimuthDegrees(end - start);
    }

    function rangeCenter(start: number, end: number): number {
        return utilNormalizeAzimuthDegrees(start + (rangeSpan(start, end) / 2));
    }

    function rangeFromCenterSpan(center: number, span: number): DialRange {
        const half = span / 2;
        return {
            start: utilNormalizeAzimuthDegrees(center - half),
            end: utilNormalizeAzimuthDegrees(center + half)
        };
    }

    function rangeArcPath(start: number, end: number): string {
        const span = rangeSpan(start, end);
        if (span <= 0) return '';
        const startRad = start * (Math.PI / 180);
        const endRad = end * (Math.PI / 180);
        const x1 = DIAL_CENTER + (Math.sin(startRad) * DIAL_RADIUS);
        const y1 = DIAL_CENTER - (Math.cos(startRad) * DIAL_RADIUS);
        const x2 = DIAL_CENTER + (Math.sin(endRad) * DIAL_RADIUS);
        const y2 = DIAL_CENTER - (Math.cos(endRad) * DIAL_RADIUS);
        const largeArc = span > 180 ? 1 : 0;
        return `M ${x1} ${y1} A ${DIAL_RADIUS} ${DIAL_RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`;
    }

    function renderDial(selection: DialWrapperSelection) {
        _selectionRef = selection;

        selection
            .on('mouseenter.directionDialShift', function(event: MouseEvent) {
                if (_disabled) return;
                _shiftHeld = !!event.shiftKey;
                attachWrapShiftListeners();
                renderDial(selection);
            })
            .on('mouseleave.directionDialShift', function() {
                if (_isDragging) return;
                _shiftHeld = false;
                detachWrapShiftListeners();
                renderDial(selection);
            });

        const dialSVG = selection.selectAll<SVGSVGElement, DialSvgDatum>('svg.direction-dial')
            .data([0]);

        const dialEnter = dialSVG.enter()
            .append('svg')
            .attr('class', 'direction-dial')
            .attr('viewBox', `${DIAL_VIEWBOX_MIN} ${DIAL_VIEWBOX_MIN} ${DIAL_VIEWBOX_SIZE} ${DIAL_VIEWBOX_SIZE}`)
            .attr('aria-hidden', 'true');

        dialEnter
            .append('circle')
            .attr('class', 'direction-dial-inner')
            .attr('cx', DIAL_CENTER)
            .attr('cy', DIAL_CENTER)
            .attr('r', DIAL_WHITE_RADIUS);

        dialEnter
            .append('g')
            .attr('class', 'direction-dial-ticks');

        dialEnter
            .append('circle')
            .attr('class', 'direction-dial-ring')
            .attr('cx', DIAL_CENTER)
            .attr('cy', DIAL_CENTER)
            .attr('r', DIAL_RADIUS);

        dialEnter
            .append('line')
            .attr('class', 'direction-dial-line')
            .attr('x1', DIAL_CENTER)
            .attr('y1', DIAL_CENTER);

        dialEnter
            .append('path')
            .attr('class', 'direction-dial-range');

        dialEnter
            .append('circle')
            .attr('class', 'direction-dial-center-dot')
            .attr('cx', DIAL_CENTER)
            .attr('cy', DIAL_CENTER)
            .attr('r', 3);

        const dialMerge = dialEnter.merge(dialSVG);
        dialMerge
            .classed('disabled', _disabled)
            .classed('dragging', _isDragging)
            .classed('expanded', _isDragging && _isExpandedDrag)
            .style('width', _isDragging ? `${_dragDialDiameter}px` : null)
            .style('height', _isDragging ? `${_dragDialDiameter}px` : null)
            .attr('tabindex', _disabled ? null : 0);

        const dragBehavior = d3_drag<SVGSVGElement, DialSvgDatum>()
            .on('start', function(this: SVGSVGElement, event: DialSvgDragEvent) {
                if (_disabled) return;
                _isDragging = true;
                _isExpandedDrag = false;
                _dragDialDiameter = DIAL_BASE_RENDER_SIZE;
                attachWrapShiftListeners();
                const rect = this.getBoundingClientRect();
                _dragCenterClientX = rect.left + (rect.width / 2);
                _dragCenterClientY = rect.top + (rect.height / 2);

                const pointerState = pointerStateFromEvent(event, this);
                if (!pointerState) {
                    _isDragging = false;
                    return;
                }

                // Jump needle to click angle; drag continues from this pointer direction.
                _lastPointerAngle = pointerState.angle;
                _dragValue = pointerState.angle;
                _rangeAnchor = _dragValue;
                if (!_range && shiftFromDragEvent(event)) {
                    _dragValue = snapAbsolute(_dragValue, _step);
                }

                if (_range) {
                    _rangeSpan = rangeSpan(_range.start, _range.end);
                    _value = rangeCenter(_range.start, _range.end);
                    _onInput({ start: _range.start, end: _range.end });
                } else {
                    _value = _dragValue;
                    _onInput(Math.round(_dragValue));
                }
                renderDial(selection);
            })
            .on('drag', function(this: SVGSVGElement, event: DialSvgDragEvent) {
                if (_disabled || !_isDragging) return;

                const pointerState = pointerStateFromEvent(event, this);
                if (!pointerState) return;
                const pointerDistancePx = dragPointerDistanceFromCenterPx(
                    event,
                    this,
                    _dragCenterClientX,
                    _dragCenterClientY
                );
                if (pointerDistancePx) {
                    if (!_isExpandedDrag && pointerDistancePx.distanceFromCenter > DIAL_BASE_RADIUS_PX) {
                        _isExpandedDrag = true;
                        _dragDialDiameter = DIAL_MAX_DRAG_DIAMETER;
                        renderDial(selection);
                    }
                    if (_isExpandedDrag && pointerDistancePx.distanceFromCenter > DIAL_MAX_RADIUS_PX) {
                        return;
                    }
                }

                const pointerAngleRaw = pointerState.angle;
                const wantsSnap = shiftFromDragEvent(event);
                const wantsRangeAdjust = rangeModifierFromDragEvent(event);
                const pointerAngle = wantsSnap ? snapAbsolute(pointerAngleRaw, _step) : pointerAngleRaw;
                if (_range) {
                    if (wantsRangeAdjust && _rangeAnchor !== null) {
                        const delta = shortestAngleDelta(_rangeAnchor, pointerAngle);
                        if (delta >= 0) {
                            _range = { start: _rangeAnchor, end: pointerAngle };
                        } else {
                            _range = { start: pointerAngle, end: _rangeAnchor };
                        }
                        _rangeSpan = rangeSpan(_range.start, _range.end);
                    } else {
                        const span = _rangeSpan || rangeSpan(_range.start, _range.end);
                        _range = rangeFromCenterSpan(pointerAngle, span);
                    }
                    _dragValue = rangeCenter(_range.start, _range.end);
                    _value = _dragValue;
                } else {
                    if (wantsRangeAdjust) {
                        if (_rangeAnchor === null) {
                            _rangeAnchor = _dragValue;
                        }
                        const delta = shortestAngleDelta(_rangeAnchor, pointerAngle);
                        if (Math.abs(delta) > 0) {
                            if (delta >= 0) {
                                _range = { start: _rangeAnchor, end: pointerAngle };
                            } else {
                                _range = { start: pointerAngle, end: _rangeAnchor };
                            }
                            _rangeSpan = rangeSpan(_range.start, _range.end);
                            _dragValue = rangeCenter(_range.start, _range.end);
                            _value = _dragValue;
                        }
                    } else {
                        _rangeAnchor = null;
                        if (_isExpandedDrag) {
                            _dragValue = pointerAngle;
                        } else {
                            const delta = shortestAngleDelta(_lastPointerAngle, pointerAngle);
                            const gain = precisionGain(pointerState.distanceFromCenter);
                            _dragValue = utilNormalizeAzimuthDegrees(_dragValue + (delta * gain));
                        }
                        _value = _dragValue;
                    }
                }
                _lastPointerAngle = pointerAngle;
                if (_range) {
                    _onInput({ start: _range.start, end: _range.end });
                } else {
                    _onInput(Math.round(_dragValue));
                }

                renderDial(selection);
            })
            .on('end', function(this: SVGSVGElement, event: DialSvgDragEvent) {
                if (_disabled || !_isDragging) return;
                _isDragging = false;
                _isExpandedDrag = false;
                _dragDialDiameter = DIAL_BASE_RENDER_SIZE;
                _dragCenterClientX = null;
                _dragCenterClientY = null;
                _rangeAnchor = null;
                if (!_range && shiftFromDragEvent(event)) {
                    _dragValue = snapAbsolute(_dragValue, _step);
                }
                _value = _dragValue;
                if (_range) {
                    _onCommit({ start: _range.start, end: _range.end });
                } else {
                    _onCommit(Math.round(_dragValue));
                }
                _shiftHeld = false;
                detachWrapShiftListeners();
                renderDial(selection);
            });

        dialMerge.call(dragBehavior);

        const showTicks = _shiftHeld && _step > 0 && !_disabled;
        const tickAngles: number[] = [];
        if (showTicks && 360 / _step <= 80) {
            for (let a = 0; a < 360; a += _step) {
                tickAngles.push(a);
            }
        }

        const tickLen = 5;
        const rOuter = DIAL_RADIUS + 1;
        const rInner = DIAL_RADIUS - tickLen;

        const tickGroup = dialMerge.select<SVGGElement>('g.direction-dial-ticks')
            .style('display', function displayTicks() {
                return showTicks && tickAngles.length ? null : 'none';
            });

        const tickLines = tickGroup.selectAll<SVGLineElement, number>('line.direction-dial-tick')
            .data(tickAngles);

        tickLines.exit()
            .remove();

        const tickEnter = tickLines.enter()
            .append('line')
            .attr('class', 'direction-dial-tick');

        tickEnter.merge(tickLines)
            .attr('x1', (d: number) => DIAL_CENTER + Math.sin(d * (Math.PI / 180)) * rInner)
            .attr('y1', (d: number) => DIAL_CENTER - Math.cos(d * (Math.PI / 180)) * rInner)
            .attr('x2', (d: number) => DIAL_CENTER + Math.sin(d * (Math.PI / 180)) * rOuter)
            .attr('y2', (d: number) => DIAL_CENTER - Math.cos(d * (Math.PI / 180)) * rOuter);

        const line = dialMerge.select<SVGLineElement>('line.direction-dial-line');
        const rangePath = dialMerge.select<SVGPathElement>('path.direction-dial-range');
        const angle = (_value === null) ? null : utilNormalizeAzimuthDegrees(_value);
        const displayAngle = angle === null
            ? null
            : (_shiftHeld ? snapAbsolute(angle, _step) : angle);

        if (_range) {
            rangePath
                .classed('hidden', false)
                .attr('d', rangeArcPath(_range.start, _range.end));
        } else {
            rangePath
                .classed('hidden', true)
                .attr('d', '');
        }

        if (displayAngle === null) {
            line.classed('hidden', true);
            return;
        }

        const radians = displayAngle * (Math.PI / 180);
        const lineEndX = DIAL_CENTER + (Math.sin(radians) * DIAL_RADIUS);
        const lineEndY = DIAL_CENTER - (Math.cos(radians) * DIAL_RADIUS);

        line
            .classed('hidden', false)
            .attr('x2', lineEndX)
            .attr('y2', lineEndY);
    }

    const directionDial = renderDial as DirectionDial;

    directionDial.value = function(val: number | null) {
        _value = (val === null || !isFinite(val)) ? null : utilNormalizeAzimuthDegrees(val);
        if (_value !== null) {
            _range = null;
        }
        return directionDial;
    };

    directionDial.range = function(val: DialRange | null) {
        if (!val) {
            _range = null;
            _rangeSpan = 0;
            return directionDial;
        }
        const start = utilNormalizeAzimuthDegrees(val.start);
        const end = utilNormalizeAzimuthDegrees(val.end);
        _range = { start, end };
        _rangeSpan = rangeSpan(start, end);
        _value = rangeCenter(start, end);
        return directionDial;
    };

    directionDial.disabled = function(val: boolean) {
        _disabled = !!val;
        if (_disabled) {
            _shiftHeld = false;
            detachWrapShiftListeners();
        }
        return directionDial;
    };

    directionDial.step = function(val: number) {
        _step = (val && isFinite(val) && val > 0) ? val : 1;
        return directionDial;
    };

    directionDial.onInput = function(callback: DirectionDialCallback) {
        _onInput = callback;
        return directionDial;
    };

    directionDial.onCommit = function(callback: DirectionDialCallback) {
        _onCommit = callback;
        return directionDial;
    };

    return directionDial;
}
