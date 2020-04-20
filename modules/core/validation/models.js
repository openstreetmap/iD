import { geoExtent } from '../../geo';
import { t } from '../../core/localizer';

export function validationIssue(attrs) {
    this.type = attrs.type;                // required - name of rule that created the issue (e.g. 'missing_tag')
    this.subtype = attrs.subtype;          // optional - category of the issue within the type (e.g. 'relation_type' under 'missing_tag')
    this.severity = attrs.severity;        // required - 'warning' or 'error'
    this.message = attrs.message;          // required - function returning localized string
    this.reference = attrs.reference;      // optional - function(selection) to render reference information
    this.entityIds = attrs.entityIds;      // optional - array of IDs of entities involved in the issue
    this.loc = attrs.loc;                  // optional - [lon, lat] to zoom in on to see the issue
    this.data = attrs.data;                // optional - object containing extra data for the fixes
    this.dynamicFixes = attrs.dynamicFixes;// optional - function(context) returning fixes
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

    this.fixes = function(context) {
        var fixes = this.dynamicFixes ? this.dynamicFixes(context) : [];
        var issue = this;

        if (issue.severity === 'warning') {
            // allow ignoring any issue that's not an error
            fixes.push(new validationIssueFix({
                title: t('issues.fix.ignore_issue.title'),
                icon: 'iD-icon-close',
                onClick: function() {
                    context.validator().ignoreIssue(this.issue.id);
                }
            }));
        }

        fixes.forEach(function(fix) {
            fix.id = fix.title;
            // add a reference to the issue for use in actions
            fix.issue = issue;
            if (fix.autoArgs) {
                issue.autoFix = fix;
            }
        });
        return fixes;
    };

}


export function validationIssueFix(attrs) {
    this.title = attrs.title;                   // Required
    this.onClick = attrs.onClick;               // Optional - the function to run to apply the fix
    this.disabledReason = attrs.disabledReason; // Optional - a string explaining why the fix is unavailable, if any
    this.icon = attrs.icon;                     // Optional - shows 'iD-icon-wrench' if not set
    this.entityIds = attrs.entityIds || [];     // Optional - used for hover-higlighting.
    this.autoArgs = attrs.autoArgs;             // Optional - pass [actions, annotation] arglist if this fix can automatically run

    this.issue = null;    // Generated link - added by validationIssue
}
