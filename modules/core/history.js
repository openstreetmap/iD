import { dispatch as d3_dispatch } from 'd3-dispatch';
import { easeLinear as d3_easeLinear } from 'd3-ease';
import { select as d3_select } from 'd3-selection';

import { prefs } from './preferences';
import { coreDifference } from './difference';
import { coreGraph } from './graph';
import { coreTree } from './tree';
import { osmEntity } from '../osm/entity';
import { uiLoading } from '../ui/loading';
import {
    utilArrayDifference, utilArrayGroupBy, utilArrayUnion,
    utilObjectOmit, utilRebind, utilSessionMutex
} from '../util';


export function coreHistory(context) {
    var dispatch = d3_dispatch('change', 'merge', 'restore', 'undone', 'redone');
    var lock = utilSessionMutex('lock');

    // restorable if iD not open in another window/tab and a saved history exists in localStorage
    var _hasUnresolvedRestorableChanges = lock.lock() && !!prefs(getKey('saved_history'));

    var duration = 150;
    var _imageryUsed = [];
    var _photoOverlaysUsed = [];
    var _checkpoints = {};
    var _pausedGraph;
    var _stack;
    var _index;
    var _tree;


    // internal _act, accepts list of actions and eased time
    function _act(actions, t) {
        actions = Array.prototype.slice.call(actions);

        var annotation;
        if (typeof actions[actions.length - 1] !== 'function') {
            annotation = actions.pop();
        }

        var graph = _stack[_index].graph;
        for (var i = 0; i < actions.length; i++) {
            graph = actions[i](graph, t);
        }

        return {
            graph: graph,
            annotation: annotation,
            imageryUsed: _imageryUsed,
            photoOverlaysUsed: _photoOverlaysUsed,
            transform: context.projection.transform(),
            selectedIDs: context.selectedIDs()
        };
    }


    // internal _perform with eased time
    function _perform(args, t) {
        var previous = _stack[_index].graph;
        _stack = _stack.slice(0, _index + 1);
        var actionResult = _act(args, t);
        _stack.push(actionResult);
        _index++;
        return change(previous);
    }


    // internal _replace with eased time
    function _replace(args, t) {
        var previous = _stack[_index].graph;
        // assert(_index == _stack.length - 1)
        var actionResult = _act(args, t);
        _stack[_index] = actionResult;
        return change(previous);
    }


    // internal _overwrite with eased time
    function _overwrite(args, t) {
        var previous = _stack[_index].graph;
        if (_index > 0) {
            _index--;
            _stack.pop();
        }
        _stack = _stack.slice(0, _index + 1);
        var actionResult = _act(args, t);
        _stack.push(actionResult);
        _index++;
        return change(previous);
    }


    // determine difference and dispatch a change event
    function change(previous) {
        var difference = coreDifference(previous, history.graph());
        if (!_pausedGraph) {
            dispatch.call('change', this, difference);
        }
        return difference;
    }


    // iD uses namespaced keys so multiple installations do not conflict
    function getKey(n) {
        return 'iD_' + window.location.origin + '_' + n;
    }


    var history = {

        graph: function() {
            return _stack[_index].graph;
        },


        tree: function() {
            return _tree;
        },


        base: function() {
            return _stack[0].graph;
        },


        merge: function(entities/*, extent*/) {
            var stack = _stack.map(function(state) { return state.graph; });
            _stack[0].graph.rebase(entities, stack, false);
            _tree.rebase(entities, false);

            dispatch.call('merge', this, entities);
        },


        perform: function() {
            // complete any transition already in progress
            d3_select(document).interrupt('history.perform');

            var transitionable = false;
            var action0 = arguments[0];

            if (arguments.length === 1 ||
                (arguments.length === 2 && (typeof arguments[1] !== 'function'))) {
                transitionable = !!action0.transitionable;
            }

            if (transitionable) {
                var origArguments = arguments;
                d3_select(document)
                    .transition('history.perform')
                    .duration(duration)
                    .ease(d3_easeLinear)
                    .tween('history.tween', function() {
                        return function(t) {
                            if (t < 1) _overwrite([action0], t);
                        };
                    })
                    .on('start', function() {
                        _perform([action0], 0);
                    })
                    .on('end interrupt', function() {
                        _overwrite(origArguments, 1);
                    });

            } else {
                return _perform(arguments);
            }
        },


        replace: function() {
            d3_select(document).interrupt('history.perform');
            return _replace(arguments, 1);
        },


        // Same as calling pop and then perform
        overwrite: function() {
            d3_select(document).interrupt('history.perform');
            return _overwrite(arguments, 1);
        },


        pop: function(n) {
            d3_select(document).interrupt('history.perform');

            var previous = _stack[_index].graph;
            if (isNaN(+n) || +n < 0) {
                n = 1;
            }
            while (n-- > 0 && _index > 0) {
                _index--;
                _stack.pop();
            }
            return change(previous);
        },


        // Back to the previous annotated state or _index = 0.
        undo: function() {
            d3_select(document).interrupt('history.perform');

            var previousStack = _stack[_index];
            var previous = previousStack.graph;
            while (_index > 0) {
                _index--;
                if (_stack[_index].annotation) break;
            }

            dispatch.call('undone', this, _stack[_index], previousStack);
            return change(previous);
        },


        // Forward to the next annotated state.
        redo: function() {
            d3_select(document).interrupt('history.perform');

            var previousStack = _stack[_index];
            var previous = previousStack.graph;
            var tryIndex = _index;
            while (tryIndex < _stack.length - 1) {
                tryIndex++;
                if (_stack[tryIndex].annotation) {
                    _index = tryIndex;
                    dispatch.call('redone', this, _stack[_index], previousStack);
                    break;
                }
            }

            return change(previous);
        },


        pauseChangeDispatch: function() {
            if (!_pausedGraph) {
                _pausedGraph = _stack[_index].graph;
            }
        },


        resumeChangeDispatch: function() {
            if (_pausedGraph) {
                var previous = _pausedGraph;
                _pausedGraph = null;
                return change(previous);
            }
        },


        undoAnnotation: function() {
            var i = _index;
            while (i >= 0) {
                if (_stack[i].annotation) return _stack[i].annotation;
                i--;
            }
        },


        redoAnnotation: function() {
            var i = _index + 1;
            while (i <= _stack.length - 1) {
                if (_stack[i].annotation) return _stack[i].annotation;
                i++;
            }
        },


        // Returns the entities from the active graph with bounding boxes
        // overlapping the given `extent`.
        intersects: function(extent) {
            return _tree.intersects(extent, _stack[_index].graph);
        },


        difference: function() {
            var base = _stack[0].graph;
            var head = _stack[_index].graph;
            return coreDifference(base, head);
        },


        changes: function(action) {
            var base = _stack[0].graph;
            var head = _stack[_index].graph;

            if (action) {
                head = action(head);
            }

            var difference = coreDifference(base, head);

            return {
                modified: difference.modified(),
                created: difference.created(),
                deleted: difference.deleted()
            };
        },


        hasChanges: function() {
            return this.difference().length() > 0;
        },


        imageryUsed: function(sources) {
            if (sources) {
                _imageryUsed = sources;
                return history;
            } else {
                var s = new Set();
                _stack.slice(1, _index + 1).forEach(function(state) {
                    state.imageryUsed.forEach(function(source) {
                        if (source !== 'Custom') {
                            s.add(source);
                        }
                    });
                });
                return Array.from(s);
            }
        },


        photoOverlaysUsed: function(sources) {
            if (sources) {
                _photoOverlaysUsed = sources;
                return history;
            } else {
                var s = new Set();
                _stack.slice(1, _index + 1).forEach(function(state) {
                    if (state.photoOverlaysUsed && Array.isArray(state.photoOverlaysUsed)) {
                        state.photoOverlaysUsed.forEach(function(photoOverlay) {
                            s.add(photoOverlay);
                        });
                    }
                });
                return Array.from(s);
            }
        },


        // save the current history state
        checkpoint: function(key) {
            _checkpoints[key] = {
                stack: _stack,
                index: _index
            };
            return history;
        },


        // restore history state to a given checkpoint or reset completely
        reset: function(key) {
            if (key !== undefined && _checkpoints.hasOwnProperty(key)) {
                _stack = _checkpoints[key].stack;
                _index = _checkpoints[key].index;
            } else {
                _stack = [{graph: coreGraph()}];
                _index = 0;
                _tree = coreTree(_stack[0].graph);
                _checkpoints = {};
            }
            dispatch.call('change');
            return history;
        },


        // `toIntroGraph()` is used to export the intro graph used by the walkthrough.
        //
        // To use it:
        //  1. Start the walkthrough.
        //  2. Get to a "free editing" tutorial step
        //  3. Make your edits to the walkthrough map
        //  4. In your browser dev console run:
        //        `id.history().toIntroGraph()`
        //  5. This outputs stringified JSON to the browser console
        //  6. Copy it to `data/intro_graph.json` and prettify it in your code editor
        toIntroGraph: function() {
            var nextID = { n: 0, r: 0, w: 0 };
            var permIDs = {};
            var graph = this.graph();
            var baseEntities = {};

            // clone base entities..
            Object.values(graph.base().entities).forEach(function(entity) {
                var copy = copyIntroEntity(entity);
                baseEntities[copy.id] = copy;
            });

            // replace base entities with head entities..
            Object.keys(graph.entities).forEach(function(id) {
                var entity = graph.entities[id];
                if (entity) {
                    var copy = copyIntroEntity(entity);
                    baseEntities[copy.id] = copy;
                } else {
                    delete baseEntities[id];
                }
            });

            // swap temporary for permanent ids..
            Object.values(baseEntities).forEach(function(entity) {
                if (Array.isArray(entity.nodes)) {
                    entity.nodes = entity.nodes.map(function(node) {
                        return permIDs[node] || node;
                    });
                }
                if (Array.isArray(entity.members)) {
                    entity.members = entity.members.map(function(member) {
                        member.id = permIDs[member.id] || member.id;
                        return member;
                    });
                }
            });

            return JSON.stringify({ dataIntroGraph: baseEntities });


            function copyIntroEntity(source) {
                var copy = utilObjectOmit(source, ['type', 'user', 'v', 'version', 'visible']);

                // Note: the copy is no longer an osmEntity, so it might not have `tags`
                if (copy.tags && !Object.keys(copy.tags)) {
                    delete copy.tags;
                }

                if (Array.isArray(copy.loc)) {
                    copy.loc[0] = +copy.loc[0].toFixed(6);
                    copy.loc[1] = +copy.loc[1].toFixed(6);
                }

                var match = source.id.match(/([nrw])-\d*/);  // temporary id
                if (match !== null) {
                    var nrw = match[1];
                    var permID;
                    do { permID = nrw + (++nextID[nrw]); }
                    while (baseEntities.hasOwnProperty(permID));

                    copy.id = permIDs[source.id] = permID;
                }
                return copy;
            }
        },


        toJSON: function() {
            if (!this.hasChanges()) return;

            var allEntities = {};
            var baseEntities = {};
            var base = _stack[0];

            var s = _stack.map(function(i) {
                var modified = [];
                var deleted = [];

                Object.keys(i.graph.entities).forEach(function(id) {
                    var entity = i.graph.entities[id];
                    if (entity) {
                        var key = osmEntity.key(entity);
                        allEntities[key] = entity;
                        modified.push(key);
                    } else {
                        deleted.push(id);
                    }

                    // make sure that the originals of changed or deleted entities get merged
                    // into the base of the _stack after restoring the data from JSON.
                    if (id in base.graph.entities) {
                        baseEntities[id] = base.graph.entities[id];
                    }
                    if (entity && entity.nodes) {
                        // get originals of pre-existing child nodes
                        entity.nodes.forEach(function(nodeID) {
                            if (nodeID in base.graph.entities) {
                                baseEntities[nodeID] = base.graph.entities[nodeID];
                            }
                        });
                    }
                    // get originals of parent entities too
                    var baseParents = base.graph._parentWays[id];
                    if (baseParents) {
                        baseParents.forEach(function(parentID) {
                            if (parentID in base.graph.entities) {
                                baseEntities[parentID] = base.graph.entities[parentID];
                            }
                        });
                    }
                });

                var x = {};

                if (modified.length) x.modified = modified;
                if (deleted.length) x.deleted = deleted;
                if (i.imageryUsed) x.imageryUsed = i.imageryUsed;
                if (i.photoOverlaysUsed) x.photoOverlaysUsed = i.photoOverlaysUsed;
                if (i.annotation) x.annotation = i.annotation;
                if (i.transform) x.transform = i.transform;
                if (i.selectedIDs) x.selectedIDs = i.selectedIDs;

                return x;
            });

            return JSON.stringify({
                version: 3,
                entities: Object.values(allEntities),
                baseEntities: Object.values(baseEntities),
                stack: s,
                nextIDs: osmEntity.id.next,
                index: _index,
                // note the time the changes were saved
                timestamp: (new Date()).getTime()
            });
        },


        fromJSON: function(json, loadChildNodes) {
            var h = JSON.parse(json);
            var loadComplete = true;

            osmEntity.id.next = h.nextIDs;
            _index = h.index;

            if (h.version === 2 || h.version === 3) {
                var allEntities = {};

                h.entities.forEach(function(entity) {
                    allEntities[osmEntity.key(entity)] = osmEntity(entity);
                });

                if (h.version === 3) {
                    // This merges originals for changed entities into the base of
                    // the _stack even if the current _stack doesn't have them (for
                    // example when iD has been restarted in a different region)
                    var baseEntities = h.baseEntities.map(function(d) { return osmEntity(d); });
                    var stack = _stack.map(function(state) { return state.graph; });
                    _stack[0].graph.rebase(baseEntities, stack, true);
                    _tree.rebase(baseEntities, true);

                    // When we restore a modified way, we also need to fetch any missing
                    // childnodes that would normally have been downloaded with it.. #2142
                    if (loadChildNodes) {
                        var osm = context.connection();
                        var baseWays = baseEntities
                            .filter(function(e) { return e.type === 'way'; });
                        var nodeIDs = baseWays
                            .reduce(function(acc, way) { return utilArrayUnion(acc, way.nodes); }, []);
                        var missing = nodeIDs
                            .filter(function(n) { return !_stack[0].graph.hasEntity(n); });

                        if (missing.length && osm) {
                            loadComplete = false;
                            context.map().redrawEnable(false);

                            var loading = uiLoading(context).blocking(true);
                            context.container().call(loading);

                            var childNodesLoaded = function(err, result) {
                                if (!err) {
                                    var visibleGroups = utilArrayGroupBy(result.data, 'visible');
                                    var visibles = visibleGroups.true || [];      // alive nodes
                                    var invisibles = visibleGroups.false || [];   // deleted nodes

                                    if (visibles.length) {
                                        var visibleIDs = visibles.map(function(entity) { return entity.id; });
                                        var stack = _stack.map(function(state) { return state.graph; });
                                        missing = utilArrayDifference(missing, visibleIDs);
                                        _stack[0].graph.rebase(visibles, stack, true);
                                        _tree.rebase(visibles, true);
                                    }

                                    // fetch older versions of nodes that were deleted..
                                    invisibles.forEach(function(entity) {
                                        osm.loadEntityVersion(entity.id, +entity.version - 1, childNodesLoaded);
                                    });
                                }

                                if (err || !missing.length) {
                                    loading.close();
                                    context.map().redrawEnable(true);
                                    dispatch.call('change');
                                    dispatch.call('restore', this);
                                }
                            };

                            osm.loadMultiple(missing, childNodesLoaded);
                        }
                    }
                }

                _stack = h.stack.map(function(d) {
                    var entities = {}, entity;

                    if (d.modified) {
                        d.modified.forEach(function(key) {
                            entity = allEntities[key];
                            entities[entity.id] = entity;
                        });
                    }

                    if (d.deleted) {
                        d.deleted.forEach(function(id) {
                            entities[id] = undefined;
                        });
                    }

                    return {
                        graph: coreGraph(_stack[0].graph).load(entities),
                        annotation: d.annotation,
                        imageryUsed: d.imageryUsed,
                        photoOverlaysUsed: d.photoOverlaysUsed,
                        transform: d.transform,
                        selectedIDs: d.selectedIDs
                    };
                });

            } else { // original version
                _stack = h.stack.map(function(d) {
                    var entities = {};

                    for (var i in d.entities) {
                        var entity = d.entities[i];
                        entities[i] = entity === 'undefined' ? undefined : osmEntity(entity);
                    }

                    d.graph = coreGraph(_stack[0].graph).load(entities);
                    return d;
                });
            }

            var transform = _stack[_index].transform;
            if (transform) {
                context.map().transformEase(transform, 0);   // 0 = immediate, no easing
            }

            if (loadComplete) {
                dispatch.call('change');
                dispatch.call('restore', this);
            }

            return history;
        },


        lock: function() {
            return lock.lock();
        },


        unlock: function() {
            lock.unlock();
        },


        save: function() {
            if (lock.locked() &&
                // don't overwrite existing, unresolved changes
                !_hasUnresolvedRestorableChanges) {

                prefs(getKey('saved_history'), history.toJSON() || null);
            }
            return history;
        },


        // delete the history version saved in localStorage
        clearSaved: function() {
            context.debouncedSave.cancel();
            if (lock.locked()) {
                _hasUnresolvedRestorableChanges = false;
                prefs(getKey('saved_history'), null);

                // clear the changeset metadata associated with the saved history
                prefs('comment', null);
                prefs('hashtags', null);
                prefs('source', null);
            }
            return history;
        },


        savedHistoryJSON: function() {
            return prefs(getKey('saved_history'));
        },


        hasRestorableChanges: function() {
            return _hasUnresolvedRestorableChanges;
        },


        // load history from a version stored in localStorage
        restore: function() {
            if (lock.locked()) {
                _hasUnresolvedRestorableChanges = false;
                var json = this.savedHistoryJSON();
                if (json) history.fromJSON(json, true);
            }
        },


        _getKey: getKey

    };


    history.reset();

    return utilRebind(history, dispatch, 'on');
}
