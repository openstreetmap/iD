import { dispatch as d3_dispatch } from 'd3-dispatch';

import { utilRebind } from '../util/rebind';


export function rendererTasking(context) {
    var dispatch = d3_dispatch('change');

    var _managerSources = ['hotosm', 'maproulette'];

    var _enabled = false;
    var _manager = '';
    var _project = {};
    var _task = {};


    function tasking(selection) {


        console.log('TAH - in tasking');
    }

    tasking.init = function() {
        console.log('TAH - in tasking.init');
    };

    tasking.findSource = function(id) {
        return _managerSources.find(function(d) {
            return d.id && d.id === id;
        });
    };

    tasking.manager = function(val) {
        console.log('TAH - in tasking.manager');
        // if (!arguments.length) return _manager;

        // _manager = val;
    };

    tasking.managers = function() {
        console.log('TAH - in tasking.managers');
    };

    return utilRebind(tasking, dispatch, 'on');
}