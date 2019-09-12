
import { tmTask } from './tm_task';
import { geoExtent } from '../../geo';
import { getData } from './fetch_tm';

export function tmProject() {
    if (!(this instanceof tmProject)) {
        var project = new tmProject();
        return project.initialize.apply(project, arguments);
    } else if (arguments.length) {
        this.initialize.apply(this, arguments);
    }
}


Object.assign(tmProject.prototype, {

    type: 'tmProject',

    initialize: function(source) {
        this.id = source.id;
        this.tasker = source.tasker;
        return this;
    },

    uid: function() {
        return this.tasker.apiBase + '/' + this.id;
    },

    loadFromRemote: function(onCompletion) {
        try {
            var that = this;
            getData(this.tasker.apiBase + '/api/v1/project/' + this.id)
                .then(function(result) {
                    if (!result) return;
                    that.parseRemoteResult(result);
                    if (onCompletion) onCompletion(that);
                })
                .catch(function(err) {
                    //var { errors, message } = handleError(taskingTask, err, that.errors());

                    // update cache errors
                    //that.errors(errors);

                    //return message;
                });
        } catch (error) {
            console.log('loadProject error: ', error);
        }
    },

    parseRemoteResult: function(result) {
        this.geometry = result.geometry;
        this.id = result.projectId;
        this.author = result.author;
        this.name = result.projectInfo.name;
        this.shortDescription = result.projectInfo.shortDescription;
        this.description = result.projectInfo.description;
        this.instructions = result.projectInfo.instructions;
        this.status = result.projectStatus.toLowerCase();
        this.priority = result.projectPriority.toLowerCase();
        this.defaultLocale = result.defaultLocale;
        this.campaignTag = result.campaignTag;
        this.organisationTag = result.organisationTag;
        this.tasks = {};
        var that = this;
        result.tasks.features.forEach(function(geoJsonFeature) {
            var taskId = geoJsonFeature.properties.taskId;
            that.tasks[taskId] = new tmTask({
                id: taskId,
                project: that,
                tasker: that.tasker,
                geoJsonFeature: geoJsonFeature
            });
        });
        this.mappingTypes = result.mappingTypes;
        this.aoiGeoJson = result.areaOfInterest;
    },

    extent: function() {
        return geoExtent(this.geometry.coordinates);
    },

    areaOfInterestExtent: function() {
        return geoExtent(this.aoiGeoJson);
    },

    tasks: {},

    loadTask: function(taskId, onCompletion) {
        if (this.tasks[taskId]) {
            this.tasks[taskId].loadFromRemote(onCompletion);
        }
    },

});
