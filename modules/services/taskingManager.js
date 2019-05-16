import rbush from 'rbush';

var apibase =  'http://127.0.0.1:5000/api/v1/';     // 'https://tasks.hotosm.org/api/v1/';
var test_project_url_tah = 'project/1';             // 'https://tasks.hotosm.org/api/v1/project/5797';
var test_mapped_task_url_tah = 'project/1/task/10';
var test_validated_task_url_tah = 'project/1/task/15';
var _inflight = {};
var _taskingManagerCache;

export default {
    init: function() {
        _inflight = {};
        _taskingManagerCache = rbush();
    },

    reset: function() {
        Object.values(_inflight).forEach(function(req) { req.abort(); });
        _inflight = {};
        _taskingManagerCache = rbush();
    },
};