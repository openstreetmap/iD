import { geoExtent } from '../../geo';

export function validationIssue(attrs) {
    this.type = attrs.type;                // required - name of rule that created the issue (e.g. 'missing_tag')
    this.subtype = attrs.subtype;          // optional - category of the issue within the type (e.g. 'relation_type' under 'missing_tag')
    this.severity = attrs.severity;        // required - 'warning' or 'error'
    this.message = attrs.message;          // required - function returning localized string
    this.reference = attrs.reference;      // optional - function(selection) to render reference information
    this.entityIds = attrs.entityIds;      // optional - array of IDs of entities involved in the issue
    this.loc = attrs.loc;                  // optional - [lon, lat] to zoom in on to see the issue
    this.data = attrs.data;                // optional - object containing extra data for the fixes
    this.fixes = attrs.fixes || [];              // optional - array of validationIssueFix objects
    this.hash = attrs.hash;                // optional - string to further differentiate the issue

    this.id = generateID.apply(this);      // generated - see below
    this.autoFix = null;                   // generated - if autofix exists, will be set below

    // A unique, deterministic string hash.
    // Issues with identical id values are considered identical.
    function generateID() {
        var parts = [this.type];

        if (this.hash) {   // subclasses can pass in their own differentiator
            parts.push(this.hash);
        }

        if (this.subtype) {
            parts.push(this.subtype);
        }

        // include the entities this issue is for
        // (sort them so the id is deterministic)
        if (this.entityIds) {
            var entityKeys = this.entityIds.slice().sort();
            parts.push.apply(parts, entityKeys);
        }

        return parts.join(':');
    }

    this.extent = function(resolver) {
        if (this.loc) {
            return geoExtent(this.loc);
        }
        if (this.entityIds && this.entityIds.length) {
            return this.entityIds.reduce(function(extent, entityId) {
                return extent.extend(resolver.entity(entityId).extent(resolver));
            }, geoExtent());
        }
        return null;
    };


    if (this.fixes) {   // add a reference in the fixes to the issue for use in fix actions
        for (var i = 0; i < this.fixes.length; i++) {
            var fix = this.fixes[i];
            fix.issue = this;
            if (fix.autoArgs) {
                this.autoFix = fix;
            }
        }
    }
}


export function validationIssueFix(attrs) {
    this.title = attrs.title;                 // Required
    this.onClick = attrs.onClick;             // Required
    this.icon = attrs.icon;                   // Optional - shows 'iD-icon-wrench' if not set
    this.entityIds = attrs.entityIds || [];   // Optional - Used for hover-higlighting.
    this.autoArgs = attrs.autoArgs;           // Optional - pass [actions, annotation] arglist if this fix can automatically run

    this.issue = null;    // Generated link - added by ValidationIssue constructor
}
