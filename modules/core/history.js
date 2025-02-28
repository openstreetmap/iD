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
    const dispatch = d3_dispatch('reset', 'change', 'merge', 'restore', 'undone', 'redone', 'storage_error');
    const lock = utilSessionMutex('lock');

    // restorable if iD not open in another window/tab and a saved history exists in localStorage
    let _hasUnresolvedRestorableChanges = lock.lock() && !!prefs(getKey('saved_history'));

    const duration = 150;
    let _imageryUsed = [];
    let _photoOverlaysUsed = [];
    let _checkpoints = {};
    let _pausedGraph;
    let _stack;
    let _index;
    let _tree;


    // internal _act, accepts list of actions and eased time
    function _act(actions, t) {
        actions = Array.prototype.slice.call(actions);

        let annotation;
        if (typeof actions[actions.length - 1] !== 'function') {
            annotation = actions.pop();
        }

        let graph = _stack[_index].graph;
        for (let i = 0; i < actions.length; i++) {
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
        const previous = _stack[_index].graph;
        _stack = _stack.slice(0, _index + 1);
        const actionResult = _act(args, t);
        _stack.push(actionResult);
        _index++;
        return change(previous);
    }


    // internal _replace with eased time
    function _replace(args, t) {
        const previous = _stack[_index].graph;
        // assert(_index == _stack.length - 1)
        const actionResult = _act(args, t);
        _stack[_index] = actionResult;
        return change(previous);
    }


    // internal _overwrite with eased time
    function _overwrite(args, t) {
        const previous = _stack[_index].graph;
        if (_index > 0) {
            _index--;
            _stack.pop();
        }
        _stack = _stack.slice(0, _index + 1);
        const actionResult = _act(args, t);
        _stack.push(actionResult);
        _index++;
        return change(previous);
    }


    // determine difference and dispatch a change event
    function change(previous) {
        const difference = coreDifference(previous, history.graph());
        if (!_pausedGraph) {
            dispatch.call('change', this, difference);
        }
        return difference;
    }


    // iD uses namespaced keys so multiple installations do not conflict
    function getKey(n) {
        return 'iD_' + window.location.origin + '_' + n;
    }


    const history = {

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
            const stack = _stack.map(function(state) { return state.graph; });
            _stack[0].graph.rebase(entities, stack, false);
            _tree.rebase(entities, false);

            dispatch.call('merge', this, entities);
        },


        perform: function() {
            // complete any transition already in progress
            d3_select(document).interrupt('history.perform');

            let transitionable = false;
            const action0 = arguments[0];

            if (arguments.length === 1 ||
                (arguments.length === 2 && (typeof arguments[1] !== 'function'))) {
                transitionable = !!action0.transitionable;
            }

            if (transitionable) {
                const origArguments = arguments;
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

            const previous = _stack[_index].graph;
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

            const previousStack = _stack[_index];
            const previous = previousStack.graph;
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

            const previousStack = _stack[_index];
            const previous = previousStack.graph;
            let tryIndex = _index;
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
                const previous = _pausedGraph;
                _pausedGraph = null;
                return change(previous);
            }
        },


        undoAnnotation: function() {
            let i = _index;
            while (i >= 0) {
                if (_stack[i].annotation) return _stack[i].annotation;
                i--;
            }
        },


        redoAnnotation: function() {
            let i = _index + 1;
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
            const base = _stack[0].graph;
            const head = _stack[_index].graph;
            return coreDifference(base, head);
        },


        changes: function(action) {
            const base = _stack[0].graph;
            let head = _stack[_index].graph;

            if (action) {
                head = action(head);
            }

            const difference = coreDifference(base, head);

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
                const s = new Set();
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
                const s = new Set();
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
            dispatch.call('reset');
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
            const nextID = { n: 0, r: 0, w: 0 };
            const permIDs = {};
            const graph = this.graph();
            const baseEntities = {};

            // clone base entities..
            Object.values(graph.base().entities).forEach(function(entity) {
                const copy = copyIntroEntity(entity);
                baseEntities[copy.id] = copy;
            });

            // replace base entities with head entities..
            Object.keys(graph.entities).forEach(function(id) {
                const entity = graph.entities[id];
                if (entity) {
                    const copy = copyIntroEntity(entity);
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
                const copy = utilObjectOmit(source, ['type', 'user', 'v', 'version', 'visible']);

                // Note: the copy is no longer an osmEntity, so it might not have `tags`
                if (copy.tags && !Object.keys(copy.tags)) {
                    delete copy.tags;
                }

                if (Array.isArray(copy.loc)) {
                    copy.loc[0] = +copy.loc[0].toFixed(6);
                    copy.loc[1] = +copy.loc[1].toFixed(6);
                }

                const match = source.id.match(/([nrw])-\d*/);  // temporary id
                if (match !== null) {
                    const nrw = match[1];
                    let permID;
                    do { permID = nrw + (++nextID[nrw]); }
                    while (baseEntities.hasOwnProperty(permID));

                    copy.id = permIDs[source.id] = permID;
                }
                return copy;
            }
        },


        toJSON: function() {
            if (!this.hasChanges()) return;

            const allEntities = {};
            const baseEntities = {};
            const base = _stack[0];

            const s = _stack.map(function(i) {
                const modified = [];
                const deleted = [];

                Object.keys(i.graph.entities).forEach(function(id) {
                    const entity = i.graph.entities[id];
                    if (entity) {
                        const key = osmEntity.key(entity);
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
                    const baseParents = base.graph._parentWays[id];
                    if (baseParents) {
                        baseParents.forEach(function(parentID) {
                            if (parentID in base.graph.entities) {
                                baseEntities[parentID] = base.graph.entities[parentID];
                            }
                        });
                    }
                });

                const x = {};

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
            const h = JSON.parse(json);
            let loadComplete = true;

            osmEntity.id.next = h.nextIDs;
            _index = h.index;

            if (h.version === 2 || h.version === 3) {
                const allEntities = {};

                h.entities.forEach(function(entity) {
                    allEntities[osmEntity.key(entity)] = osmEntity(entity);
                });

                if (h.version === 3) {
                    // This merges originals for changed entities into the base of
                    // the _stack even if the current _stack doesn't have them (for
                    // example when iD has been restarted in a different region)
                    const baseEntities = h.baseEntities.map(function(d) { return osmEntity(d); });
                    const stack = _stack.map(function(state) { return state.graph; });
                    _stack[0].graph.rebase(baseEntities, stack, true);
                    _tree.rebase(baseEntities, true);

                    // When we restore a modified way, we also need to fetch any missing
                    // childnodes that would normally have been downloaded with it.. #2142
                    if (loadChildNodes) {
                        const osm = context.connection();
                        const baseWays = baseEntities
                            .filter(function(e) { return e.type === 'way'; });
                        const nodeIDs = baseWays
                            .reduce(function(acc, way) { return utilArrayUnion(acc, way.nodes); }, []);
                        let missing = nodeIDs
                            .filter(function(n) { return !_stack[0].graph.hasEntity(n); });

                        if (missing.length && osm) {
                            loadComplete = false;
                            context.map().redrawEnable(false);

                            const loading = uiLoading(context).blocking(true);
                            context.container().call(loading);

                            const childNodesLoaded = function(err, result) {
                                if (!err) {
                                    const visibleGroups = utilArrayGroupBy(result.data, 'visible');
                                    const visibles = visibleGroups.true || [];      // alive nodes
                                    const invisibles = visibleGroups.false || [];   // deleted nodes

                                    if (visibles.length) {
                                        const visibleIDs = visibles.map(function(entity) { return entity.id; });
                                        const stack = _stack.map(function(state) { return state.graph; });
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
                    const entities = {};
                    let entity;

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
                    const entities = {};

                    for (const i in d.entities) {
                        const entity = d.entities[i];
                        entities[i] = entity === 'undefined' ? undefined : osmEntity(entity);
                    }

                    d.graph = coreGraph(_stack[0].graph).load(entities);
                    return d;
                });
            }

            const transform = _stack[_index].transform;
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
                const success = prefs(getKey('saved_history'), history.toJSON() || null);

                if (!success) dispatch.call('storage_error');
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
                const json = this.savedHistoryJSON();
                if (json) history.fromJSON(json, true);
            }
        },


        _getKey: getKey

    };


    history.reset();

    return utilRebind(history, dispatch, 'on');
}
