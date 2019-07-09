
import _throttle from 'lodash-es/throttle';

import stringify from 'fast-json-stable-stringify';
import { utilHashcode, utilRebind } from '../../util';

import _filter from 'lodash-es/filter';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json, text as d3_text } from 'd3-fetch';

import rbush from 'rbush';

var apibase = 'http://127.0.0.1:5000/api/v1/'; // TODO: TAH - change to list of real manager urls when published
var dispatch = d3_dispatch('loaded', 'loadedProject', 'loadedTask', 'loadedTasks', 'change', 'redraw', 'loadedCustom');
var _taskingCache = {};
var _enabled = false;


var parsers = {
    task: function(gj) {
        // TODO: TAH - create an actual task object
        return gj;
    }
};


function getExtension(fileName) {
    if (!fileName) return;

    var re = /\.(gpx|kml|(geo)?json)$/i;
    var match = fileName.toLowerCase().match(re);
    return match && match.length && match[0];
}


function parseUrl(url, defaultExtension) {
    var parsedUrl = {};

    // split url into path and params
    var splitUrl = url.split('?');
    var path = splitUrl[0];
    var params = splitUrl[1];
    // parsedUrl.manager = getUrlManager(path); // TODO: TAH - add after adding managers

    // strip off any querystring/hash from the url before checking extension
    var testUrl = url.split(/[?#]/)[0];
    var extension = getExtension(testUrl) || defaultExtension;

    // TODO: TAH - get finish regex to get url type
    var _project_re = new RegExp(/http:\/\/127.0.0.1:5000\/api\/v1\/project\/[0-9]/);
    var _task_re = new RegExp(/http:\/\/127.0.0.1:5000\/api\/v1\/project\/[0-9]+\/task\/[0-9]+$/);

    var _containsProject = _project_re.test(path);
    var _containsTask = _task_re.test(path);

    var urlType = _containsTask ? 'task' : _containsProject ? 'project' : undefined;
    var url_slugs = url.split('?')[0].split('/');

    var projectId;
    var taskId;

    if (_containsTask) {
        taskId = url_slugs[url_slugs.length - 1];
    }

    if (_containsProject) {
        if (_containsTask) {
            projectId = parseInt(url_slugs[url_slugs.length - 3], 10);
        } else {
            projectId = parseInt(url_slugs[url_slugs.length - 1], 10);
        }
    }

    parsedUrl = {
        url: url,
        path: path,
        params: params,
        urlType: urlType,
        extension: extension,
        url_slugs: url_slugs,
        projectId: projectId,
        taskId: taskId,
    };

    return parsedUrl;
}


// ensure that all geojson features in a collection have IDs
function ensureIDs(gj) {
    if (!gj) return null;

    if (gj.type === 'FeatureCollection') {
        for (var i = 0; i < gj.features.length; i++) {
            ensureFeatureID(gj.features[i]);
        }
    } else {
        ensureFeatureID(gj);
    }
    return gj;
}


// ensure that each single Feature object has a unique ID
function ensureFeatureID(feature) {
    if (!feature) return;
    feature.__featurehash__ = utilHashcode(stringify(feature));
    return feature;
}


export default {


    enabled: function(val) {
        if (!arguments.length) return _enabled;

        _enabled = val;
    },


    init: function () {
        this.event = utilRebind(this, dispatch, 'on');

        _taskingCache = {
            tasks: [],
            currTask: {},
            customSettings: { url: '', extension: '', data: {} }
        };
    },


    reset: function() {

    },


    currTask: function(d) {
        if (!arguments.length) return _taskingCache.currTask;

        _taskingCache.currTask = d;
    },


    loadFromUrl: function(url, defaultExtension) {


        var that = this;

        // parse url to get type, project, and task (if present)
        var parsedUrl = parseUrl(url, defaultExtension);

        if (parsedUrl.extension) {
            d3_text(url)
                .then(function(data) {

                    var gj;
                    switch (parsedUrl.extension) {
                        case '.geojson':
                        case '.json':
                            gj = JSON.parse(data);
                            break;
                    }

                    gj = gj || {};
                    if (Object.keys(gj).length) {
                        var newTask = new parsers.task(ensureIDs(gj)); // create new task
                        _taskingCache.tasks.push(newTask); // add task to tasks
                        that.currTask(newTask); // set task as current task

                        dispatch.call('loadedTask');
                        dispatch.call('change');
                    }


                })
                .catch(function() {
                    /* ignore */
                });

        } else {
            switch (parsedUrl.urlType) {
                case 'task':
                    that.loadTask();
                    break;
                case 'project':
                    that.loadProject();
                    break;
                case undefined:
                    console.log('undefined url result: ', parsedUrl); // TODO: TAH - better handling of urlType
                    break;
                default:
                    break;
            }
        }

        return this;

    },


    setCustom: function(settings) {
        var that = this;

        that.loadFromUrl(settings.url);
        that.customSettings(settings);

        return this;
    },


    customSettings: function(d) {
        if (!arguments.length) return _taskingCache.customSettings;

        _taskingCache.customSettings = d;

        return this;
    },


    cache: function() {
        return _taskingCache;
    }

};
