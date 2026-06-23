import { easeLinear as d3_easeLinear } from 'd3-ease';
import { select as d3_select } from 'd3-selection';

import { asyncPrefs, prefs } from './preferences';
import { coreDifference } from './difference';
import { coreGraph } from './graph';
import { coreTree } from './tree';
import type { EntityId, OsmEntity, WayId } from '../osm';
import { createEntity, osmIdManager  } from '../osm';
import { uiLoading } from '../ui/loading';
import {
    utilArrayDifference, utilArrayGroupBy, utilArrayUnion,
    utilObjectOmit, utilSessionMutex
} from '../util';
import type { geoExtent } from '../geo';
import { EventDispatcher } from '../util/class';
import type { Vec2 } from '../geo/vector';

export interface Action<T = never> {
    (graph: coreGraph, t?: number | null, extraData?: T): coreGraph
    id?: string;
    getWayId?(): WayId;
    disabled?(graph: coreGraph): string | false | undefined;
    transitionable?: boolean;

    copies?(): Record<string, OsmEntity>;
    useLongAxis?: GetSet<this, boolean>;
    getReflectAxis?(graph: coreGraph): Vec2[];
}

type Stack = {
    graph: coreGraph;
    annotation?: string;
    imageryUsed?: string[];
    photoOverlaysUsed?: string[];
    transform?: unknown;
    selectedIDs?: unknown;
};

type SerialisedStack = Omit<Stack, 'graph'> & {
    modified?: EntityId[];
    deleted?: EntityId[];
};
type SerialisedHistory = {
    version: 2 | 3;
    entities: OsmEntity[];
    baseEntities: OsmEntity[];
    stack: SerialisedStack[];
    nextIDs: typeof osmIdManager.next,
    index: number;
    timestamp: number;
};

type EventMap = {
    reset: [];
    change: [coreDifference?]
    merge: [OsmEntity[]];
    restore: [stack?: Stack[], previousStack?: Stack];
    undone: [Stack, Stack];
    redone: [Stack, Stack];
    storage_error: unknown[];
}

/** the last 'action' can optionally be a string annotation */
export type ActionList = Action[] | [...actions: Action[], annotation: string]

export class coreHistory extends EventDispatcher<EventMap> {
    private context: iD.Context;

    private _lock = utilSessionMutex('lock');

    // restorable if iD not open in another window/tab and a saved history exists in localStorage
    private _hasUnresolvedRestorableChanges = this._lock.lock() && !!prefs('has_saved_history');

    private duration = 150;
    private _imageryUsed: string[] = [];
    private _photoOverlaysUsed: string[] = [];
    private _checkpoints: { [key: string]: { stack: Stack[]; index: number; } } = {};
    private _pausedGraph: coreGraph | undefined | null;

    private _stack!: Stack[];
    private _index!: number;
    private _tree!: coreTree;

    constructor(context: iD.Context) {
        super('reset', 'change', 'merge', 'restore', 'undone', 'redone', 'storage_error');
        this.context = context;
        this.reset();
    }

    // internal _act, accepts list of actions and eased time
    private _act(actions: ActionList, t?: number): Stack {
        actions = Array.prototype.slice.call(actions);

        var annotation;
        if (typeof actions[actions.length - 1] !== 'function') {
            annotation = actions.pop() as unknown as string;
        }

        var graph = this._stack[this._index].graph;
        for (var i = 0; i < actions.length; i++) {
            graph = actions[i](graph, t);
        }

        return {
            graph: graph,
            annotation: annotation,
            imageryUsed: this._imageryUsed,
            photoOverlaysUsed: this._photoOverlaysUsed,
            transform: this.context.projection.transform(),
            selectedIDs: this.context.selectedIDs()
        };
    }


    // internal _perform with eased time
    private _perform(args: ActionList, t?: number): coreDifference {
        var previous = this._stack[this._index].graph;
        this._stack = this._stack.slice(0, this._index + 1);
        var actionResult = this._act(args, t);
        this._stack.push(actionResult);
        this._index++;
        return this.change(previous);
    }


    // internal _replace with eased time
    private _replace(args: ActionList, t: number): coreDifference {
        var previous = this._stack[this._index].graph;
        // assert(_index == _stack.length - 1)
        var actionResult = this._act(args, t);
        this._stack[this._index] = actionResult;
        return this.change(previous);
    }


