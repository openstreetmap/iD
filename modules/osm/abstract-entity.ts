import type { GeoJSON } from 'geojson';
import { debug, createEntity, osmIdManager, type OsmType, type EntityId } from '../index';
import { osmIsInterestingTag } from './tags';
import { utilArrayUnion } from '../util/array';
import { utilUnicodeCharsTruncated } from '../util/util';
import type { osmNode } from './node';
import type { osmWay } from './way';
import type { osmRelation } from './relation';
import type { coreGraph } from '../core/graph';
import type { geoExtent } from '../geo';

export type OsmEntity = osmNode | osmWay | osmRelation;
export type GeometryType = 'point' | 'vertex' | 'area' | 'line' | 'relation';

export interface OsmEntityProps {
    type: OsmType;
    id: EntityId;
    visible: boolean;
    tags: Tags;
    version?: number;
    changeset?: string;
    user?: string;
    uid?: number;
    timestamp?: number;
}


export abstract class OsmAbstractEntity implements OsmEntityProps {
    readonly type!: OsmType;
    readonly id!: EntityId;
    readonly visible: boolean;
    readonly tags: Readonly<Tags> = {};
    readonly version?: number;
    readonly user?: string;
    readonly changeset?: string;
    readonly uid?: number;
    readonly timestamp?: number;

    readonly v?: number;

    constructor(...sources: (Partial<OsmEntity> | Partial<OsmEntityProps>)[]) {
        for (var i = 0; i < sources.length; ++i) {
            var source = sources[i];
            for (var prop in source) {
                if (Object.prototype.hasOwnProperty.call(source, prop)) {
                    if (source[prop as keyof OsmEntityProps] === undefined) {
                        delete this[prop as keyof OsmEntityProps];
                    } else {
                        // @ts-expect-error -- this is a hack
                        this[prop] = source[prop];
                    }
                }
            }
        }

        this.id ||= osmIdManager.newId(this.type);
        this.visible ??= true;
        this.tags ||= {};

        if (debug) {
            Object.freeze(this);
            Object.freeze(this.tags);
            // properties specific to a subclass (like `members`) are frozen in the subclass
        }
    }

    abstract copy(resolver: coreGraph, copies: { [id: EntityId]: unknown }): this;

    abstract geometry(graph: coreGraph): GeometryType;

    abstract extent(
        resolver: coreGraph,
        memo?: { [id: EntityId]: boolean },
    ): geoExtent;

    abstract isDegenerate(): boolean;

    abstract asGeoJSON(resolver: coreGraph): GeoJSON;

    abstract asJXON(changesetId: EntityId): unknown;

    osmId() {
        return osmIdManager.toOSM(this.id);
    }

    isNew() {
        var osmId = osmIdManager.toOSM(this.id);
        return osmId.length === 0 || osmId[0] === '-';
    }

    update(this: osmNode, attrs: Partial<osmNode>): this;
    update(this: osmWay, attrs: Partial<osmWay>): this;
    update(this: osmRelation, attrs: Partial<osmRelation>): this;
    update(this: OsmAbstractEntity, attrs: Partial<OsmAbstractEntity>): this;
    update(attrs: Partial<OsmAbstractEntity | OsmEntity>): this {
        return <never>createEntity(this, <OsmAbstractEntity>{ ...attrs, v: 1 + (this.v || 0) });
    }

    mergeTags(tags: Tags, setTags: Tags = {}) {
        const merged = { ...this.tags };   // shallow copy
        let changed = false;

        for (const k in tags) {
            if (setTags.hasOwnProperty(k)) continue;
            const t1 = this.tags[k];
            const t2 = tags[k];
            if (!t1) {
                changed = true;
                merged[k] = t2;
            } else if (t1 !== t2) {
                changed = true;
                merged[k] = utilUnicodeCharsTruncated(
                    utilArrayUnion(t1.split(/;\s*/), t2.split(/;\s*/)).join(';'),
                    255 // avoid exceeding character limit; see also context.maxCharsForTagValue()
                );
            }
        }
        for (const k in setTags) {
            if (this.tags[k] !== setTags[k]) {
                changed = true;
                merged[k] = setTags[k];
            }
        }

        return changed ? this.update({ tags: merged }) : this;
    }


    intersects(extent: geoExtent, resolver: coreGraph) {
        return this.extent(resolver).intersects(extent);
    }

    hasNonGeometryTags() {
        return Object.keys(this.tags).some(function(k) { return k !== 'area'; });
    }

    hasParentRelations(resolver: coreGraph) {
        return resolver.parentRelations(this).length > 0;
    }

    hasInterestingTags() {
        return Object.keys(this.tags).some(osmIsInterestingTag);
    }
}
