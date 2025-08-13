import RBush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import { geoExtent, geoVecAdd } from '../geo';
import { QAItem } from '../osm';
import { utilRebind, utilTiler } from '../util';

const tiler = utilTiler();
const dispatch = d3_dispatch('loaded');
const _tileZoom = 14;
const _mrUrlRoot = 'https://maproulette.org/api/v2';

// This gets reassigned if reset
let _cache;
let _challengeIDs = new Set();

function abortRequest(controller) {
    if (controller) {
        controller.abort();
    }
}

function abortUnwantedRequests(cache, tiles) {
    Object.keys(cache.inflightTile).forEach((k) => {
        const wanted = tiles.find((tile) => k === tile.id);
    if (!wanted) {
      abortRequest(cache.inflightTile[k]);
      delete cache.inflightTile[k];
    }
    });
}

function encodeIssueRtree(d) {
    return {
        minX: d.loc[0],
        minY: d.loc[1],
        maxX: d.loc[0],
        maxY: d.loc[1],
        data: d,
    };
}

// Replace or remove QAItem from rtree
function updateRtree(item, replace) {
    _cache.rtree.remove(item, (a, b) => a.data.id === b.data.id);
    if (replace) {
        _cache.rtree.insert(item);
    }
}

export default {
    title: 'maproulette',

    init() {
        if (!_cache) {
            this.reset();
        }
        this.event = utilRebind(this, dispatch, 'on');
    },

    reset() {
        if (_cache) {
            Object.values(_cache.inflightTile).forEach(abortRequest);
        }

        _cache = {
            data: {},
            loadedTile: {},
            inflightTile: {},
            inflightPost: {},
            inflightChallenge: {},
            inflightChallengePromise: {},
            inflightTask: {},
            inflightTaskPromise: {},
            loadedChallenge: {}, // Map<challengeID, { isVisible: boolean }>
            challengeDetails: {}, // Map<challengeID, full challenge object>
            taskDetails: {}, // Map<taskID, full task object>
            closed: {},
            rtree: new RBush(),
        };
    },

    // challengeIDs setter/getter as comma-separated string
    challengeIDs(val) {
        if (val === undefined) {
            return Array.from(_challengeIDs).join(',');
        }
        const str =
            val === null || val === undefined ? '' : val.toString().trim();
        if (!str || str.toLowerCase() === 'true') {
            _challengeIDs = new Set();
        } else {
            const ids = str
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .filter((s) => s.toLowerCase() !== 'true');
            _challengeIDs = new Set(ids);
        }
        // Notify listeners (e.g., layer) to redraw with updated filtering
        dispatch.call('loaded');
        return this;
    },

    loadIssues(projection) {
        const tiles = tiler
            .zoomExtent([_tileZoom, _tileZoom])
            .getTiles(projection);

        abortUnwantedRequests(_cache, tiles);

        tiles.forEach((tile) => {
            if (_cache.loadedTile[tile.id] || _cache.inflightTile[tile.id]) { return; }

            const [left, top, right, bottom] = tile.extent.rectangle();
            const bbox = [left, bottom, right, top].join('/');
            const url = `${_mrUrlRoot}/tasks/box/${bbox}`;
            const controller = new AbortController();
            _cache.inflightTile[tile.id] = controller;

            d3_json(url, { signal: controller.signal })
                .then((data) => {
                    delete _cache.inflightTile[tile.id];
                    _cache.loadedTile[tile.id] = true;
          if (!data || !data.length) { return; }

                    const unseenChallenges = new Set();
                    data.forEach((task) => {
                        const taskID = String(task.id);
                        const parentId = String(task.parentId);
                        if (_cache.data[taskID]) return;

                        // move markers slightly to avoid overlap and jitter duplicates
                        let loc = [task.point?.lng, task.point?.lat];
                        if (!loc[0] || !loc[1]) return;
                        let coincident = false;
                        do {
                            let delta = coincident
                                ? [0.00001, 0]
                                : [0, 0.00001];
                            loc = geoVecAdd(loc, delta);
                            let bbox = geoExtent(loc).bbox();
                            coincident = _cache.rtree.search(bbox).length;
                        } while (coincident);

                        const d = new QAItem(loc, this, 'task', taskID, {
                            id: taskID,
                            parentId: parentId,
                            severity: 'warning',
                            task: task,
                        });
                        // Default visibility until challenge details are known
                        const chState = _cache.loadedChallenge[parentId];
                        d.isVisible = chState ? !!chState.isVisible : false;
                        _cache.data[taskID] = d;
                        _cache.rtree.insert(encodeIssueRtree(d));

                        if (
                            !_cache.loadedChallenge[parentId] &&
                            !_cache.inflightChallenge[parentId]
                        ) {
                            unseenChallenges.add(parentId);
                        }
                    });

                    dispatch.call('loaded');

                    // Queue challenge detail fetches to align with Rapid behavior
                    unseenChallenges.forEach((chID) => {
                        const urlC = `${_mrUrlRoot}/challenge/${chID}`;
                        const cController = new AbortController();
                        _cache.inflightChallenge[chID] = cController;
                        _cache.inflightChallengePromise[chID] = d3_json(urlC, {
                            signal: cController.signal,
                        })
                            .then((challenge) => {
                                delete _cache.inflightChallenge[chID];
                                delete _cache.inflightChallengePromise[chID];
                                const isVisible = !!(
                                    challenge &&
                                    challenge.enabled &&
                                    !challenge.deleted
                                );
                                _cache.loadedChallenge[chID] = {
                                    isVisible: isVisible,
                                };
                                _cache.challengeDetails[chID] = challenge || {};
                                // Update task visibilities for this challenge
                                Object.values(_cache.data).forEach((item) => {
                                    if (item.parentId === chID) { item.isVisible = isVisible; }
                                });
                                dispatch.call('loaded');
                            })
                            .catch(() => {
                                delete _cache.inflightChallenge[chID];
                                delete _cache.inflightChallengePromise[chID];
                                _cache.loadedChallenge[chID] = {
                                    isVisible: false,
                                }; // avoid retry storms
                            });
                    });
        })
        .catch(() => {
          delete _cache.inflightTile[tile.id];
          _cache.loadedTile[tile.id] = true;
        });
        });
    },

    // Get all cached QAItems covering the viewport
    getItems(projection) {
        const viewport = projection.clipExtent();
        const min = [viewport[0][0], viewport[1][1]];
        const max = [viewport[1][0], viewport[0][1]];
        const bbox = geoExtent(
            projection.invert(min),
            projection.invert(max),
        ).bbox();

        const items = _cache.rtree.search(bbox).map((d) => d.data);
        if (_challengeIDs.size > 0) {
            // If user specified challenges, show only those regardless of challenge visibility
            return items.filter((d) => _challengeIDs.has(d.parentId));
        }
        // Default: show only items from visible challenges
        return items.filter((d) => d.isVisible);
    },

    // NOTE: Don't change method name until UI v3 is merged
    getError(id) {
        return _cache.data[id];
    },

    replaceItem(item) {
        if (!(item instanceof QAItem) || !item.id) return;
        _cache.data[item.id] = item;
        updateRtree(encodeIssueRtree(item), true);
        return item;
    },

    removeItem(item) {
        if (!(item instanceof QAItem) || !item.id) return;
        delete _cache.data[item.id];
        updateRtree(encodeIssueRtree(item), false);
    },

    issueURL(item) {
        return `https://maproulette.org/challenge/${item.parentId}/task/${item.id}`;
    },

    // Submit update to MapRoulette
    postUpdate(d, callback) {
        // expects: d._status (1 fixed, 6 can't complete, 5 already fixed, 2 not an issue)
        // optional: d.comment, d.mapRouletteApiKey
        const commentUrl = `${_mrUrlRoot}/task/${d.id}/comment`;
        const updateTaskUrl = `${_mrUrlRoot}/task/${d.id}/${d._status}`;
        const releaseTaskUrl = `${_mrUrlRoot}/task/${d.id}/release`;

        const headers = { 'Content-Type': 'application/json' };
        if (d.mapRouletteApiKey) headers.apiKey = d.mapRouletteApiKey;

        const doComment = () => {
            if (!d.comment) return Promise.resolve();
            return fetch(commentUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ actionId: 2, comment: d.comment }),
            }).then(() => {});
        };

        doComment()
            .then(() => fetch(updateTaskUrl, { method: 'PUT', headers }))
            .then(() => fetch(releaseTaskUrl, { method: 'POST', headers }))
            .then(() => {
                this.removeItem(d);
                if (callback) callback(null, d);
            })
            .catch((err) => {
                if (callback) callback(err, d);
            });
    },

    // Load and return a task-like object including challenge texts and task features
    loadTaskDetailAsync(qaItem) {
        if (!qaItem || !qaItem.id || !qaItem.parentId) { return Promise.resolve(null); }
        const chID = qaItem.parentId;
        const baseTask = qaItem.task || {};
        const getCh = this.getChallengeDetails(chID);
        const getTd = this.getTaskDetails(qaItem.id);
        return Promise.all([getCh, getTd]).then(([ch, td]) => ({
            ...baseTask,
            id: qaItem.id,
            parentId: qaItem.parentId,
            parentName: (ch && ch.name) || '',
            instruction: (ch && ch.instruction) || '',
            description: (ch && ch.description) || '',
            taskFeatures: (td && td.geometries && td.geometries.features) || [],
        }));
    },

    // Fetch or return cached challenge details
    getChallengeDetails(chID) {
        if (!chID) return Promise.resolve({});
    if (_cache.challengeDetails[chID]) { return Promise.resolve(_cache.challengeDetails[chID]); }
        if (_cache.inflightChallengePromise[chID]) {
            return _cache.inflightChallengePromise[chID];
        }
        const urlC = `${_mrUrlRoot}/challenge/${chID}`;
        const cController = new AbortController();
        _cache.inflightChallenge[chID] = cController;
        _cache.inflightChallengePromise[chID] = d3_json(urlC, {
            signal: cController.signal,
        })
            .then((challenge) => {
                delete _cache.inflightChallenge[chID];
                delete _cache.inflightChallengePromise[chID];
                const isVisible = !!(
                    challenge &&
                    challenge.enabled &&
                    !challenge.deleted
                );
                _cache.loadedChallenge[chID] = { isVisible: isVisible };
                _cache.challengeDetails[chID] = challenge || {};
                return _cache.challengeDetails[chID];
            })
            .catch(() => {
                delete _cache.inflightChallenge[chID];
                delete _cache.inflightChallengePromise[chID];
                _cache.loadedChallenge[chID] = { isVisible: false };
                return {};
            });
        return _cache.inflightChallengePromise[chID];
    },

    // Fetch or return cached task details (includes geometries for mustache replacement)
    getTaskDetails(taskID) {
        if (!taskID) return Promise.resolve({});
    if (_cache.taskDetails[taskID]) { return Promise.resolve(_cache.taskDetails[taskID]); }
        if (_cache.inflightTaskPromise[taskID]) {
            return _cache.inflightTaskPromise[taskID];
        }
        const urlT = `${_mrUrlRoot}/task/${taskID}`;
        const tController = new AbortController();
        _cache.inflightTask[taskID] = tController;
        _cache.inflightTaskPromise[taskID] = d3_json(urlT, {
            signal: tController.signal,
        })
            .then((task) => {
                delete _cache.inflightTask[taskID];
                delete _cache.inflightTaskPromise[taskID];
                _cache.taskDetails[taskID] = task || {};
                return _cache.taskDetails[taskID];
            })
            .catch(() => {
                delete _cache.inflightTask[taskID];
                delete _cache.inflightTaskPromise[taskID];
                return {};
            });
        return _cache.inflightTaskPromise[taskID];
    },
};
