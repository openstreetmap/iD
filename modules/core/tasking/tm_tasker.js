
import { taskingTasker } from './tasker';
import { tmProject } from './tm_project';

export function tmTasker() {
    if (!(this instanceof tmTasker)) {
        var tasker = new tmTasker();
        return tasker.initialize.apply(tasker, arguments);
    } else if (arguments.length) {
        this.initialize.apply(this, arguments);
    }
}

tmTasker.prototype = Object.create(taskingTasker.prototype);

Object.assign(tmTasker.prototype, {

    initialize: function(source) {
        this.apiBase = source.apiBase;
        return this;
    },

    projects: {},

    loadProject: function(projectId, onCompletion) {
        if (this.projects[projectId]) {
            // already loaded, just run completion
            onCompletion(this.projects[projectId]);
        } else {
            var project = new tmProject({
                id: projectId,
                tasker: this
            });
            this.projects[projectId] = project;
            project.loadFromRemote(onCompletion);
        }
    },

    cancelTasking: function() {
        var that = this;

        // unlock task
        that.unlockTask(that.activeTask())
            .then(function(unlockResponse) {
                return unlockResponse;
            })
            .catch(function(err) { console.log('unlockTask err: ', err ); });

        // reset current project and task
        that.resetCurrentProjectAndTask();

        //dispatch.call('cancelTasking');
    }

});
