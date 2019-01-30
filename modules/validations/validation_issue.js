import _isObject from 'lodash-es/isObject';
import _map from 'lodash-es/map';
import { osmEntity } from '../osm';

var ValidationIssueType = Object.freeze({
    deprecated_tags: 'deprecated_tags',
    disconnected_highway: 'disconnected_highway',
    many_deletions: 'many_deletions',
    missing_tag: 'missing_tag',
    old_multipolygon: 'old_multipolygon',
    tag_suggests_area: 'tag_suggests_area',
    map_rule_issue: 'map_rule_issue',
    crossing_ways: 'crossing_ways',
    highway_almost_junction: 'highway_almost_junction',
    generic_name: 'generic_name'
});


var ValidationIssueSeverity = Object.freeze({
    warning: 'warning',
    error: 'error',
});


export { ValidationIssueType, ValidationIssueSeverity };


export function validationIssue(attrs) {

    // A unique, deterministic string hash.
    // Issues with identical id values are considered identical.
    this.id = function () {
        var id = this.type;

        if (this.hash) {
            // subclasses can pass in their own differentiator
            id += this.hash;
        }

        // issue subclasses set the entity order but it must be deterministic
        var entityKeys = _map(this.entities, function(entity) {
            // use the key since it factors in the entity's local version
            return osmEntity.key(entity);
        });
        // factor in the entities this issue is for
        id += entityKeys.join();
        if (this.coordinates) {
            // factor in coordinates since two separate issues can have an
            // idential type and entities, e.g. in crossing_ways
            id += this.coordinates.join();
        }
        return id;
    };

    if (!_isObject(attrs)) throw new Error('Input attrs is not an object');
    if (!attrs.type || !ValidationIssueType.hasOwnProperty(attrs.type)) {
        throw new Error('Invalid attrs.type: ' + attrs.type);
    }
    if (!attrs.severity || !ValidationIssueSeverity.hasOwnProperty(attrs.severity)) {
        throw new Error('Invalid attrs.severity: ' + attrs.severity);
    }
    if (!attrs.message) throw new Error('attrs.message is empty');

    this.type = attrs.type;
    this.severity = attrs.severity;
    this.message = attrs.message;
    this.tooltip = attrs.tooltip;
    this.entities = attrs.entities;  // expect an array of entities
    this.coordinates = attrs.coordinates;  // expect a [lon, lat] array
    this.info = attrs.info; // an object containing arbitrary extra information
    this.fixes = attrs.fixes;  // expect an array of functions for possible fixes

    this.hash = attrs.hash; // an optional string to further differentiate the issue

    this.loc = function() {
        if (this.coordinates && Array.isArray(this.coordinates) && this.coordinates.length === 2) {
            return this.coordinates;
        }
        if (this.entities && this.entities.length > 0) {
            if (this.entities[0].loc) {
                return this.entities[0].loc;
            }
        }
    };

    if (this.fixes) {
        for (var i=0; i<this.fixes.length; i++) {
            // add a reference in the fix to the issue for use in fix actions
            this.fixes[i].issue = this;
        }
    }
}

export function validationIssueFix(attrs) {

    this.title = attrs.title;
    this.onClick = attrs.onClick;

    // the issue this fix is for
    this.issue = null;
}
