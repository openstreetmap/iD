import { dispatch as d3_dispatch } from 'd3-dispatch';

import { rendererTaskingManager } from './tasking_manager';

import { managers } from '../../data/taskingManagers.json';
import { utilRebind } from '../util/rebind';


export function rendererTasking(context) {
    var dispatch = d3_dispatch('change');

    var _enabled = false;

    var _managers = [];
    var _currManager = {};

    var _currProject = {};
    var _currTask = {};


    function tasking(selection) {

        var managers = tasking.managers();
        var enabled = tasking.enabled();

    }

    tasking.findManager = function(id) {
        return _managers.find(function(d) {
            return d.id && d.id === id;
        });
    };

    tasking.currentManager = function(d) {
        if (!arguments.length) return _currManager;

        _enabled = d !== tasking.findManager('none');

        _currManager = d;
        dispatch.call('change');

        return tasking;
    };

    tasking.managers = function() {
        return _managers;
    };

    tasking.enabled = function() {
        return _enabled;
    };

    tasking.init = function() {
        // Add all the available tasking manager sources
        _managers = managers.map(function(source) {
            return rendererTaskingManager(source);
        });

        // Add 'None'
        _managers.unshift(rendererTaskingManager.None());

        // Add 'Custom'
        _managers.unshift(rendererTaskingManager.Custom());

    };

    return utilRebind(tasking, dispatch, 'on');
}