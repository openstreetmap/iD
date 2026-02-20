import { geoExtent } from '../geo/extent';


function UnionFind() {
    this.parent = {};
    this.rank = {};
}

UnionFind.prototype.find = function(x) {
    if (this.parent[x] === undefined) {
        this.parent[x] = x;
        this.rank[x] = 0;
    }
    if (this.parent[x] !== x) {
        this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
};

UnionFind.prototype.union = function(a, b) {
    var ra = this.find(a);
    var rb = this.find(b);
    if (ra === rb) return;
    if (this.rank[ra] < this.rank[rb]) { var tmp = ra; ra = rb; rb = tmp; }
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra]++;
};


/**
 * Split a set of changes into geographically coherent groups,
 * preserving referential integrity (ways stay with their nodes,
 * relations stay with their members).
 *
 * @param {Object} changes - { created: Entity[], modified: Entity[], deleted: Entity[] }
 * @param {import('./graph').coreGraph} graph - The current graph for resolving entity relationships
 * @param {number} [threshold=0.25] - Maximum bbox area in degrees^2 before splitting
 * @returns {Object[]} Array of { created, modified, deleted } groups
 */
export function coreChangesetSplitter(changes, graph, threshold) {
    if (threshold === undefined) threshold = 0.25;

    var allEntities = changes.created.concat(changes.modified).concat(changes.deleted);

    // Early exit for empty changes
    if (allEntities.length === 0) {
        return [{ created: [], modified: [], deleted: [] }];
    }

    // Build entity map first (needed by extent computation and centroid)
    var entityMap = {};
    for (var e = 0; e < allEntities.length; e++) {
        entityMap[allEntities[e].id] = allEntities[e];
    }

    // Early exit if overall bbox is under threshold
    var overallExtent = computeOverallExtent(allEntities, graph, entityMap);
    if (overallExtent.area() <= threshold) {
        return [changes];
    }

    // Build union-find from structural dependencies
    var uf = new UnionFind();

    for (var i = 0; i < allEntities.length; i++) {
        var entity = allEntities[i];
        uf.find(entity.id);  // ensure entity exists in union-find

        if (entity.type === 'way' && entity.nodes) {
            for (var j = 0; j < entity.nodes.length; j++) {
                if (entityMap[entity.nodes[j]] || hasChangedEntity(allEntities, entity.nodes[j])) {
                    uf.union(entity.id, entity.nodes[j]);
                }
            }
        } else if (entity.type === 'relation' && entity.members) {
            for (var k = 0; k < entity.members.length; k++) {
                var memberId = entity.members[k].id;
                if (entityMap[memberId] || hasChangedEntity(allEntities, memberId)) {
                    uf.union(entity.id, memberId);
                }
            }
        }
    }

    // Extract connected components
    var components = {};
    for (var m = 0; m < allEntities.length; m++) {
        var root = uf.find(allEntities[m].id);
        if (!components[root]) components[root] = [];
        components[root].push(allEntities[m]);
    }

    var componentKeys = Object.keys(components);

    // If only one component, no split possible
    if (componentKeys.length <= 1) {
        return [changes];
    }

    // Compute centroid for each component
    var componentCentroids = {};
    for (var c = 0; c < componentKeys.length; c++) {
        componentCentroids[componentKeys[c]] = computeComponentCentroid(components[componentKeys[c]], graph, entityMap);
    }

    // Grid-based clustering
    var cellSize = 0.5;
    var gridGroups = {};

    for (var g = 0; g < componentKeys.length; g++) {
        var key = componentKeys[g];
        var centroid = componentCentroids[key];
        var gridKey;

        if (centroid) {
            gridKey = Math.floor(centroid[0] / cellSize) + ',' + Math.floor(centroid[1] / cellSize);
        } else {
            gridKey = '_orphan';
        }

        if (!gridGroups[gridKey]) {
            gridGroups[gridKey] = [];
        }
        gridGroups[gridKey].push(key);
    }

    // Merge adjacent grid cells whose combined extent is under threshold
    mergeAdjacentCells(gridGroups, components, graph, entityMap, threshold);

    // Handle orphan components: attach to the largest group
    if (gridGroups._orphan) {
        var orphanComponents = gridGroups._orphan;
        delete gridGroups._orphan;

        var largestKey = findLargestGroupKey(gridGroups, components);
        if (largestKey) {
            gridGroups[largestKey] = gridGroups[largestKey].concat(orphanComponents);
        } else {
            // Everything is orphan; put in single group
            gridGroups._all = orphanComponents;
        }
    }

    // Build output groups
    return buildOutputGroups(gridGroups, components, changes);
}

function hasChangedEntity(allEntities, id) {
    for (var i = 0; i < allEntities.length; i++) {
        if (allEntities[i].id === id) return true;
    }
    return false;
}


function computeOverallExtent(allEntities, graph, entityMap) {
    var extent = geoExtent();
    for (var i = 0; i < allEntities.length; i++) {
        var locs = getEntityLocations(allEntities[i], graph, entityMap);
        for (var j = 0; j < locs.length; j++) {
            extent._extend(geoExtent(locs[j]));
        }
    }
    return extent;
}


