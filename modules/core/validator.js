import { dispatch as d3_dispatch } from 'd3-dispatch';

import { prefs } from './preferences';
import { coreDifference } from './difference';
import { geoExtent } from '../geo/extent';
import { modeSelect } from '../modes/select';
import { utilArrayChunk, utilArrayGroupBy, utilRebind } from '../util';
import * as Validations from '../validations/index';


export function coreValidator(context) {
  let dispatch = d3_dispatch('validated', 'focusedIssue');
  let validator = utilRebind({}, dispatch, 'on');

  let _rules = {};
  let _disabledRules = {};

  let _ignoredIssueIDs = new Set();
  let _resolvedIssueIDs = new Set();
  let _baseCache = validationCache();  // issues before any user edits
  let _headCache = validationCache();  // issues after all user edits
  let _previousGraph = null;

  let _deferredRIC = new Set();   // Set( RequestIdleCallback handles )
  let _deferredST = new Set();    // Set( SetTimeout handles )
  let _inProcess;                 // Promise fulfilled when validation complete

  const RETRY = 5000;             // wait 5sec before revalidating provisional entities


  // `init()`
  // Initialize the validator, called once on iD startup
  //
  validator.init = () => {
    Object.values(Validations).forEach(validation => {
      if (typeof validation !== 'function') return;
      const fn = validation(context);
      const key = fn.type;
      _rules[key] = fn;
    });

    let disabledRules = prefs('validate-disabledRules');
    if (disabledRules) {
      disabledRules.split(',').forEach(k => _disabledRules[k] = true);
    }
  };


  // `reset()`   (private)
  // Cancels deferred work and resets all caches
  //
  // Arguments
  //   `resetIgnored` - `true` to clear the list of user-ignored issues
  //
  function reset(resetIgnored) {
    // cancel deferred work
    _deferredRIC.forEach(window.cancelIdleCallback);
    _deferredRIC.clear();
    _deferredST.forEach(window.clearTimeout);
    _deferredST.clear();

    // empty queues and resolve any pending promise
    _baseCache.queue = [];
    _headCache.queue = [];
    processQueue();
    _inProcess = null;

    // clear caches
    if (resetIgnored) _ignoredIssueIDs.clear();
    _resolvedIssueIDs.clear();
    _baseCache = validationCache();
    _headCache = validationCache();
    _previousGraph = null;
  }


  // `reset()`
  // clear caches, called whenever iD resets after a save or switches sources
  // (clears out the _ignoredIssueIDs set also)
  //
  validator.reset = () => {
    reset(true);
  };


  // `resetIgnoredIssues()`
  // clears out the _ignoredIssueIDs Set
  //
  validator.resetIgnoredIssues = () => {
    _ignoredIssueIDs.clear();
    dispatch.call('validated');   // redraw UI
  };


  // `revalidateUnsquare()`
  // Called whenever the user changes the unsquare threshold
  // It reruns just the "unsquare_way" validation on all buildings.
  //
  validator.revalidateUnsquare = () => {
    revalidateUnsquare(_headCache, context.graph());
    revalidateUnsquare(_baseCache, context.history().base());
    dispatch.call('validated');
  };

  function revalidateUnsquare(cache, graph) {
    const checkUnsquareWay = _rules.unsquare_way;
    if (typeof checkUnsquareWay !== 'function') return;

    // uncache existing
    cache.uncacheIssuesOfType('unsquare_way');

    const buildings = context.history().tree().intersects(geoExtent([-180,-90],[180, 90]), graph)  // everywhere
      .filter(entity => (entity.type === 'way' && entity.tags.building && entity.tags.building !== 'no'));

    // rerun for all buildings
    buildings.forEach(entity => {
      const detected = checkUnsquareWay(entity, graph);
      if (!detected.length) return;
      cache.cacheIssues(detected);
    });
  }


  // `getIssues()`
  // Gets all issues that match the given options
  // This is called by many other places
  //
  // Arguments
  //   `options` Object like:
  //   {
  //     what: 'all',                  // 'all' or 'edited'
  //     where: 'all',                 // 'all' or 'visible'
  //     includeIgnored: false,        // true, false, or 'only'
  //     includeDisabledRules: false   // true, false, or 'only'
  //   }
  //
  // Returns
  //   An Array containing the issues
  //
  validator.getIssues = (options) => {
    const opts = Object.assign({ what: 'all', where: 'all', includeIgnored: false, includeDisabledRules: false }, options);
    const view = context.map().extent();
    let issues = [];
    let seen = new Set();

    // collect head issues - caused by user edits
    let cache = _headCache;
    let graph = context.graph();
    Object.values(cache.issuesByIssueID).forEach(issue => {
      if (!filter(issue, graph, cache)) return;
      seen.add(issue.id);
      issues.push(issue);
    });

    // collect base issues - not caused by user edits
    if (opts.what === 'all') {
      cache = _baseCache;
      graph = context.history().base();
      Object.values(cache.issuesByIssueID).forEach(issue => {
        if (!filter(issue, graph, cache)) return;
        seen.add(issue.id);
        issues.push(issue);
      });
    }

    return issues;


    function filter(issue, resolver, cache) {
      if (!issue) return false;
      if (seen.has(issue.id)) return false;
      if (_resolvedIssueIDs.has(issue.id)) return false;
      if (opts.includeDisabledRules === 'only' && !_disabledRules[issue.type]) return false;
      if (!opts.includeDisabledRules && _disabledRules[issue.type]) return false;

      if (opts.includeIgnored === 'only' && !_ignoredIssueIDs.has(issue.id)) return false;
      if (!opts.includeIgnored && _ignoredIssueIDs.has(issue.id)) return false;

      // Sanity check:  This issue may be for an entity that not longer exists.
      // If we detect this, uncache and return false so it is not included..
      const entityIDs = issue.entityIds || [];
      for (let i = 0; i < entityIDs.length; i++) {
        const entityID = entityIDs[i];
        if (!resolver.hasEntity(entityID)) {
          cache.uncacheEntityID(entityID);
          return false;
        }
      }

      if (opts.where === 'visible') {
        const extent = issue.extent(resolver);
        if (!view.intersects(extent)) return false;
      }

      return true;
    }
  };


  // `getResolvedIssues()`
  // Gets the issues that have been fixed by the user.
  // Resolved issues are tracked in the `_resolvedIssueIDs` Set
  //
  // Returns
  //   An Array containing the issues
  //
  validator.getResolvedIssues = () => {
    let collected = new Set();

    Object.values(_baseCache.issuesByIssueID).forEach(issue => {
      if (_resolvedIssueIDs.has(issue.id)) collected.add(issue);
    });
    Object.values(_headCache.issuesByIssueID).forEach(issue => {
      if (_resolvedIssueIDs.has(issue.id)) collected.add(issue);
    });

    return Array.from(collected);
  };


  // `focusIssue()`
  // Adjusts the map to focus on the given issue.
  // (requires the issue to have a reasonable extent defined)
  //
  // Arguments
  //   `issue` - the issue to focus on
  //
  validator.focusIssue = (issue) => {
    const extent = issue.extent(context.graph());
    if (!extent) return;

    const setZoom = Math.max(context.map().zoom(), 19);
    context.map().unobscuredCenterZoomEase(extent.center(), setZoom);

    // select the first entity
    if (issue.entityIds && issue.entityIds.length) {
      window.setTimeout(() => {
        let ids = issue.entityIds;
        context.enter(modeSelect(context, [ids[0]]));
        dispatch.call('focusedIssue', this, issue);
      }, 250);  // after ease
    }
  };


  // `getIssuesBySeverity()`
  // Gets the issues then groups them by error/warning
  // (This just calls getIssues, then puts issues in groups)
  //
  // Arguments
  //   `options` - (see `getIssues`)
  // Returns
  //   Object result like:
  //   {
  //     error:    Array of errors,
  //     warning:  Array of warnings
  //   }
  //
  validator.getIssuesBySeverity = (options) => {
    let groups = utilArrayGroupBy(validator.getIssues(options), 'severity');
    groups.error = groups.error || [];
    groups.warning = groups.warning || [];
    return groups;
  };


  // `getEntityIssues()`
  // Gets the issues that the given entity IDs have in common, matching the given options
  // (This just calls getIssues, then filters for the given entity IDs)
  // The issues are sorted for relevance
  //
  // Arguments
  //   `entityIDs` - Array or Set of entityIDs to get issues for
  //   `options` - (see `getIssues`)
  // Returns
  //   An Array containing the issues
  //
  validator.getSharedEntityIssues = (entityIDs, options) => {
    // show some issue types in a particular order
    const orderedIssueTypes = [
      // flag missing data first
      'missing_tag', 'missing_role',
      // then flag identity issues
      'outdated_tags', 'mismatched_geometry',
      // flag geometry issues where fixing them might solve connectivity issues
      'crossing_ways', 'almost_junction',
      // then flag connectivity issues
      'disconnected_way', 'impossible_oneway'
    ];

    const allIssues = validator.getIssues(options);
    const forEntityIDs = new Set(entityIDs);

    return allIssues
      .filter(issue => (issue.entityIds || []).some(entityID => forEntityIDs.has(entityID)))
      .sort((issue1, issue2) => {
        if (issue1.type === issue2.type) {             // issues of the same type, sort deterministically
          return issue1.id < issue2.id ? -1 : 1;
        }
        const index1 = orderedIssueTypes.indexOf(issue1.type);
        const index2 = orderedIssueTypes.indexOf(issue2.type);
        if (index1 !== -1 && index2 !== -1) {          // both issue types have explicit sort orders
          return index1 - index2;
        } else if (index1 === -1 && index2 === -1) {   // neither issue type has an explicit sort order, sort by type
          return issue1.type < issue2.type ? -1 : 1;
        } else {                                       // order explicit types before everything else
          return index1 !== -1 ? -1 : 1;
        }
      });
  };


  // `getEntityIssues()`
  // Get an array of detected issues for the given entityID.
  // (This just calls getSharedEntityIssues for a single entity)
  //
  // Arguments
  //   `entityID` - the entity ID to get the issues for
  //   `options` - (see `getIssues`)
  // Returns
  //   An Array containing the issues
  //
  validator.getEntityIssues = (entityID, options) => {
    return validator.getSharedEntityIssues([entityID], options);
  };


  // `getRuleKeys()`
  //
  // Returns
  //   An Array containing the rule keys
  //
  validator.getRuleKeys = () => {
    return Object.keys(_rules);
  };


  // `isRuleEnabled()`
  //
  // Arguments
  //   `key` - the rule to check (e.g. 'crossing_ways')
  // Returns
  //   `true`/`false`
  //
  validator.isRuleEnabled = (key) => {
    return !_disabledRules[key];
  };


  // `toggleRule()`
  // Toggles a single validation rule,
  // then reruns the validation so that the user sees something happen in the UI
  //
  // Arguments
  //   `key` - the rule to toggle (e.g. 'crossing_ways')
  //
  validator.toggleRule = (key) => {
    if (_disabledRules[key]) {
      delete _disabledRules[key];
    } else {
      _disabledRules[key] = true;
    }

    prefs('validate-disabledRules', Object.keys(_disabledRules).join(','));
    validator.validate();
  };


  // `disableRules()`
  // Disables given validation rules,
  // then reruns the validation so that the user sees something happen in the UI
  //
  // Arguments
  //   `keys` - Array or Set containing rule keys to disable
  //
  validator.disableRules = (keys) => {
    _disabledRules = {};
    keys.forEach(k => _disabledRules[k] = true);

    prefs('validate-disabledRules', Object.keys(_disabledRules).join(','));
    validator.validate();
  };


  // `ignoreIssue()`
  // Don't show the given issue in lists
  //
  // Arguments
  //   `issueID` - the issueID
  //
  validator.ignoreIssue = (issueID) => {
    _ignoredIssueIDs.add(issueID);
  };


  // `validate()`
  // Validates anything that has changed in the head graph since the last time it was run.
  // (head graph contains user's edits)
  //
  // Returns
  //   A Promise fulfilled when the validation has completed and then dispatches a `validated` event.
  //   This may take time but happen in the background during browser idle time.
  //
  validator.validate = () => {
    const currGraph = context.graph();
    _previousGraph = _previousGraph || context.history().base();
    if (currGraph === _previousGraph) {
      dispatch.call('validated');
      return Promise.resolve();
    }

    const oldGraph = _previousGraph;
    const difference = coreDifference(oldGraph, currGraph);
    _previousGraph = currGraph;

    const createdAndModifiedEntityIDs = difference.extantIDs(true);   // created/modified (true = w/relation members)
    let entityIDsToCheck = entityIDsToValidate(createdAndModifiedEntityIDs, currGraph);

    // check modified and deleted entities against the old graph in order to update their related entities
    // (e.g. deleting the only highway connected to a road should create a disconnected highway issue)
    const changedEntities = difference.deleted().concat(difference.modified());
    const modifiedAndDeletedEntityIDs = changedEntities.map(entity => entity.id);
    const entityIDsToCheckForOldGraph = entityIDsToValidate(modifiedAndDeletedEntityIDs, oldGraph);

    // concat the sets
    entityIDsToCheckForOldGraph.forEach(entityIDsToCheck.add, entityIDsToCheck);
    if (!entityIDsToCheck.size) {
      dispatch.call('validated');
      return Promise.resolve();
    }

    return validateEntitiesAsync(entityIDsToCheck, currGraph, _headCache)
      .then(() => updateResolvedIssues(entityIDsToCheck))
      .then(() => dispatch.call('validated'));
  };


  // register event handlers:

  // WHEN TO RUN VALIDATION:
  // When graph changes:
  context.history()
    .on('restore.validator', validator.validate)   // restore saved history
    .on('undone.validator', validator.validate)    // undo
    .on('redone.validator', validator.validate)    // redo
    .on('reset.validator', () => {
      reset(false);   // cached issues aren't valid any longer if the history has been reset
      validator.validate();
    });
    // but not on 'change' (e.g. while drawing)

  // When user changes editing modes (to catch recent changes e.g. drawing)
  context
    .on('exit.validator', validator.validate);

  // When merging fetched data, validate base graph:
  context.history()
    .on('merge.validator', entities => {
      if (!entities) return;
      const entityIDs = entities.map(entity => entity.id);
      const baseGraph = context.history().base();
      const baseIDs = entityIDsToValidate(entityIDs, baseGraph);
      validateEntitiesAsync(baseIDs, baseGraph, _baseCache);
    });



  // `validateEntity()`   (private)
  // Runs all validation rules on a single entity.
  // Some things to note:
  //  - Graph is passed in from whenever the validation was started.  Validators shouldn't use
  //   `context.graph()` because this all happens async, and the graph might have changed
  //   (for example, nodes getting deleted before the validation can run)
  //  - Validator functions may still be waiting on something and return a "provisional" result.
  //    In this situation, we will schedule to revalidate the entity sometime later.
  //
  // Arguments
  //   `entity` - The entity
  //   `graph` - graph containing the entity
  //
  // Returns
  //   Object result like:
  //   {
  //     issues:       Array of detected issues
  //     provisional:  `true` if provisional result, `false` if final result
  //   }
  //
  function validateEntity(entity, graph) {
    let result = { issues: [], provisional: false };

    // runs validation and appends resulting issues
    function runValidation(key) {
      const fn = _rules[key];
      if (typeof fn !== 'function') {
        console.error('no such validation rule = ' + key);  // eslint-disable-line no-console
        return;
      }

      const detected = fn(entity, graph);
      if (detected.provisional) {  // this validation should be run again later
        result.provisional = true;
      }
      result.issues = result.issues.concat(detected);
    }

    // run all rules
    Object.keys(_rules).forEach(runValidation);

    return result;
  }


  // `entityIDsToValidate()`   (private)
  // Collects the complete list of entityIDs related to the input entityIDs.
  //
  // Arguments
  //   `entityIDs` - Set or Array containing entityIDs.
  //   `graph` - graph containing the entities
  //
  // Returns
  //   Set containing entityIDs
  //
  function entityIDsToValidate(entityIDs, graph) {
    let seen = new Set();
    let collected = new Set();

    entityIDs.forEach(entityID => {
      // keep `seen` separate from `collected` because an `entityID`
      // could have been added to `collected` as a related entity through an earlier pass
      if (seen.has(entityID)) return;
      seen.add(entityID);

      const entity = graph.hasEntity(entityID);
      if (!entity) return;

      collected.add(entityID);   // collect self

      let checkParentRels = [entity];

      if (entity.type === 'node') {
        graph.parentWays(entity).forEach(parentWay => {
          collected.add(parentWay.id);    // collect parent ways
          checkParentRels.push(parentWay);
        });

      } else if (entity.type === 'relation') {
        entity.members.forEach(member => collected.add(member.id));  // collect members

      } else if (entity.type === 'way') {
        entity.nodes.forEach(nodeID => {
          collected.add(nodeID);    // collect child nodes
          graph._parentWays[nodeID].forEach(wayID => collected.add(wayID));  // collect connected ways
        });
      }

      checkParentRels.forEach(entity => {    // collect parent relations
        if (entity.type !== 'relation') {    // but not super-relations
          graph.parentRelations(entity).forEach(parentRelation => collected.add(parentRelation.id));
        }
      });
    });

    return collected;
  }


  // `updateResolvedIssues()`   (private)
  // Determine if any issues were resolved for the given entities.
  // This is called by `validate()` after validation of the head graph
  //
  // Arguments
  //   `entityIDs` - Set containing entity IDs.
  //
  function updateResolvedIssues(entityIDs) {
    entityIDs.forEach(entityID => {
      const headIssues = _headCache.issuesByEntityID[entityID];
      const baseIssues = _baseCache.issuesByEntityID[entityID];
      if (!baseIssues) return;

      baseIssues.forEach(issueID => {
        if (headIssues && headIssues.has(issueID)) {   // issue still not resolved
          _resolvedIssueIDs.delete(issueID);           // (did undo, or possibly fixed and then re-caused the issue)
        } else {
          _resolvedIssueIDs.add(issueID);
        }
      });
    });
  }


  // `validateEntitiesAsync()`   (private)
  // Schedule validation for many entities.
  //
  // Arguments
  //   `entityIDs` - Set containing entity IDs.
  //   `graph` - the graph to validate that contains those entities
  //   `cache` - the cache to store results in (_headCache or _baseCache)
  //
  // Returns
  //   A Promise fulfilled when the validation has completed.
  //   This may take time but happen in the background during browser idle time.
  //
  function validateEntitiesAsync(entityIDs, graph, cache) {
    // Enqueue the work
    const jobs = Array.from(entityIDs).map(entityID => {
      if (cache.queuedEntityIDs.has(entityID)) return null;  // queued already
      cache.queuedEntityIDs.add(entityID);

      return () => {
        // clear caches for existing issues related to this entity
        cache.uncacheEntityID(entityID);
        cache.queuedEntityIDs.delete(entityID);

        // detect new issues and update caches
        const entity = graph.hasEntity(entityID);       // Sanity check: don't validate deleted entities
        if (entity) {
          const result = validateEntity(entity, graph);
          if (result.provisional) {                     // provisional result
            cache.provisionalEntityIDs.add(entityID);   // we'll need to revalidate this entity again later
          }
          cache.cacheIssues(result.issues);   // update cache
        }
      };

    }).filter(Boolean);


    // Perform the work in chunks.
    // Because this will happen during idle callbacks, we want to choose a chunk size
    // that won't make the browser stutter too badly.
    cache.queue = cache.queue.concat(utilArrayChunk(jobs, 100));

    // Perform the work
    if (_inProcess) return _inProcess;

    _inProcess = processQueue()
      .then(() => revalidateProvisionalEntities(cache))
      .catch(() => { /* ignore */ })
      .finally(() => _inProcess = null);

    return _inProcess;
  }


  // `revalidateProvisionalEntities()`   (private)
  // Sometimes a validator will return a "provisional" result.
  // In this situation, we'll need to revalidate the entity later.
  // This function waits a delay, then places them back into the validation queue.
  //
  // Arguments
  //   `cache` - The cache (_headCache or _baseCache)
  //
  function revalidateProvisionalEntities(cache) {
    if (!cache.provisionalEntityIDs.size) return;  // nothing to do

    const handle = window.setTimeout(() => {
      _deferredST.delete(handle);
      if (!cache.provisionalEntityIDs.size) return;  // nothing to do

      const graph = (cache === _headCache ? context.graph() : context.history().base());
      validateEntitiesAsync(cache.provisionalEntityIDs, graph, cache);
    }, RETRY);

    _deferredST.add(handle);
  }


  // `processQueue()`   (private)
  // Process the next chunk of deferred validation work
  //
  // Returns
  //   A Promise fulfilled when the validation has completed.
  //   This may take time but happen in the background during browser idle time.
  //
  function processQueue() {
    // console.log(`head queue length ${_headCache.queue.length}`);
    // console.log(`base queue length ${_baseCache.queue.length}`);
    let chunk;
    if (_baseCache.queue.length) {
      chunk = _baseCache.queue.pop();
    } else if (_headCache.queue.length) {
      chunk = _headCache.queue.pop();
    }

    if (!chunk) return Promise.resolve();  // we're done

    return new Promise(resolvePromise => {
        const handle = window.requestIdleCallback(() => {
          _deferredRIC.delete(handle);
          // const t0 = performance.now();
          chunk.forEach(job => job());
          // const t1 = performance.now();
          // console.log('chunk processed in ' + (t1 - t0) + ' ms');
          resolvePromise();
        });
        _deferredRIC.add(handle);
      })
      .then(() => { // dispatch an event sometimes to redraw various UI things
        const count = _headCache.queue.length + _baseCache.queue.length;
        if (count % 25 === 0) dispatch.call('validated');
      })
      .then(() => processQueue());
  }


  return validator;
}


