import type { coreGraph } from '../core';
import { osmMatchTags, type osmRelation } from '../osm';
import { presetManager } from '../presets';
import type { PresetRelationDefinitions } from '../presets/preset';
import type { Geometry } from '@openstreetmap/id-tagging-schema';

const cache = new WeakMap<osmRelation, PresetRelationDefinitions>();

export function utilGetRelationSchema(relation: osmRelation, resolver: coreGraph): PresetRelationDefinitions {
    const cached = cache.get(relation);
    if (cached) return cached;

    const preset = presetManager.match(relation, resolver);
    const basePreset = presetManager.matchTags({ type: relation.tags.type }, 'relation');
    const match = preset.relationSchema() || basePreset.relationSchema() || {};

    cache.set(relation, match);
    return match;
}

/** only returns the roles which are valid for a member, given its geometry and tags */
export function utilGetValidRelationRoles(
    schema: PresetRelationDefinitions,
    memberGeom: Geometry | undefined,
    memberTags: Tags | undefined,
) {
    const filtered: PresetRelationDefinitions = { ...schema };
    for (const role in schema) {
        const def = schema[role];

        // if there's a geometry filter, check that it passes
        if (memberGeom && def.member.geometry && !def.member.geometry.includes(memberGeom)) {
            delete filtered[role];
        }

        // if there's a tags filter, check that it passes
        if (memberTags && def.member.matchTags && !osmMatchTags(def.member.matchTags, memberTags)) {
            delete filtered[role];
        }

    }
    return filtered;
}
