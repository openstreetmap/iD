/*
 * Shared allowlist for Oxfmt and stricter Oxlint (TypeScript).
 *
 * Allowlist workflow:
 * - Brand-new TypeScript file (did not exist before): add it here immediately.
 * - JavaScript file migrated to TypeScript: add it only later, so the migration
 *   can merge as its own PR first; reformatting / stricter lint happen afterwards
 *   in a follow-up. Record reformatting commits in `.git-blame-ignore-revs`.
 */
export const oxcAllowlist = [
    'modules/actions/add_entity.ts',
    'modules/actions/add_member.ts',
    'modules/actions/add_midpoint.ts',
    'modules/actions/add_vertex.ts',
    'modules/actions/change_member.ts',
    'modules/actions/change_tags.ts',
    'modules/actions/circularize.ts',
    'modules/actions/connect.ts',
    'modules/actions/delete_member.ts',
    'modules/actions/delete_members.ts',
    'modules/actions/delete_multiple.ts',
    'modules/actions/delete_node.ts',
    'modules/actions/delete_relation.ts',
    'modules/actions/delete_way.ts',
    'modules/actions/discard_tags.ts',
    'modules/actions/disconnect.ts',
    'modules/actions/extract.ts',
    'modules/actions/index.ts',
    'modules/actions/join.ts',
    'modules/actions/merge.ts',
    'modules/actions/merge_nodes.ts',
    'modules/actions/merge_polygon.ts',
    'modules/actions/merge_remote_changes.ts',
    'modules/actions/move.ts',
    'modules/actions/move_node.ts',
    'modules/actions/orthogonalize.ts',
    'modules/actions/reflect.ts',
    'modules/actions/restrict_turn.ts',
    'modules/actions/reverse.ts',
    'modules/actions/revert.ts',
    'modules/actions/rotate.ts',
    'modules/actions/scale.ts',
    'modules/actions/split.ts',
    'modules/actions/straighten_nodes.ts',
    'modules/actions/straighten_way.ts',
    'modules/actions/unrestrict_turn.ts',
    'modules/actions/upgrade_tags.ts',
    'modules/behavior/index.ts',
    'modules/core/difference.ts',
    'modules/core/file_fetcher.ts',
    'modules/core/localizer.ts',
    'modules/core/tree.ts',
    'modules/core/validation/index.ts',
    'modules/id.ts',
    'modules/index.ts',
    'modules/modes/index.ts',
    'modules/operations/extract.ts',
    'modules/operations/index.ts',
    'modules/osm/intersection.ts',
    'modules/osm/multipolygon.ts',
    'modules/osm/qa_item.ts',
    'modules/renderer/index.ts',
    'modules/services/index.ts',
    'modules/svg/defs.ts',
    'modules/svg/geolocate.ts',
    'modules/svg/helpers.ts',
    'modules/svg/icon.ts',
    'modules/svg/layers.ts',
    'modules/svg/midpoints.ts',
    'modules/svg/tag_classes.ts',
    'modules/svg/touch.ts',
    'modules/svg/turns.ts',
    'modules/ui/confirm.ts',
    'modules/ui/fields/check.ts',
    'modules/ui/fields/index.ts',
    'modules/ui/index.ts',
    'modules/ui/intro/index.ts',
    'modules/ui/modal_async.ts',
    'modules/ui/panels/index.ts',
    'modules/ui/panes/index.ts',
    'modules/ui/sections/index.ts',
    'modules/ui/settings/index.ts',
    'modules/ui/tools/index.ts',
    'modules/util/error.ts',
    'modules/util/keybinding.ts',
    'modules/util/util.ts',
    'modules/validations/index.ts',
    'test/spec/core/localizer.ts',
    'test/spec/ui/fields/combo.ts',
    'test/spec/ui/fields/radio.ts',
    'test/spec/ui/multiCombo.ts',
    'test/spec_helpers.ts',
];

/** Ignore everything except allowlisted files (gitignore parent-directory un-ignore). */
export function ignorePatternsForAllowlist(allowlist) {
    const patterns = ['**/*'];
    const seenDirs = new Set();
    for (const file of allowlist) {
        const parts = file.split('/');
        for (let i = 1; i < parts.length; i++) {
            const dir = `${parts.slice(0, i).join('/')}/`;
            if (!seenDirs.has(dir)) {
                seenDirs.add(dir);
                patterns.push(`!${dir}`);
            }
        }
        patterns.push(`!${file}`);
    }
    return patterns;
}
