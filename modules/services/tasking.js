import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json, text as d3_text } from 'd3-fetch';
import { utilRebind } from '../util';

import rbush from 'rbush';

var dispatch = d3_dispatch('loaded', 'loadedProject', 'loadedTask', 'loadedTasks');

var apibase = 'http://127.0.0.1:5000/api/v1/'; // TODO: TAH - change to real url when published
var _taskingCache;


function parseUrl(url) {
    var parsedUrl = {};

    // TODO: get finish regex to get url type
    var project_re = new RegExp(/http:\/\/127.0.0.1:5000\/api\/v1\/project\/[0-9]/);
    var task_re = new RegExp(/http:\/\/127.0.0.1:5000\/api\/v1\/project\/[0-9]+\/task\/[0-9]+$/);

    var _project = project_re.test(url);
    var _task = task_re.test(url);

    parsedUrl.urlType = _task ? 'task' : _project ? 'project' : undefined;
    parsedUrl.url_slugs = url.split('?')[0].split('/');

    parsedUrl.params = url.split('?')[1];


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

export default {

    init: function() {
        utilRebind(this, dispatch, 'on');

        _taskingCache = {
            projects: rbush(),
            troject: {},
            tasks: rbush(),
            task: {},
        };
    },


    // reset: function() {
    //     _taskingCache = {
    //         projects: rbush(),
    //         currProject: {},
    //         tasks: rbush(),
    //         currTask: {},
    //     };
    // },


    // loadProject: function(projectId) {

    //     var that = this;
    //     var path = 'project/' + projectId + '?as_file=false';

    //     var url = apibase + path;
    //     d3_text(url)
    //     .then(function(result) {
    //         if (result) {
    //             var json = JSON.parse(result);
    //             _taskingCache.project = json;

    //             // TODO: TAH - cache geojson tasks as well
    //         }
    //         dispatch.call('loadedProject');
    //     })
    //     .catch(function(err) {
    //         console.log('loadTask error: ', err); // TODO: TAH - better handling of errors
    //     });
    // },


    // setProject: function(project) {
    //     _taskingCache.project = project;

    // },


    // getProject: function(id) {
    //     if (!arguments.length) return _taskingCache.project;

    //     var _project = _taskingCache.projects(id) ? _taskingCache.projects(id) : undefined;
    //     return _project;
    // },


    // getProjectId: function() {
    //     return _taskingCache.project.projectId;
    // },


    // loadTask: function(projectId, taskId) {

    //     if (!_taskingCache.task[taskId]) {
    //         var that = this;
    //         var path = 'project/' + projectId + '/task/' + taskId + '?as_file=false';

    //         var url = apibase + path;
    //         d3_text(url)
    //         .then(function(result) {
    //             if (result) {
    //                 var json = JSON.parse(result);
    //                 _taskingCache.task = json;

    //                 // also load the project details
    //                 that.loadProject(projectId);
    //             }

    //             dispatch.call('loadedTask');
    //         })
    //         .catch(function(err) {
    //             console.log('loadTask error: ', err); // TODO: TAH - better handling of errors
    //         });
    //     }
    // },

    // getTask: function(id) {
    //     if (!arguments.length) return _taskingCache.task;

    //     var _task = _taskingCache.tasks(id) ? _taskingCache.tasks(id) : undefined;
    //     return _task;
    // },


    // getTaskId: function() {
    //     return _taskingCache.task.taskId;
    // },


    // loadFromURL: function(url) {
    //     var that = this;

    //     // parse url to get type, project, and task (if present)
    //     var parsedUrl = parseUrl(url);

    //     switch (parsedUrl.urlType) {
    //         case 'task':
    //             that.loadTask(parsedUrl.projectId, parsedUrl.taskId);
    //             break;
    //         case 'project':
    //             that.loadProject(parsedUrl.projectId);
    //             break;
    //         case undefined:
    //             console.log('undefined url result: ', parsedUrl); // TODO: TAH - better handling of urlType
    //             break;
    //         default:
    //             break;
    //     }
    // }
};
