import _isObject from 'lodash-es/isObject';


var ValidationIssueType = Object.freeze({
    deprecated_tags: 'deprecated_tags',
    disconnected_highway: 'disconnected_highway',
    many_deletions: 'many_deletions',
    missing_tag: 'missing_tag',
    old_multipolygon: 'old_multipolygon',
    tag_suggests_area: 'tag_suggests_area',
    map_rule_issue: 'map_rule_issue',
});


var ValidationIssueSeverity = Object.freeze({
    warning: 'warning',
    error: 'error',
});


export { ValidationIssueType, ValidationIssueSeverity };


export function validationIssue(attrs) {
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
    this.coordinates = attrs.coordinates;  // expect an array of [lon, lat]
    this.fixes = attrs.fixes;  // expect an array of functions for possible fixes
}