// `validationCache()`   (private)
// Creates a cache to store validation state
// We create 2 of these:
//   `_baseCache` for validation on the base graph (unedited)
//   `_headCache` for validation on the head graph (user edits applied)
//
function validationCache() {
  let cache = {
    queue: [],
    queuedEntityIDs: new Set(),
    provisionalEntityIDs: new Set(),
    issuesByIssueID: {},  // issue.id -> issue
    issuesByEntityID: {}  // entity.id -> set(issue.id)
  };

  cache.cacheIssues = (issues) => {
    issues.forEach(issue => {
      const entityIDs = issue.entityIds || [];
      entityIDs.forEach(entityID => {
        if (!cache.issuesByEntityID[entityID]) {
          cache.issuesByEntityID[entityID] = new Set();
        }
        cache.issuesByEntityID[entityID].add(issue.id);
      });
      cache.issuesByIssueID[issue.id] = issue;
    });
  };

  cache.uncacheIssue = (issue) => {
    // When multiple entities are involved (e.g. crossing_ways),
    // remove this issue from the other entity caches too..
    const entityIDs = issue.entityIds || [];
    entityIDs.forEach(entityID => {
      if (cache.issuesByEntityID[entityID]) {
        cache.issuesByEntityID[entityID].delete(issue.id);
      }
    });
    delete cache.issuesByIssueID[issue.id];
  };

  cache.uncacheIssues = (issues) => {
    issues.forEach(cache.uncacheIssue);
  };

  cache.uncacheIssuesOfType = (type) => {
    const issuesOfType = Object.values(cache.issuesByIssueID)
      .filter(issue => issue.type === type);
    cache.uncacheIssues(issuesOfType);
  };

  // Remove a single entity and all its related issues from the caches
  cache.uncacheEntityID = (entityID) => {
    const issueIDs = cache.issuesByEntityID[entityID];
    if (issueIDs) {
      issueIDs.forEach(issueID => {
        const issue = cache.issuesByIssueID[issueID];
        if (issue) {
          cache.uncacheIssue(issue);
        } else {
          delete cache.issuesByIssueID[issueID];
        }
      });
    }

    delete cache.issuesByEntityID[entityID];
    cache.provisionalEntityIDs.delete(entityID);
  };


  return cache;
}
