import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json, text as d3_text } from 'd3-fetch';

import { rendererTaskingManager } from './tasking_manager';

import { managers } from '../../data/taskingManagers.json';
import { utilRebind } from '../util/rebind';
import { services } from '../services';

import rbush from 'rbush';

var apibase = 'http://127.0.0.1:5000/api/v1/'; // TODO: TAH - change to real url when published

function parseUrl(url) {
    var parsedUrl = {};

    // split url into path and params
    var splitUrl = url.split('?');
    parsedUrl.path = splitUrl[0];
    parsedUrl.params = splitUrl[1];

    // TODO: TAH - get finish regex to get url type
    var project_re = new RegExp(/http:\/\/127.0.0.1:5000\/api\/v1\/project\/[0-9]/);
    var task_re = new RegExp(/http:\/\/127.0.0.1:5000\/api\/v1\/project\/[0-9]+\/task\/[0-9]+$/);

    var _project = project_re.test(parsedUrl.path);
    var _task = task_re.test(parsedUrl.path);

    parsedUrl.urlType = _task ? 'task' : _project ? 'project' : undefined;
    parsedUrl.url_slugs = url.split('?')[0].split('/');


    if (_task) {
        parsedUrl.taskId = parsedUrl.url_slugs[parsedUrl.url_slugs.length - 1];
    }

    if (_project) {
        if (_task) {
            parsedUrl.projectId = parsedUrl.url_slugs[parsedUrl.url_slugs.length - 3];
        } else {
            parsedUrl.projectId = parsedUrl.url_slugs[parsedUrl.url_slugs.length - 1];
        }
    }

    return parsedUrl;
}

export function rendererTasking(context) {
    var dispatch = d3_dispatch('loaded', 'loadedProject', 'loadedTask', 'loadedTasks', 'change');

    var _taskingCache;

    var _enabled = false;

    var _customSettings = {
        template: ''
    };


    function tasking(selection) {

    }


    tasking.enabled = function() {
        return _enabled;
    };


    tasking.findManager = function(id) {
        return _taskingCache.managers.find(function(d) {
            return d.id && d.id === id;
        });
    };


    tasking.currentManager = function(d) {
        if (!arguments.length) return _taskingCache.manager;

        _enabled = d !== tasking.findManager('none');

        _taskingCache.manager = d;
        dispatch.call('change');

        return tasking;
    };


    tasking.managers = function() {
        return _taskingCache.managers;
    };


    tasking.projects = function() {
        return _taskingCache.projects;
    };


    tasking.currentProject = function(d) {
        if (!arguments.length) return _taskingCache.project;

        // TODO: TAH - handle enabled/disabled

        _taskingCache.project = d;
        dispatch.call('change');

        return tasking;
    };


    tasking.resetProject = function() {
        _taskingCache.project = undefined;
    };


    tasking.customSettings = function(d) {
        if (!arguments.length) return _customSettings;

        _customSettings = d;

        return tasking;
    };


    tasking.init = function() {
        utilRebind(this, dispatch, 'on');

        _taskingCache = {
            managers: rbush(),
            manager: undefined,
            projects: rbush(),
            project: undefined,
            tasks: rbush(),
            task: undefined,
        };


        // Add all the available tasking manager sources
        _taskingCache.managers = managers.map(function(source) {
            return rendererTaskingManager(source);
        });
        // Add 'None'
        _taskingCache.managers.unshift(rendererTaskingManager.None());
        // Add 'Custom'
        _taskingCache.managers.unshift(rendererTaskingManager.Custom());

        // set none as starting manager
        tasking.currentManager(rendererTaskingManager.None());

    };


    tasking.reset = function() {
        _taskingCache = {
            managers: rbush(),
            manager: undefined,
            projects: rbush(),
            project: undefined,
            tasks: rbush(),
            task: undefined,
        };

        // set none as starting manager
        tasking.currentManager(rendererTaskingManager.None());
    };


    tasking.loadProject = function(projectId) {

        var that = this;
        var path = 'project/' + projectId + '?as_file=false';

        var url = apibase + path;
        d3_text(url)
        .then(function(result) {
            if (result) {
                var json = JSON.parse(result);
                _taskingCache.project = json;

                // TODO: TAH - cache geojson tasks as well
            }

            dispatch.call('loadedProject');
        })
        .catch(function(err) {
            console.log('loadTask error: ', err); // TODO: TAH - better handling of errors
        });
    };


    tasking.setProject = function(project) {
        _taskingCache.project = project;

    };


    tasking.getProject = function(id) {
        if (!arguments.length) return _taskingCache.project;

        var _project = _taskingCache.projects(id) ? _taskingCache.projects(id) : undefined;
        return _project;
    };


    tasking.getProjectId = function() {
        return _taskingCache.project.projectId;
    };


    tasking.loadTask = function(projectId, taskId) {

        if (!_taskingCache.task[taskId]) {
            var that = this;
            var path = 'project/' + projectId + '/task/' + taskId + '?as_file=false';

            var url = apibase + path;
            d3_text(url)
            .then(function(result) {
                if (result) {
                    var json = JSON.parse(result);
                    _taskingCache.task = json;

                    // also load the project details
                    that.loadProject(projectId);
                }

                dispatch.call('loadedTask');
            })
            .catch(function(err) {
                console.log('loadTask error: ', err); // TODO: TAH - better handling of errors
            });
        }
    };


    tasking.getTask = function(id) {
        if (!arguments.length) return _taskingCache.task;

        var _task = _taskingCache.tasks(id) ? _taskingCache.tasks(id) : undefined;
        return _task;
    };


    tasking.getTaskId = function() {
        return _taskingCache.task.taskId;
    };


    tasking.setTask = function(task) {
        _taskingCache.task = task;
    };


    tasking.loadFromURL = function(url) {
        var that = this;

        // parse url to get type, project, and task (if present)
        var parsedUrl = parseUrl(url);

        switch (parsedUrl.urlType) {
            case 'task':
                that.loadTask(parsedUrl.projectId, parsedUrl.taskId);
                break;
            case 'project':
                that.loadProject(parsedUrl.projectId);
                break;
            case undefined:
                console.log('undefined url result: ', parsedUrl); // TODO: TAH - better handling of urlType
                break;
            default:
                break;
        }
    };

    tasking.cache = function() {
        return _taskingCache;
    };

    return utilRebind(tasking, dispatch, 'on');
}