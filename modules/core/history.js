import _cloneDeep from 'lodash-es/cloneDeep';
import _cloneDeepWith from 'lodash-es/cloneDeepWith';
import _difference from 'lodash-es/difference';
import _filter from 'lodash-es/filter';
import _flatten from 'lodash-es/flatten';
import _groupBy from 'lodash-es/groupBy';
import _isFunction from 'lodash-es/isFunction';
import _isEmpty from 'lodash-es/isEmpty';
import _forEach from 'lodash-es/forEach';
import _map from 'lodash-es/map';
import _omit from 'lodash-es/omit';
import _reject from 'lodash-es/reject';
import _values from 'lodash-es/values';
import _without from 'lodash-es/without';
import _uniq from 'lodash-es/uniq';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { easeLinear as d3_easeLinear } from 'd3-ease';
import { select as d3_select } from 'd3-selection';

import * as Validations from '../validations/index';
import { coreDifference } from './difference';
import { coreGraph } from './graph';
import { coreTree } from './tree';
import { osmEntity } from '../osm/entity';
import { uiLoading } from '../ui';

import {
    utilRebind,
    utilSessionMutex
} from '../util';


export function coreHistory(context) {
    var imageryUsed = ['Bing'];
    var dispatch = d3_dispatch('change', 'undone', 'redone');
    var lock = utilSessionMutex('lock');
    var duration = 150;
    var _checkpoints = {};
    var _stack;
    var _index;
    var _tree;


    // internal _act, accepts list of actions and eased time
    function _act(actions, t) {
        actions = Array.prototype.slice.call(actions);

        var annotation;
        if (!_isFunction(actions[actions.length - 1])) {
            annotation = actions.pop();
        }

        _stack[_index].transform = context.projection.transform();
        _stack[_index].selectedIDs = context.selectedIDs();

        var graph = _stack[_index].graph;
        for (var i = 0; i < actions.length; i++) {
            graph = actions[i](graph, t);
        }

        return {
            graph: graph,
            annotation: annotation,
            imageryUsed: imageryUsed
        };
    }


    // internal _perform with eased time
    function _perform(args, t) {
        var previous = _stack[_index].graph;
        _stack = _stack.slice(0, _index + 1);
        _stack.push(_act(args, t));
        _index++;
        return change(previous);
    }


    // internal _replace with eased time
    function _replace(args, t) {
        var previous = _stack[_index].graph;
        // assert(_index == _stack.length - 1)
        _stack[_index] = _act(args, t);
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
        _stack.push(_act(args, t));
        _index++;
        return change(previous);
    }


    // determine diffrence and dispatch a change event
    function change(previous) {
        var difference = coreDifference(previous, history.graph());
        dispatch.call('change', this, difference);
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


        base: function() {
            return _stack[0].graph;
        },


        merge: function(entities, extent) {
            _stack[0].graph.rebase(entities, _map(_stack, 'graph'), false);
            _tree.rebase(entities, false);

            dispatch.call('change', this, undefined, extent);
        },


        perform: function() {
            // complete any transition already in progress
            d3_select(document).interrupt('history.perform');

            var transitionable = false;
            var action0 = arguments[0];

            if (arguments.length === 1 ||
                arguments.length === 2 && !_isFunction(arguments[1])) {
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

            var previous = _stack[_index].graph;
            while (_index > 0) {
                _index--;
                if (_stack[_index].annotation) break;
            }

            dispatch.call('undone', this, _stack[_index]);
            return change(previous);
        },


        // Forward to the next annotated state.
        redo: function() {
            d3_select(document).interrupt('history.perform');

            var previous = _stack[_index].graph;
            var tryIndex = _index;
            while (tryIndex < _stack.length - 1) {
                tryIndex++;
                if (_stack[tryIndex].annotation) {
                    _index = tryIndex;
                    dispatch.call('redone', this, _stack[_index]);
                    break;
                }
            }

            return change(previous);
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


        validate: function(changes) {
            return _flatten(
                _map(Validations, function(fn) { return fn()(changes, _stack[_index].graph); })
            );
        },


        hasChanges: function() {
            return this.difference().length() > 0;
        },


        imageryUsed: function(sources) {
            if (sources) {
                imageryUsed = sources;
                return history;
            } else {
                var arr = _map(_stack.slice(1, _index + 1), 'imageryUsed');
                return _without(_uniq(_flatten(arr)), 'Custom');
            }
        },


        // save the current history state
        checkpoint: function(key) {
            _checkpoints[key] = {
                stack: _cloneDeep(_stack),
                index: _index
            };
            return history;
        },


        // restore history state to a given checkpoint or reset completely
        reset: function(key) {
            if (key !== undefined && _checkpoints.hasOwnProperty(key)) {
                _stack = _cloneDeep(_checkpoints[key].stack);
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


        toIntroGraph: function() {
            var nextId = { n: 0, r: 0, w: 0 };
            var permIds = {};
            var graph = this.graph();
            var baseEntities = {};

            // clone base entities..
            _forEach(graph.base().entities, function(entity) {
                var copy = _cloneDeepWith(entity, customizer);
                baseEntities[copy.id] = copy;
            });

            // replace base entities with head entities..
            _forEach(graph.entities, function(entity, id) {
                if (entity) {
                    var copy = _cloneDeepWith(entity, customizer);
                    baseEntities[copy.id] = copy;
                } else {
                    delete baseEntities[id];
                }
            });

            // swap temporary for permanent ids..
            _forEach(baseEntities, function(entity) {
                if (Array.isArray(entity.nodes)) {
                    entity.nodes = entity.nodes.map(function(node) {
                        return permIds[node] || node;
                    });
                }
                if (Array.isArray(entity.members)) {
                    entity.members = entity.members.map(function(member) {
                        member.id = permIds[member.id] || member.id;
                        return member;
                    });
                }
            });

            return JSON.stringify({ dataIntroGraph: baseEntities });


            function customizer(src) {
                var copy = _omit(_cloneDeep(src), ['type', 'user', 'v', 'version', 'visible']);
                if (_isEmpty(copy.tags)) {
                    delete copy.tags;
                }

                if (Array.isArray(copy.loc)) {
                    copy.loc[0] = +copy.loc[0].toFixed(6);
                    copy.loc[1] = +copy.loc[1].toFixed(6);
                }

                var match = src.id.match(/([nrw])-\d*/);  // temporary id
                if (match !== null) {
                    var nrw = match[1], permId;
                    do { permId = nrw + (++nextId[nrw]); }
                    while (baseEntities.hasOwnProperty(permId));

                    copy.id = permIds[src.id] = permId;
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
                var modified = [], deleted = [];

                _forEach(i.graph.entities, function(entity, id) {
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
                    // get originals of parent entities too
                    _forEach(base.graph._parentWays[id], function(parentId) {
                        if (parentId in base.graph.entities) {
                            baseEntities[parentId] = base.graph.entities[parentId];
                        }
                    });
                });

                var x = {};

                if (modified.length) x.modified = modified;
                if (deleted.length) x.deleted = deleted;
                if (i.imageryUsed) x.imageryUsed = i.imageryUsed;
                if (i.annotation) x.annotation = i.annotation;

                return x;
            });

            return JSON.stringify({
                version: 3,
                entities: _values(allEntities),
                baseEntities: _values(baseEntities),
                stack: s,
                nextIDs: osmEntity.id.next,
                index: _index
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
                    _stack[0].graph.rebase(baseEntities, _map(_stack, 'graph'), true);
                    _tree.rebase(baseEntities, true);

                    // When we restore a modified way, we also need to fetch any missing
                    // childnodes that would normally have been downloaded with it.. #2142
                    if (loadChildNodes) {
                        var osm = context.connection();
                        var nodes = _flatten(_uniq(_map(_filter(baseEntities, { type: 'way' }), 'nodes')));
                        var missing = _reject(nodes, function(n) { return _stack[0].graph.hasEntity(n); });

                        if (!_isEmpty(missing) && osm) {
                            loadComplete = false;
                            context.redrawEnable(false);

                            var loading = uiLoading(context).blocking(true);
                            context.container().call(loading);

                            var childNodesLoaded = function(err, result) {
                                if (!err) {
                                    var visible = _groupBy(result.data, 'visible');
                                    if (!_isEmpty(visible.true)) {
                                        missing = _difference(missing, _map(visible.true, 'id'));
                                        _stack[0].graph.rebase(visible.true, _map(_stack, 'graph'), true);
                                        _tree.rebase(visible.true, true);
                                    }

                                    // fetch older versions of nodes that were deleted..
                                    _forEach(visible.false, function(entity) {
                                        osm.loadEntityVersion(entity.id, +entity.version - 1, childNodesLoaded);
                                    });
                                }

                                if (err || _isEmpty(missing)) {
                                    loading.close();
                                    context.redrawEnable(true);
                                    dispatch.call('change');
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
                        imageryUsed: d.imageryUsed
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

            if (loadComplete) {
                dispatch.call('change');
            }

            return history;
        },


        save: function() {
            if (lock.locked()) context.storage(getKey('saved_history'), history.toJSON() || null);
            return history;
        },


        clearSaved: function() {
            context.debouncedSave.cancel();
            if (lock.locked()) context.storage(getKey('saved_history'), null);
            return history;
        },


        lock: function() {
            return lock.lock();
        },


        unlock: function() {
            lock.unlock();
        },


        // is iD not open in another window and it detects that
        // there's a history stored in localStorage that's recoverable?
        restorableChanges: function() {
            return lock.locked() && !!context.storage(getKey('saved_history'));
        },


        // load history from a version stored in localStorage
        restore: function() {
            if (!lock.locked()) return;

            var json = context.storage(getKey('saved_history'));
            if (json) history.fromJSON(json, true);
        },


        _getKey: getKey

    };


    history.reset();

    return utilRebind(history, dispatch, 'on');
}
