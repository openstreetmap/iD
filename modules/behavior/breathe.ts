import { deepEqual } from 'fast-equals';

import {
    interpolateNumber as d3_interpolateNumber,
    quantize as d3_quantize
} from 'd3-interpolate';

import { select as d3_select } from 'd3-selection';
import { scaleQuantize as d3_scaleQuantize } from 'd3-scale';
import { timer as d3_timer } from 'd3-timer';
import type { Behaviour } from '../core/context';
import type { Timer, Transition } from 'd3';

type Surface = any;
type FromTo = 'from' | 'to';
interface TransitionableCss {
    opacity?: number;
    width?: number;
};
interface CssParams {
    tag?: string;
    from: TransitionableCss;
    to: TransitionableCss;
}

export interface BehaviourBreathe extends Behaviour {
    restartIfNeeded(surface: Surface): void;
}

export function behaviorBreathe() {
    var duration = 800;
    var steps = 4;
    var selector = '.selected.shadow, .selected .shadow';
    var _selected = d3_select<HTMLElement, 0>(null!);
    var _classed = '';
    var _params: { [id: string]: CssParams } = {};
    var _done = false;
    var _timer: Timer;


    function ratchetyInterpolator(a: number | string | undefined, b: number | string | undefined, steps: number, units?: string) {
        a = Number(a);
        b = Number(b);
        var sample = d3_scaleQuantize()
            .domain([0, 1])
            .range(d3_quantize(d3_interpolateNumber(a, b), steps));

        return function(t: number) {
            return String(sample(t)) + (units || '');
        };
    }


    function reset(selection: d3.Selection) {
        selection
            .style('stroke-opacity', null)
            .style('stroke-width', null)
            .style('fill-opacity', null)
            .style('r', null);
    }


    function setAnimationParams(transition: Transition<HTMLElement, any, any, any>, fromTo: FromTo) {
        var toFrom: FromTo = (fromTo === 'from' ? 'to' : 'from');

        transition
            .styleTween('stroke-opacity', function(d) {
                return ratchetyInterpolator(
                    _params[d.id][toFrom].opacity,
                    _params[d.id][fromTo].opacity,
                    steps
                );
            })
            .styleTween('stroke-width', function(d) {
                return ratchetyInterpolator(
                    _params[d.id][toFrom].width,
                    _params[d.id][fromTo].width,
                    steps,
                    'px'
                );
            })
            .styleTween('fill-opacity', function(d) {
                return ratchetyInterpolator(
                    _params[d.id][toFrom].opacity,
                    _params[d.id][fromTo].opacity,
                    steps
                );
            })
            .styleTween('r', function(d) {
                return ratchetyInterpolator(
                    _params[d.id][toFrom].width,
                    _params[d.id][fromTo].width,
                    steps,
                    'px'
                );
            });
    }


    function calcAnimationParams(selection: d3.Selection) {
        selection
            .call(reset)
            .each(function(d) {
                var s = d3_select(this);
                var tag = s.node()!.tagName;
                var p: CssParams = {'from': {}, 'to': {}};
                var opacity;
                var width;

                // determine base opacity and width
                if (tag === 'circle') {
                    opacity = Number(s.style('fill-opacity') || 0.5);
                    width = Number(s.style('r') || 15.5);
                } else {
                    opacity = Number(s.style('stroke-opacity') || 0.7);
                    width = Number(s.style('stroke-width') || 10);
                }

                // calculate from/to interpolation params..
                p.tag = tag;
                p.from.opacity = opacity * 0.6;
                p.to.opacity = opacity * 1.25;
                p.from.width = width * 0.7;
                p.to.width = width * (tag === 'circle' ? 1.5 : 1);
                _params[d.id] = p;
            });
    }


    function run(surface: d3.Selection, fromTo: FromTo) {
        var toFrom: FromTo = (fromTo === 'from' ? 'to' : 'from');
        var currSelected = surface.selectAll<HTMLElement, 0>(selector);
        var currClassed = surface.attr('class');

        if (_done || currSelected.empty()) {
            _selected.call(reset);
            _selected = d3_select<HTMLElement, 0>(null!);
            return;
        }

        if (!deepEqual(currSelected.data(), _selected.data()) || currClassed !== _classed) {
            _selected.call(reset);
            _classed = currClassed;
            _selected = currSelected.call(calcAnimationParams);
        }

        var didCallNextRun = false;

        _selected
            .transition()
            .duration(duration)
            .call(setAnimationParams, fromTo)
            .on('end', function() {
                // `end` event is called for each selected element, but we want
                // it to run only once
                if (!didCallNextRun) {
                    surface.call(run, toFrom);
                    didCallNextRun = true;
                }

                // if entity was deselected, remove breathe styling
                if (!d3_select(this).classed('selected')) {
                    reset(d3_select(this));
                }
            });
    }

    const behavior: BehaviourBreathe = function(surface) {
        _done = false;
        _timer = d3_timer(function() {
            // wait for elements to actually become selected
            if (surface.selectAll(selector).empty()) {
                return false;
            }

            surface.call(run, 'from');
            _timer.stop();
            return true;
        }, 20);
    };

    behavior.restartIfNeeded = function(surface) {
        if (_selected.empty()) {
            surface.call(run, 'from');
            if (_timer) {
                _timer.stop();
            }
        }
    };

    behavior.off = function() {
        _done = true;
        if (_timer) {
            _timer.stop();
        }
        _selected
            .interrupt()
            .call(reset);
    };


    return behavior;
}
