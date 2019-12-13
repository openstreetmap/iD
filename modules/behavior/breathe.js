import deepEqual from 'fast-deep-equal';

import {
    interpolateNumber as d3_interpolateNumber,
    quantize as d3_quantize
} from 'd3-interpolate';

import { select as d3_select } from 'd3-selection';
import { scaleQuantize as d3_scaleQuantize } from 'd3-scale';
import { timer as d3_timer } from 'd3-timer';


export function behaviorBreathe() {
    var duration = 800;
    var steps = 4;
    var selector = '.selected.shadow, .selected .shadow';
    var _selected = d3_select(null);
    var _classed = '';
    var _params = {};
    var _done = false;
    var _timer;


    function ratchetyInterpolator(a, b, steps, units) {
        a = parseFloat(a);
        b = parseFloat(b);
        var sample = d3_scaleQuantize()
            .domain([0, 1])
            .range(d3_quantize(d3_interpolateNumber(a, b), steps));

        return function(t) {
            return String(sample(t)) + (units || '');
        };
    }


    function reset(selection) {
        selection
            .style('stroke-opacity', null)
            .style('stroke-width', null)
            .style('fill-opacity', null)
            .style('r', null);
    }


    function setAnimationParams(transition, fromTo) {
        var toFrom = (fromTo === 'from' ? 'to' : 'from');

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


    function calcAnimationParams(selection) {
        selection
            .call(reset)
            .each(function(d) {
                var s = d3_select(this);
                var tag = s.node().tagName;
                var p = {'from': {}, 'to': {}};
                var opacity;
                var width;

                // determine base opacity and width
                if (tag === 'circle') {
                    opacity = parseFloat(s.style('fill-opacity') || 0.5);
                    width = parseFloat(s.style('r') || 15.5);
                } else {
                    opacity = parseFloat(s.style('stroke-opacity') || 0.7);
                    width = parseFloat(s.style('stroke-width') || 10);
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


    function run(surface, fromTo) {
        var toFrom = (fromTo === 'from' ? 'to' : 'from');
        var currSelected = surface.selectAll(selector);
        var currClassed = surface.attr('class');

        if (_done || currSelected.empty()) {
            _selected.call(reset);
            _selected = d3_select(null);
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

    function behavior(surface) {
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
    }

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
