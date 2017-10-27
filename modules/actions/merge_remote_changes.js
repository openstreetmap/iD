import _clone from 'lodash-es/clone';
import _includes from 'lodash-es/includes';
import _isEqual from 'lodash-es/isEqual';
import _isFunction from 'lodash-es/isFunction';
import _keys from 'lodash-es/keys';
import _map from 'lodash-es/map';
import _reject from 'lodash-es/reject';
import _union from 'lodash-es/union';
import _uniq from 'lodash-es/uniq';
import _without from 'lodash-es/without';

import { diff3Merge } from 'node-diff3';
import { t } from '../util/locale';
import { actionDeleteMultiple } from './delete_multiple';
import { osmEntity } from '../osm';
import { dataDiscarded } from '../../data';


export function actionMergeRemoteChanges(id, localGraph, remoteGraph, formatUser) {
    var option = 'safe',  // 'safe', 'force_local', 'force_remote'
        conflicts = [];


    function user(d) {
        return _isFunction(formatUser) ? formatUser(d) : d;
    }


    function mergeLocation(remote, target) {
        function pointEqual(a, b) {
            var epsilon = 1e-6;
            return (Math.abs(a[0] - b[0]) < epsilon) && (Math.abs(a[1] - b[1]) < epsilon);
        }

        if (option === 'force_local' || pointEqual(target.loc, remote.loc)) {
            return target;
        }
        if (option === 'force_remote') {
            return target.update({loc: remote.loc});
        }

        conflicts.push(t('merge_remote_changes.conflict.location', { user: user(remote.user) }));
        return target;
    }


    function mergeNodes(base, remote, target) {
        if (option === 'force_local' || _isEqual(target.nodes, remote.nodes)) {
            return target;
        }
        if (option === 'force_remote') {
            return target.update({nodes: remote.nodes});
        }

        var ccount = conflicts.length,
            o = base.nodes || [],
            a = target.nodes || [],
            b = remote.nodes || [],
            nodes = [],
            hunks = diff3Merge(a, o, b, true);

        for (var i = 0; i < hunks.length; i++) {
            var hunk = hunks[i];
            if (hunk.ok) {
                nodes.push.apply(nodes, hunk.ok);
            } else {
                // for all conflicts, we can assume c.a !== c.b
                // because `diff3Merge` called with `true` option to exclude false conflicts..
                var c = hunk.conflict;
                if (_isEqual(c.o, c.a)) {  // only changed remotely
                    nodes.push.apply(nodes, c.b);
                } else if (_isEqual(c.o, c.b)) {  // only changed locally
                    nodes.push.apply(nodes, c.a);
                } else {       // changed both locally and remotely
                    conflicts.push(t('merge_remote_changes.conflict.nodelist', { user: user(remote.user) }));
                    break;
                }
            }
        }

        return (conflicts.length === ccount) ? target.update({nodes: nodes}) : target;
    }


    function mergeChildren(targetWay, children, updates, graph) {
        function isUsed(node, targetWay) {
            var parentWays = _map(graph.parentWays(node), 'id');
            return node.hasInterestingTags() ||
                _without(parentWays, targetWay.id).length > 0 ||
                graph.parentRelations(node).length > 0;
        }

        var ccount = conflicts.length;

        for (var i = 0; i < children.length; i++) {
            var id = children[i],
                node = graph.hasEntity(id);

            // remove unused childNodes..
            if (targetWay.nodes.indexOf(id) === -1) {
                if (node && !isUsed(node, targetWay)) {
                    updates.removeIds.push(id);
                }
                continue;
            }

            // restore used childNodes..
            var local = localGraph.hasEntity(id),
                remote = remoteGraph.hasEntity(id),
                target;

            if (option === 'force_remote' && remote && remote.visible) {
                updates.replacements.push(remote);

            } else if (option === 'force_local' && local) {
                target = osmEntity(local);
                if (remote) {
                    target = target.update({ version: remote.version });
                }
                updates.replacements.push(target);

            } else if (option === 'safe' && local && remote && local.version !== remote.version) {
                target = osmEntity(local, { version: remote.version });
                if (remote.visible) {
                    target = mergeLocation(remote, target);
                } else {
                    conflicts.push(t('merge_remote_changes.conflict.deleted', { user: user(remote.user) }));
                }

                if (conflicts.length !== ccount) break;
                updates.replacements.push(target);
            }
        }

        return targetWay;
    }


    function updateChildren(updates, graph) {
        for (var i = 0; i < updates.replacements.length; i++) {
            graph = graph.replace(updates.replacements[i]);
        }
        if (updates.removeIds.length) {
            graph = actionDeleteMultiple(updates.removeIds)(graph);
        }
        return graph;
    }


    function mergeMembers(remote, target) {
        if (option === 'force_local' || _isEqual(target.members, remote.members)) {
            return target;
        }
        if (option === 'force_remote') {
            return target.update({members: remote.members});
        }

        conflicts.push(t('merge_remote_changes.conflict.memberlist', { user: user(remote.user) }));
        return target;
    }


    function mergeTags(base, remote, target) {
        function ignoreKey(k) {
            return _includes(dataDiscarded, k);
        }

        if (option === 'force_local' || _isEqual(target.tags, remote.tags)) {
            return target;
        }
        if (option === 'force_remote') {
            return target.update({tags: remote.tags});
        }

        var ccount = conflicts.length,
            o = base.tags || {},
            a = target.tags || {},
            b = remote.tags || {},
            keys = _reject(_union(_keys(o), _keys(a), _keys(b)), ignoreKey),
            tags = _clone(a),
            changed = false;

        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];

            if (o[k] !== b[k] && a[k] !== b[k]) {    // changed remotely..
                if (o[k] !== a[k]) {      // changed locally..
                    conflicts.push(t('merge_remote_changes.conflict.tags',
                        { tag: k, local: a[k], remote: b[k], user: user(remote.user) }));

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

        return (changed && conflicts.length === ccount) ? target.update({tags: tags}) : target;
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
    var action = function(graph) {
        var updates = { replacements: [], removeIds: [] },
            base = graph.base().entities[id],
            local = localGraph.entity(id),
            remote = remoteGraph.entity(id),
            target = osmEntity(local, { version: remote.version });

        // delete/undelete
        if (!remote.visible) {
            if (option === 'force_remote') {
                return actionDeleteMultiple([id])(graph);

            } else if (option === 'force_local') {
                if (target.type === 'way') {
                    target = mergeChildren(target, _uniq(local.nodes), updates, graph);
                    graph = updateChildren(updates, graph);
                }
                return graph.replace(target);

            } else {
                conflicts.push(t('merge_remote_changes.conflict.deleted', { user: user(remote.user) }));
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
            target = mergeChildren(target, _union(local.nodes, remote.nodes), updates, graph);

        } else if (target.type === 'relation') {
            target = mergeMembers(remote, target);
        }

        target = mergeTags(base, remote, target);

        if (!conflicts.length) {
            graph = updateChildren(updates, graph).replace(target);
        }

        return graph;
    };


    action.withOption = function(opt) {
        option = opt;
        return action;
    };


    action.conflicts = function() {
        return conflicts;
    };


    return action;
}