    // internal _overwrite with eased time
    private _overwrite(args: ActionList, t: number): coreDifference {
        var previous = this._stack[this._index].graph;
        if (this._index > 0) {
            this._index--;
            this._stack.pop();
        }
        this._stack = this._stack.slice(0, this._index + 1);
        var actionResult = this._act(args, t);
        this._stack.push(actionResult);
        this._index++;
        return this.change(previous);
    }


    // determine difference and dispatch a change event
    private change(previous: coreGraph): coreDifference {
        var difference = coreDifference(previous, this.graph());
        if (!this._pausedGraph) {
            this.dispatch.call('change', this, difference);
        }
        return difference;
    }


        graph() {
            if (!(this instanceof coreHistory)) throw new Error('not core'); // TODO: why tf do we have this?
            return this._stack[this._index].graph;
        }


        tree() {
            return this._tree;
        }


        base() {
            return this._stack[0].graph;
        }


        merge(entities: OsmEntity[]) {
            var stack = this._stack.map(function(state) { return state.graph; });
            this._stack[0].graph.rebase(entities, stack, false);
            this._tree.rebase(entities, false);

            this.dispatch.call('merge', this, entities);
        }


        perform(...args: ActionList): coreDifference | Promise<coreDifference> | undefined;
        perform(arg: Action, t: number): void;
        perform() {
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
                return new Promise<coreDifference>(resolve => {
                    d3_select(document)
                        .transition('history.perform')
                        .duration(this.duration)
                        .ease(d3_easeLinear)
                        .tween('history.tween', () => {
                            return (t) => {
                                if (t < 1) this._overwrite([action0], t);
                            };
                        })
                        .on('start', () => {
                            resolve(this._perform([action0], 0));
                        })
                        .on('end interrupt', () => {
                            resolve(this._overwrite(origArguments as unknown as Action[], 1));
                        });
                });

            } else {
                return this._perform(arguments as unknown as Action[]);
            }
        }


        replace(...args: ActionList) {
            d3_select(document).interrupt('history.perform');
            return this._replace(args, 1);
        }


        // Same as calling pop and then perform
        overwrite(...args: ActionList) {
            d3_select(document).interrupt('history.perform');
            return this._overwrite(args, 1);
        }


        pop(n: number) {
            d3_select(document).interrupt('history.perform');

            var previous = this._stack[this._index].graph;
            if (isNaN(+n) || +n < 0) {
                n = 1;
            }
            while (n-- > 0 && this._index > 0) {
                this._index--;
                this._stack.pop();
            }
            return this.change(previous);
        }


        // Back to the previous annotated state or _index = 0.
        undo() {
            d3_select(document).interrupt('history.perform');

            var previousStack = this._stack[this._index];
            var previous = previousStack.graph;
            while (this._index > 0) {
                this._index--;
                if (this._stack[this._index].annotation) break;
            }

            this.dispatch.call('undone', this, this._stack[this._index], previousStack);
            return this.change(previous);
        }


        // Forward to the next annotated state.
        redo() {
            d3_select(document).interrupt('history.perform');

            var previousStack = this._stack[this._index];
            var previous = previousStack.graph;
            var tryIndex = this._index;
            while (tryIndex < this._stack.length - 1) {
                tryIndex++;
                if (this._stack[tryIndex].annotation) {
                    this._index = tryIndex;
                    this.dispatch.call('redone', this, this._stack[this._index], previousStack);
                    break;
                }
            }

            return this.change(previous);
        }


        pauseChangeDispatch() {
            if (!this._pausedGraph) {
                this._pausedGraph = this._stack[this._index].graph;
            }
        }


        resumeChangeDispatch() {
            if (this._pausedGraph) {
                var previous = this._pausedGraph;
                this._pausedGraph = null;
                return this.change(previous);
            }
        }


        undoAnnotation() {
            var i = this._index;
            while (i >= 0) {
                if (this._stack[i].annotation) return this._stack[i].annotation;
                i--;
            }
        }


        redoAnnotation() {
            var i = this._index + 1;
            while (i <= this._stack.length - 1) {
                if (this._stack[i].annotation) return this._stack[i].annotation;
                i++;
            }
        }


        // Returns the entities from the active graph with bounding boxes
        // overlapping the given `extent`.
        intersects(extent: geoExtent) {
            return this._tree.intersects(extent, this._stack[this._index].graph);
        }


        difference() {
            var base = this._stack[0].graph;
            var head = this._stack[this._index].graph;
            return coreDifference(base, head);
        }


        changes(action: Action) {
            var base = this._stack[0].graph;
            var head = this._stack[this._index].graph;

            if (action) {
                head = action(head);
            }

            var difference = coreDifference(base, head);

            return {
                modified: difference.modified(),
                created: difference.created(),
                deleted: difference.deleted()
            };
        }


        hasChanges() {
            return this.difference().length() > 0;
        }


        imageryUsed(sources: string[]) {
            if (sources) {
                this._imageryUsed = sources;
                return this;
            } else {
                var s = new Set();
                this._stack.slice(1, this._index + 1).forEach(function(state) {
                    state.imageryUsed!.forEach(function(source) {
                        if (source !== 'Custom') {
                            s.add(source);
                        }
                    });
                });
                return Array.from(s);
            }
        }


        photoOverlaysUsed(sources: string[]) {
            if (sources) {
                this._photoOverlaysUsed = sources;
                return this;
            } else {
                var s = new Set();
                this._stack.slice(1, this._index + 1).forEach(function(state) {
                    if (state.photoOverlaysUsed && Array.isArray(state.photoOverlaysUsed)) {
                        state.photoOverlaysUsed.forEach(function(photoOverlay) {
                            s.add(photoOverlay);
                        });
                    }
                });
                return Array.from(s);
            }
        }


        // save the current history state
        checkpoint(key: string) {
            this._checkpoints[key] = {
                stack: this._stack,
                index: this._index
            };
            return this;
        }


        // restore history state to a given checkpoint or reset completely
        reset(key?: string) {
            if (key !== undefined && this._checkpoints.hasOwnProperty(key)) {
                this._stack = this._checkpoints[key].stack;
                this._index = this._checkpoints[key].index;
            } else {
                this._stack = [{graph: new coreGraph()}];
                this._index = 0;
                this._tree = coreTree(this._stack[0].graph);
                this._checkpoints = {};
            }
            this.dispatch.call('reset');
            this.dispatch.call('change');
            return this;
        }


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
        toIntroGraph() {
            var nextID = { n: 0, r: 0, w: 0 };
            var permIDs: { [T in EntityId]: T } = {};
            var graph = this.graph();
            var baseEntities: { [entityId: EntityId]: UnReadonly<OsmEntity> } = {};

            // clone base entities..
            Object.values(graph.base().entities).forEach(function(entity) {
                var copy = copyIntroEntity(entity!);
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
                if (entity.type === 'way' && Array.isArray(entity.nodes)) {
                    entity.nodes = entity.nodes.map(function(node) {
                        return permIDs[node] || node;
                    });
                }
                if (entity.type === 'relation' && Array.isArray(entity.members)) {
                    entity.members = entity.members.map(function(member) {
                        member.id = permIDs[member.id] || member.id;
                        return member;
                    });
                }
            });

            return JSON.stringify({ dataIntroGraph: baseEntities });


            function copyIntroEntity(source: OsmEntity) {
                var copy = utilObjectOmit(source, ['type', 'user', 'v', 'version', 'visible']) as Partial<UnReadonly<OsmEntity>>;

                // Note: the copy is no longer an osmEntity, so it might not have `tags`
                if (copy.tags && !Object.keys(copy.tags)) {
                    delete copy.tags;
                }

                if (copy.type === 'node' && Array.isArray(copy.loc)) {
                    copy.loc[0] = +copy.loc[0].toFixed(6);
                    copy.loc[1] = +copy.loc[1].toFixed(6);
                }

                var match = source.id.match(/([nrw])-\d*/);  // temporary id
                if (match !== null) {
                    var nrw = match[1] as 'n' | 'w' | 'r';
                    var permID;
                    do { permID = nrw + (++nextID[nrw]); }
                    while (baseEntities.hasOwnProperty(permID));
                    permID = <never>permID;

                    copy.id = permID;
                    permIDs[source.id] = permID;
                }
                return copy as OsmEntity;
            }
        }


        toJSON() {
            if (!this.hasChanges()) return;

            var allEntities: { [key: EntityId]: OsmEntity } = {};
            var baseEntities: { [id: EntityId]: OsmEntity } = {};
            var base = this._stack[0];

            var s = this._stack.map(function(i) {
                var modified: EntityId[] = [];
                var deleted: EntityId[] = [];

                Object.keys(i.graph.entities).forEach(function(id) {
                    var entity = i.graph.entities[id];
                    if (entity) {
                        var key = osmIdManager.key(entity);
                        allEntities[key] = entity;
                        modified.push(key);
                    } else {
                        deleted.push(id);
                    }

                    // make sure that the originals of changed or deleted entities get merged
                    // into the base of the _stack after restoring the data from JSON.
                    if (id in base.graph.entities) {
                        baseEntities[id] = base.graph.entities[id]!;
                    }
                    if (entity?.type === 'way' && entity.nodes) {
                        // get originals of pre-existing child nodes
                        entity.nodes.forEach(function(nodeID) {
                            if (nodeID in base.graph.entities) {
                                baseEntities[nodeID] = base.graph.entities[nodeID]!;
                            }
                        });
                    }
                    // get originals of parent entities too
                    var baseParents = base.graph._parentWays[id];
                    if (baseParents) {
                        baseParents.forEach(function(parentID) {
                            if (parentID in base.graph.entities) {
                                baseEntities[parentID] = base.graph.entities[parentID]!;
                            }
                        });
                    }
                });

                var x: SerialisedStack = {};

                if (modified.length) x.modified = modified;
                if (deleted.length) x.deleted = deleted;
                if (i.imageryUsed) x.imageryUsed = i.imageryUsed;
                if (i.photoOverlaysUsed) x.photoOverlaysUsed = i.photoOverlaysUsed;
                if (i.annotation) x.annotation = i.annotation;
                if (i.transform) x.transform = i.transform;
                if (i.selectedIDs) x.selectedIDs = i.selectedIDs;

                return x;
            });

            const serialised: SerialisedHistory = {
                version: 3,
                entities: Object.values(allEntities),
                baseEntities: Object.values(baseEntities),
                stack: s,
                nextIDs: osmIdManager.next,
                index: this._index,
                // note the time the changes were saved
                timestamp: (new Date()).getTime()
            };
            return serialised;
        }


        fromJSON(h: SerialisedHistory, loadChildNodes?: boolean) {
            var loadComplete = true;

            osmIdManager.next = h.nextIDs;
            this._index = h.index;

            if (h.version === 2 || h.version === 3) {
                var allEntities: { [key: string]: OsmEntity } = {};

                h.entities.forEach(function(entityObject) {
                    const entity = createEntity(entityObject) as OsmEntity;
                    allEntities[osmIdManager.key(entity)] = entity;
                });

                if (h.version === 3) {
                    // This merges originals for changed entities into the base of
                    // the _stack even if the current _stack doesn't have them (for
                    // example when iD has been restarted in a different region)
                    var baseEntities = h.baseEntities.map(function(d) { return createEntity(d) as OsmEntity; });
                    var stack = this._stack.map(function(state) { return state.graph; });
                    this._stack[0].graph.rebase(baseEntities, stack, true);
                    this._tree.rebase(baseEntities, true);

                    // When we restore a modified way, we also need to fetch any missing
                    // childnodes that would normally have been downloaded with it.. #2142
                    if (loadChildNodes) {
                        var osm = this.context.connection();
                        var baseWays = baseEntities
                            .filter(function(e) { return e.type === 'way'; });
                        var nodeIDs = baseWays
                            .reduce<EntityId[]>(function(acc, way) { return utilArrayUnion(acc, way.nodes); }, []);
                        var missing = nodeIDs
                            .filter((n) => { return !this._stack[0].graph.hasEntity(n); });

                        if (missing.length && osm) {
                            loadComplete = false;
                            this.context.map().redrawEnable(false);

                            var loading = uiLoading(this.context).blocking(true);
                            this.context.container().call(loading);

                            var childNodesLoaded = (err: Error, result: { data: OsmEntity[] }) => {
                                if (!err) {
                                    var visibleGroups = utilArrayGroupBy(result.data, 'visible');
                                    var visibles = visibleGroups.true || [];      // alive nodes
                                    var invisibles = visibleGroups.false || [];   // deleted nodes

                                    if (visibles.length) {
                                        var visibleIDs = visibles.map(function(entity) { return entity.id; });
                                        var stack = this._stack.map(function(state) { return state.graph; });
                                        missing = utilArrayDifference(missing, visibleIDs);
                                        this._stack[0].graph.rebase(visibles, stack, true);
                                        this._tree.rebase(visibles, true);
                                    }

                                    // fetch older versions of nodes that were deleted..
                                    invisibles.forEach(function(entity) {
                                        osm.loadEntityVersion(entity.id, +entity.version! - 1, childNodesLoaded);
                                    });
                                }

                                if (err || !missing.length) {
                                    loading.close();
                                    this.context.map().redrawEnable(true);
                                    this.dispatch.call('change');
                                    this.dispatch.call('restore', this);
                                }
                            };

                            osm.loadMultiple(missing, childNodesLoaded);
                        }
                    }
                }

                this._stack = h.stack.map((d) => {
                    var entities: { [key: EntityId]: OsmEntity } = {}, entity;

                    if (d.modified) {
                        d.modified.forEach(function(key) {
                            entity = allEntities[key];
                            entities[entity.id] = entity;
                        });
                    }

                    if (d.deleted) {
                        d.deleted.forEach(function(id) {
                            entities[id] = undefined!;
                        });
                    }

                    return {
                        graph: new coreGraph(this._stack[0].graph).load(entities),
                        annotation: d.annotation,
                        imageryUsed: d.imageryUsed,
                        photoOverlaysUsed: d.photoOverlaysUsed,
                        transform: d.transform,
                        selectedIDs: d.selectedIDs
                    };
                });

            } else { // original version
                this._stack = h.stack.map((d) => {
                    var entities: { [key: EntityId]: OsmEntity } = {};

                    // @ts-expect-error -- legacy format
                    const legacy = d.entities;
                    for (var _i in legacy) {
                        const i = <EntityId>_i;
                        var entity = legacy[i];
                        entities[i] = (entity === 'undefined' ? undefined : createEntity(entity)) as OsmEntity;
                    }

                    return { ...d, graph: new coreGraph(this._stack[0].graph).load(entities) };
                });
            }

            var transform = this._stack[this._index].transform;
            if (transform) {
                this.context.map().transformEase(transform, 0);   // 0 = immediate, no easing
            }

            if (loadComplete) {
                this.dispatch.call('change');
                this.dispatch.call('restore', this);
            }

            return this;
        }


        lock() {
            return this._lock.lock();
        }


        unlock() {
           this._lock.unlock();
        }


        save() {
            if (this._lock.locked() &&
                // don't overwrite existing, unresolved changes
                !this._hasUnresolvedRestorableChanges) {

                const historyData = this.toJSON();
                if (!historyData) {
                    asyncPrefs.del('saved_history')
                        .then(() => prefs('has_saved_history', null))
                        .catch(() => this.dispatch.call('storage_error'));
                } else {
                    asyncPrefs.set('saved_history', historyData)
                        .then(() => prefs('has_saved_history', true))
                        .catch(() => this.dispatch.call('storage_error'));
                }
            }
            return this;
        }


        // delete the history version saved in localStorage
        clearSaved() {
            this.context.debouncedSave.cancel();
            if (this._lock.locked()) {

                this._hasUnresolvedRestorableChanges = false;

                asyncPrefs.del('saved_history')
                    .then(() => prefs('has_saved_history', null));

                // clear the changeset metadata associated with the saved history
                prefs('comment', null);
                prefs('hashtags', null);
                prefs('source', null);
            }
            return this;
        }


        hasRestorableChanges() {
            return this._hasUnresolvedRestorableChanges;
        }

        async restore() {
            if (this._lock.locked()) {
                this._hasUnresolvedRestorableChanges = false;
                var json = await asyncPrefs.get('saved_history');
                if (json) this.fromJSON(json, true);
            }
        }

        async migrateHistoryData() {
            const value = JSON.parse(prefs(this._getLegacyKey('saved_history')));

            if (value !== null) {
                await asyncPrefs.set('saved_history', value);
                prefs('has_saved_history', true);
                prefs(this._getLegacyKey('saved_history'), null);
            }
        }


        // (legacy, was used for local-storage based history)
        // iD uses namespaced keys so multiple installations do not conflict
        _getLegacyKey = (n: string) => 'iD_' + window.location.origin + '_' + n;
}
