import type { coreGraph } from '..';
import { geoExtent } from '../../geo';
import type { Vec2 } from '../../geo/vector';
import type { EntityId, OsmEntity } from '../../osm';
import { t, type LocalizedTextRenderer } from '../localizer';

export interface Validator {
    (entity: OsmEntity, graph: coreGraph): validationIssue[];
    type: string;
}

export type CreateValidator = (context: iD.Context) => Validator;

export class validationIssue<T = unknown> {
    type: string;
    subtype?: string | null;
    severity?: 'suggestion' | 'warning' | 'error';
    message?(context: iD.Context): d3.Selector | string;
    reference?(selection: d3.Selection): void;
    entityIds: EntityId[];
    loc?: Vec2;
    data?: T;
    dynamicFixes?(context: iD.Context): validationIssueFix<T>[];
    hash?: string | number;

    id: string;
    key: string;
    autoFix: validationIssueFix<T> | null = null;



    constructor(attrs: Pick<validationIssue<T>, 'type' | 'subtype' | 'severity' | 'message' | 'reference' | 'entityIds' | 'loc' | 'data' | 'dynamicFixes' | 'hash' | 'extent'>) {
    this.type = attrs.type;                // required - name of rule that created the issue (e.g. 'missing_tag')
    this.subtype = attrs.subtype;          // optional - category of the issue within the type (e.g. 'relation_type' under 'missing_tag')
    this.severity = attrs.severity;        // required - 'suggestion' or 'warning' or 'error'
    this.message = attrs.message;          // required - function returning localized string
    this.reference = attrs.reference;      // optional - function(selection) to render reference information
    this.entityIds = attrs.entityIds;      // optional - array of IDs of entities involved in the issue
    this.loc = attrs.loc;                  // optional - [lon, lat] to zoom in on to see the issue
    this.data = attrs.data;                // optional - object containing extra data for the fixes
    this.dynamicFixes = attrs.dynamicFixes;// optional - function(context) returning fixes
    this.hash = attrs.hash;                // optional - string to further differentiate the issue

        // optional - a method that returns the geometric extent of the issue, if absent, it will be calculated from the given entityIds
        if (attrs.extent) this.extent = attrs.extent;
        this.id = this.generateID();      // generated - see below
        this.key = this.generateKey();   // generated - see below (call after generating this.id)
    }

    // A unique, deterministic string hash.
    // Issues with identical id values are considered identical.
    generateID() {
        var parts: (string | number)[] = [this.type];

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

    // An identifier suitable for use as the second argument to d3.selection#data().
    // (i.e. this should change whenever the data needs to be refreshed)
    generateKey() {
        return this.id + ':' + Date.now().toString();  // include time of creation
    }

    extent?(resolver: coreGraph) {
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

    fixes(context: iD.Context) {
        var fixes = this.dynamicFixes ? this.dynamicFixes(context) : [];
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        var issue = this;

        if (issue.severity === 'warning' || issue.severity === 'suggestion') {
            // allow ignoring any issue that's not an error
            fixes.push(new validationIssueFix({
                title: this.severity === 'suggestion'
                    ? t.append('issues.fix.ignore_suggestion.title')
                    : t.append('issues.fix.ignore_issue.title'),
                icon: 'iD-icon-close',
                onClick: function() {
                    context.validator().ignoreIssue(this.issue!.id);
                }
            }));
        }

        fixes.forEach(function(fix) {
            // the id doesn't matter as long as it's unique to this issue/fix
            // except cases where fix depends on the currently selected feature.
            fix.id ||= fix.title.stringId;
            // add a reference to the issue for use in actions
            fix.issue = issue;
        });
        return fixes;
    };

    static ICONS = {
        suggestion: '#iD-icon-info',
        warning: '#iD-icon-alert',
        error: '#iD-icon-error'
    };

};

export class validationIssueFix<T = unknown> {
    title: LocalizedTextRenderer;
    id?: string;
    onClick?(this: validationIssueFix<T>, context: iD.Context, completionHandler: ()=> void): void;
    disabledReason?: string;
    icon?: string;
    entityIds?: EntityId[];

    issue: validationIssue<T> | null;

    constructor(attrs: Omit<validationIssueFix<T>, 'issue'>) {
        this.title = attrs.title;                   // Required
        this.id = attrs.id;                         // Optional
        this.onClick = attrs.onClick;               // Optional - the function to run to apply the fix
        this.disabledReason = attrs.disabledReason; // Optional - a string explaining why the fix is unavailable, if any
        this.icon = attrs.icon;                     // Optional - shows 'iD-icon-wrench' if not set
        this.entityIds = attrs.entityIds || [];     // Optional - used for hover-higlighting.

        this.issue = null;    // Generated link - added by validationIssue
    }
}