// Returns ALL resolvable locations for an entity (not just the first one).
// This is critical for ways that span large areas.
function getEntityLocations(entity, graph, entityMap, seen) {
    var locs = [];
    if (!entity) return locs;

    // Guard against relation cycles, e.g. r1 -> r2 -> r1.
    if (!seen) seen = {};
    if (seen[entity.id]) return locs;
    seen[entity.id] = true;

    if (entity.type === 'node' && entity.loc) {
        locs.push(entity.loc);
    } else if (entity.type === 'way' && entity.nodes) {
        for (var i = 0; i < entity.nodes.length; i++) {
            var node = graph.hasEntity(entity.nodes[i]);
            if (!node && entityMap) node = entityMap[entity.nodes[i]];
            if (node && node.loc) locs.push(node.loc);
        }
    } else if (entity.type === 'relation' && entity.members) {
        for (var j = 0; j < entity.members.length; j++) {
            var member = graph.hasEntity(entity.members[j].id);
            if (!member && entityMap) member = entityMap[entity.members[j].id];
            if (member) {
                var memberLocs = getEntityLocations(member, graph, entityMap, seen);
                for (var k = 0; k < memberLocs.length; k++) {
                    locs.push(memberLocs[k]);
                }
            }
        }
    }

    delete seen[entity.id];
    return locs;
}


function computeComponentCentroid(entities, graph, entityMap) {
    var sumLon = 0;
    var sumLat = 0;
    var count = 0;

    for (var i = 0; i < entities.length; i++) {
        var locs = getEntityLocations(entities[i], graph, entityMap);
        for (var j = 0; j < locs.length; j++) {
            sumLon += locs[j][0];
            sumLat += locs[j][1];
            count++;
        }
    }

    if (count === 0) return null;
    return [sumLon / count, sumLat / count];
}


function parseGridKey(key) {
    var parts = key.split(',');
    return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
}


function mergeAdjacentCells(gridGroups, components, graph, entityMap, threshold) {
    var merged = true;
    while (merged) {
        merged = false;
        var keys = Object.keys(gridGroups).filter(function(k) { return k !== '_orphan'; });

        for (var i = 0; i < keys.length && !merged; i++) {
            for (var j = i + 1; j < keys.length && !merged; j++) {
                var a = parseGridKey(keys[i]);
                var b = parseGridKey(keys[j]);

                // Check grid adjacency in 8-neighborhood (including diagonal neighbors).
                if (Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1) {
                    // Compute combined extent
                    var combinedEntities = [];
                    var compKeysA = gridGroups[keys[i]];
                    var compKeysB = gridGroups[keys[j]];

                    for (var m = 0; m < compKeysA.length; m++) {
                        combinedEntities = combinedEntities.concat(components[compKeysA[m]]);
                    }
                    for (var n = 0; n < compKeysB.length; n++) {
                        combinedEntities = combinedEntities.concat(components[compKeysB[n]]);
                    }

                    var combinedExtent = computeOverallExtent(combinedEntities, graph, entityMap);

                    if (combinedExtent.area() <= threshold) {
                        // Merge j into i
                        gridGroups[keys[i]] = compKeysA.concat(compKeysB);
                        delete gridGroups[keys[j]];
                        merged = true;
                    }
                }
            }
        }
    }
}


function findLargestGroupKey(gridGroups, components) {
    var largestKey = null;
    var largestCount = 0;

    var keys = Object.keys(gridGroups);
    for (var i = 0; i < keys.length; i++) {
        var count = 0;
        var compKeys = gridGroups[keys[i]];
        for (var j = 0; j < compKeys.length; j++) {
            count += components[compKeys[j]].length;
        }
        if (count > largestCount) {
            largestCount = count;
            largestKey = keys[i];
        }
    }

    return largestKey;
}


function buildOutputGroups(gridGroups, components, changes) {
    var groups = [];
    var groupKeys = Object.keys(gridGroups);

    // Build a set of entity IDs per change type for fast lookup
    var createdIds = new Set(changes.created.map(function(e) { return e.id; }));
    var modifiedIds = new Set(changes.modified.map(function(e) { return e.id; }));
    var deletedIds = new Set(changes.deleted.map(function(e) { return e.id; }));

    for (var i = 0; i < groupKeys.length; i++) {
        var group = { created: [], modified: [], deleted: [] };
        var compKeys = gridGroups[groupKeys[i]];

        for (var j = 0; j < compKeys.length; j++) {
            var entities = components[compKeys[j]];

            for (var k = 0; k < entities.length; k++) {
                var entity = entities[k];
                if (createdIds.has(entity.id)) {
                    group.created.push(entity);
                } else if (modifiedIds.has(entity.id)) {
                    group.modified.push(entity);
                } else if (deletedIds.has(entity.id)) {
                    group.deleted.push(entity);
                }
            }
        }

        groups.push(group);
    }

    return groups;
}
