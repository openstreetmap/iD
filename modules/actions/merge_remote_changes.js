import deepEqual from 'fast-deep-equal';
import { diff3Merge } from 'node-diff3';
import { escape } from 'lodash';

import { t } from '../core/localizer';
import { actionDeleteMultiple } from './delete_multiple';
import { osmEntity } from '../osm';
import { utilArrayUnion, utilArrayUniq } from '../util';


export function actionMergeRemoteChanges(id, localGraph, remoteGraph, discardTags, formatUser) {
    discardTags = discardTags || {};
    let _option = 'safe';  // 'safe', 'force_local', 'force_remote'
    const _conflicts = [];


    function user(d) {
        return (typeof formatUser === 'function') ? formatUser(d) : escape(d);
    }


    function mergeLocation(remote, target) {
        function pointEqual(a, b) {
            const epsilon = 1e-6;
            return (Math.abs(a[0] - b[0]) < epsilon) && (Math.abs(a[1] - b[1]) < epsilon);
        }

        if (_option === 'force_local' || pointEqual(target.loc, remote.loc)) {
            return target;
        }
        if (_option === 'force_remote') {
            return target.update({loc: remote.loc});
        }

        _conflicts.push(t.html('merge_remote_changes.conflict.location', { user: { html: user(remote.user) } }));
        return target;
    }


    function mergeNodes(base, remote, target) {
        if (_option === 'force_local' || deepEqual(target.nodes, remote.nodes)) {
            return target;
        }
        if (_option === 'force_remote') {
            return target.update({nodes: remote.nodes});
        }

        const ccount = _conflicts.length;
        const o = base.nodes || [];
        const a = target.nodes || [];
        const b = remote.nodes || [];
        const nodes = [];
        const hunks = diff3Merge(a, o, b, { excludeFalseConflicts: true });

        for (let i = 0; i < hunks.length; i++) {
            const hunk = hunks[i];
            if (hunk.ok) {
                nodes.push.apply(nodes, hunk.ok);
            } else {
                // for all conflicts, we can assume c.a !== c.b
                // because `diff3Merge` called with `true` option to exclude false conflicts..
                const c = hunk.conflict;
                if (deepEqual(c.o, c.a)) {  // only changed remotely
                    nodes.push.apply(nodes, c.b);
                } else if (deepEqual(c.o, c.b)) {  // only changed locally
                    nodes.push.apply(nodes, c.a);
                } else {       // changed both locally and remotely
                    _conflicts.push(t.html('merge_remote_changes.conflict.nodelist', { user: { html: user(remote.user) } }));
                    break;
                }
            }
        }

        return (_conflicts.length === ccount) ? target.update({nodes: nodes}) : target;
    }


    function mergeChildren(targetWay, children, updates, graph) {
        function isUsed(node, targetWay) {
            const hasInterestingParent = graph.parentWays(node)
                .some(function(way) { return way.id !== targetWay.id; });

            return node.hasInterestingTags() ||
                hasInterestingParent ||
                graph.parentRelations(node).length > 0;
        }

        const ccount = _conflicts.length;

        for (let i = 0; i < children.length; i++) {
            const id = children[i];
            const node = graph.hasEntity(id);

            // remove unused childNodes..
            if (targetWay.nodes.indexOf(id) === -1) {
                if (node && !isUsed(node, targetWay)) {
                    updates.removeIds.push(id);
                }
                continue;
            }

            // restore used childNodes..
            const local = localGraph.hasEntity(id);
            const remote = remoteGraph.hasEntity(id);
            let target;

            if (_option === 'force_remote' && remote && remote.visible) {
                updates.replacements.push(remote);

            } else if (_option === 'force_local' && local) {
                target = osmEntity(local);
                if (remote) {
                    target = target.update({ version: remote.version });
                }
                updates.replacements.push(target);

            } else if (_option === 'safe' && local && remote && local.version !== remote.version) {
                target = osmEntity(local, { version: remote.version });
                if (remote.visible) {
                    target = mergeLocation(remote, target);
                } else {
                    _conflicts.push(t.html('merge_remote_changes.conflict.deleted', { user: { html: user(remote.user) } }));
                }

                if (_conflicts.length !== ccount) break;
                updates.replacements.push(target);
            }
        }

        return targetWay;
    }


    function updateChildren(updates, graph) {
        for (let i = 0; i < updates.replacements.length; i++) {
            graph = graph.replace(updates.replacements[i]);
        }
        if (updates.removeIds.length) {
            graph = actionDeleteMultiple(updates.removeIds)(graph);
        }
        return graph;
    }


    function mergeMembers(remote, target) {
        if (_option === 'force_local' || deepEqual(target.members, remote.members)) {
            return target;
        }
        if (_option === 'force_remote') {
            return target.update({members: remote.members});
        }

        _conflicts.push(t.html('merge_remote_changes.conflict.memberlist', { user: { html: user(remote.user) } }));
        return target;
    }


    function mergeTags(base, remote, target) {
        if (_option === 'force_local' || deepEqual(target.tags, remote.tags)) {
            return target;
        }
        if (_option === 'force_remote') {
            return target.update({tags: remote.tags});
        }

        const ccount = _conflicts.length;
        const o = base.tags || {};
        const a = target.tags || {};
        const b = remote.tags || {};
        const keys = utilArrayUnion(utilArrayUnion(Object.keys(o), Object.keys(a)), Object.keys(b))
            .filter(function(k) { return !discardTags[k]; });
        const tags = Object.assign({}, a);   // shallow copy
        let changed = false;

        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];

            if (o[k] !== b[k] && a[k] !== b[k]) {    // changed remotely..
                if (o[k] !== a[k]) {      // changed locally..
                    _conflicts.push(t.html('merge_remote_changes.conflict.tags',
                        { tag: k, local: a[k], remote: b[k], user: { html: user(remote.user) } }));
                } else {                  // unchanged locally, accept remote change..
                    if (b.hasOwnProperty(k)) {
                        tags[k] = b[k];
                    } else {
                        delete tags[k];
                    }
                    changed = true;
                }
            }
        }

        return (changed && _conflicts.length === ccount) ? target.update({tags: tags}) : target;
    }


    //  `graph.base()` is the common ancestor of the two graphs.
    //  `localGraph` contains user's edits up to saving
    //  `remoteGraph` contains remote edits to modified nodes
    //  `graph` must be a descendent of `localGraph` and may include
    //      some conflict resolution actions performed on it.
    //
    //                  --- ... --- `localGraph` -- ... -- `graph`
    //                 /
    //  `graph.base()` --- ... --- `remoteGraph`
    //
    const action = function(graph) {
        const updates = { replacements: [], removeIds: [] };
        const base = graph.base().entities[id];
        const local = localGraph.entity(id);
        const remote = remoteGraph.entity(id);
        let target = osmEntity(local, { version: remote.version });

        // delete/undelete
        if (!remote.visible) {
            if (_option === 'force_remote') {
                return actionDeleteMultiple([id])(graph);

            } else if (_option === 'force_local') {
                if (target.type === 'way') {
                    target = mergeChildren(target, utilArrayUniq(local.nodes), updates, graph);
                    graph = updateChildren(updates, graph);
                }
                return graph.replace(target);

            } else {
                _conflicts.push(t.html('merge_remote_changes.conflict.deleted', { user: { html: user(remote.user) } }));
                return graph;  // do nothing
            }
        }

        // merge
        if (target.type === 'node') {
            target = mergeLocation(remote, target);

        } else if (target.type === 'way') {
            // pull in any child nodes that may not be present locally..
            graph.rebase(remoteGraph.childNodes(remote), [graph], false);
            target = mergeNodes(base, remote, target);
            target = mergeChildren(target, utilArrayUnion(local.nodes, remote.nodes), updates, graph);

        } else if (target.type === 'relation') {
            target = mergeMembers(remote, target);
        }

        target = mergeTags(base, remote, target);

        if (!_conflicts.length) {
            graph = updateChildren(updates, graph).replace(target);
        }

        return graph;
    };


    action.withOption = function(opt) {
        _option = opt;
        return action;
    };


    action.conflicts = function() {
        return _conflicts;
    };


    return action;
}
