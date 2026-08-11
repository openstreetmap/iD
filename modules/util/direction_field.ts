import type { coreGraph } from '../core';
import type { EntityId, OsmEntity } from '../osm';
import { presetManager } from '../presets';
import { utilHasDirectionDegrees } from './direction_degrees';


/**
 * True for `direction` and `*:direction` tag keys.
 */
export function utilIsDirectionKey(key: string | undefined): key is TagKey {
    return !!key && (key === 'direction' || key.endsWith(':direction'));
}


/**
 * Whether the tag-reference UI should mention Rotate (R).
 * Preset fields pass `fieldType`; raw tags fall back to a degrees/cardinal check.
 */
export function utilShowsDirectionRotateHint(what: {
    key?: string;
    value?: string;
    fieldType?: string;
}): boolean {
    if (!utilIsDirectionKey(what.key)) return false;
    if (what.fieldType) return what.fieldType === 'number';
    return utilHasDirectionDegrees(what.value);
}


/**
 * Find a direction field on the entity's preset.
 * @param numeric when true, match angle fields (`type: number`);
 *   when false, match relative fields used by reverse (`forward`/`backward`).
 * @returns false or the direction tag key
 */
export function utilDirectionFieldKey(
    node: OsmEntity,
    graph: coreGraph,
    numeric: boolean
): false | TagKey {
    // @ts-expect-error -- will be fixed in a different PR
    const preset = presetManager.match(node, graph);
    const loc = node.extent(graph).center();
    const geometry = node.geometry(graph);

    const fields = [...preset.fields(loc), ...preset.moreFields(loc)];

    const maybeDirectionField = fields.find(field => {
        if (!utilIsDirectionKey(field.key)) return false;

        // Numeric angle fields vs relative forward/backward fields.
        const isNumericField = field.type === 'number';
        if (numeric !== isNumericField) return false;

        // the field's geometry might be restricted to a subset of the preset's geometry
        const isGeometryValid = !field.geometry || field.geometry.includes(geometry);

        return isGeometryValid;
    });

    return maybeDirectionField?.key || false;
}


/**
 * Resolve which direction tag key rotate should use for a node.
 * Prefers an existing degrees/cardinal `*:direction` / `direction` tag (including
 * multi-value), otherwise a numeric direction field on the preset (so R can set
 * an absent tag).
 */
export function utilRotatePointDirectionKey(
    node: OsmEntity,
    graph: coreGraph
): false | TagKey {
    let plainDirectionKey: TagKey | false = false;

    for (const key of Object.keys(node.tags)) {
        if (!utilIsDirectionKey(key)) continue;
        if (!utilHasDirectionDegrees(node.tags[key])) continue;
        // Prefer prefixed keys (e.g. camera:direction) over plain direction.
        if (key !== 'direction') return key;
        plainDirectionKey = key;
    }

    if (plainDirectionKey) return plainDirectionKey;

    return utilDirectionFieldKey(node, graph, true);
}


/**
 * Like {@link utilRotatePointDirectionKey}, but for a selection: only a single
 * selected node is eligible for point-direction rotate.
 */
export function utilSelectedRotatePointDirectionKey(
    entityIDs: readonly EntityId[],
    graph: coreGraph
): false | TagKey {
    if (entityIDs.length !== 1) return false;

    const entity = graph.hasEntity(entityIDs[0]);
    if (!entity || entity.type !== 'node') return false;

    return utilRotatePointDirectionKey(entity, graph);
}
