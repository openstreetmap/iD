import { dispatch as d3_dispatch } from 'd3-dispatch';

import { prefs } from './preferences';
import { coreDifference } from './difference';
import { geoExtent } from '../geo/extent';
import { modeSelect } from '../modes/select';
import { utilArrayChunk, utilArrayGroupBy, utilEntityAndDeepMemberIDs, utilRebind } from '../util';
import * as Validations from '../validations/index';


export function coreValidator(context) {
  let dispatch = d3_dispatch('validated', 'focusedIssue');
  let validator = utilRebind({}, dispatch, 'on');

  let _rules = {};
  let _disabledRules = {};

  let _ignoredIssueIDs = new Set();
  let _resolvedIssueIDs = new Set();
  let _baseCache = validationCache('base');   // issues before any user edits
  let _headCache = validationCache('head');   // issues after all user edits
  let _completeDiff = {};                     // complete diff base -> head of what the user changed
  let _headIsCurrent = false;

  let _deferredRIC = {};          // Object( RequestIdleCallback handle : rejectPromise method )
  let _deferredST = new Set();    // Set( SetTimeout handles )
  let _headPromise;               // Promise fulfilled when validation is performed up to headGraph snapshot

  const RETRY = 5000;             // wait 5sec before revalidating provisional entities


  // Allow validation severity to be overridden by url queryparams...
  // See: https://github.com/openstreetmap/iD/pull/8243
  //
  // Each param should contain a urlencoded comma separated list of
  // `type/subtype` rules.  `*` may be used as a wildcard..
  // Examples:
  //  `validationError=disconnected_way/*`
  //  `validationError=disconnected_way/highway`
  //  `validationError=crossing_ways/bridge*`
  //  `validationError=crossing_ways/bridge*,crossing_ways/tunnel*`

  const _errorOverrides = parseHashParam(context.initialHashParams.validationError);
  const _warningOverrides = parseHashParam(context.initialHashParams.validationWarning);
  const _disableOverrides = parseHashParam(context.initialHashParams.validationDisable);

  // `parseHashParam()`   (private)
  // Checks hash parameters for severity overrides
  // Arguments
  //   `param` - a url hash parameter (`validationError`, `validationWarning`, or `validationDisable`)
  // Returns
  //   Array of Objects like { type: RegExp, subtype: RegExp }
  //
  function parseHashParam(param) {
    let result = [];
    let rules = (param || '').split(',');
    rules.forEach(rule => {
      rule = rule.trim();
      const parts = rule.split('/', 2);  // "type/subtype"
      const type = parts[0];
      const subtype = parts[1] || '*';
      if (!type || !subtype) return;
      result.push({ type: makeRegExp(type), subtype: makeRegExp(subtype) });
    });
    return result;

    function makeRegExp(str) {
      const escaped = str
        .replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&')   // escape all reserved chars except for the '*'
        .replace(/\*/g, '.*');                      // treat a '*' like '.*'
      return new RegExp('^' + escaped + '$');
    }
  }


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
    // empty queues
    _baseCache.queue = [];
    _headCache.queue = [];

    // cancel deferred work and reject any pending promise
    Object.keys(_deferredRIC).forEach(key => {
      window.cancelIdleCallback(key);
      _deferredRIC[key]();
    });
    _deferredRIC = {};
    _deferredST.forEach(window.clearTimeout);
    _deferredST.clear();

    // clear caches
    if (resetIgnored) _ignoredIssueIDs.clear();
    _resolvedIssueIDs.clear();
    _baseCache = validationCache('base');
    _headCache = validationCache('head');
    _completeDiff = {};
    _headIsCurrent = false;
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
    revalidateUnsquare(_headCache);
    revalidateUnsquare(_baseCache);
    dispatch.call('validated');
  };

  function revalidateUnsquare(cache) {
    const checkUnsquareWay = _rules.unsquare_way;
    if (!cache.graph || typeof checkUnsquareWay !== 'function') return;

    // uncache existing
    cache.uncacheIssuesOfType('unsquare_way');

    const buildings = context.history().tree().intersects(geoExtent([-180,-90],[180, 90]), cache.graph)  // everywhere
      .filter(entity => (entity.type === 'way' && entity.tags.building && entity.tags.building !== 'no'));

    // rerun for all buildings
    buildings.forEach(entity => {
      const detected = checkUnsquareWay(entity, cache.graph);
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
    let seen = new Set();
    let results = [];

    // collect head issues - present in the user edits
    if (_headCache.graph && _headCache.graph !== _baseCache.graph) {
      Object.values(_headCache.issuesByIssueID).forEach(issue => {
        // In the head cache, only count features that the user is responsible for - #8632
        // For example, a user can undo some work and an issue will still present in the
        // head graph, but we don't want to credit the user for causing that issue.
        const userModified = (issue.entityIds || []).some(id => _completeDiff.hasOwnProperty(id));
        if (opts.what === 'edited' && !userModified) return;   // present in head but user didn't touch it

        if (!filter(issue)) return;
        seen.add(issue.id);
        results.push(issue);
      });
    }

    // collect base issues - present before user edits
    if (opts.what === 'all') {
      Object.values(_baseCache.issuesByIssueID).forEach(issue => {
        if (!filter(issue)) return;
        seen.add(issue.id);
        results.push(issue);
      });
    }

    return results;


    // Filter the issue set to include only what the calling code wants to see.
    // Note that we use `context.graph()`/`context.hasEntity()` here, not `cache.graph`,
    // because that is the graph that the calling code will be using.
    function filter(issue) {
      if (!issue) return false;
      if (seen.has(issue.id)) return false;
      if (_resolvedIssueIDs.has(issue.id)) return false;
      if (opts.includeDisabledRules === 'only' && !_disabledRules[issue.type]) return false;
      if (!opts.includeDisabledRules && _disabledRules[issue.type]) return false;

      if (opts.includeIgnored === 'only' && !_ignoredIssueIDs.has(issue.id)) return false;
      if (!opts.includeIgnored && _ignoredIssueIDs.has(issue.id)) return false;

      // This issue may involve an entity that doesn't exist in context.graph()
      // This can happen because validation is async and rendering the issue lists is async.
      if ((issue.entityIds || []).some(id => !context.hasEntity(id))) return false;

      if (opts.where === 'visible') {
        const extent = issue.extent(context.graph());
        if (!view.intersects(extent)) return false;
      }

      return true;
    }
  };


  // `getResolvedIssues()`
  // Gets the issues that have been fixed by the user.
  //
  // Resolved issues are tracked in the `_resolvedIssueIDs` Set,
  // and they should all be issues that exist in the _baseCache.
  //
  // Returns
  //   An Array containing the issues
  //
  validator.getResolvedIssues = () => {
    return Array.from(_resolvedIssueIDs)
      .map(issueID => _baseCache.issuesByIssueID[issueID])
      .filter(Boolean);
  };


  // `focusIssue()`
  // Adjusts the map to focus on the given issue.
  // (requires the issue to have a reasonable extent defined)
  //
  // Arguments
  //   `issue` - the issue to focus on
  //
  validator.focusIssue = (issue) => {
    // Note that we use `context.graph()`/`context.hasEntity()` here, not `cache.graph`,
    // because that is the graph that the calling code will be using.
    const graph = context.graph();
    let selectID;
    let focusCenter;

    // Try to focus the map at the center of the issue..
    const issueExtent = issue.extent(graph);
    if (issueExtent) {
      focusCenter = issueExtent.center();
    }

    // Try to select the first entity in the issue..
    if (issue.entityIds && issue.entityIds.length) {
      selectID = issue.entityIds[0];

      // If a relation, focus on one of its members instead.
      // Otherwise we might be focusing on a part of map where the relation is not visible.
      if (selectID && selectID.charAt(0) === 'r') {   // relation
        const ids = utilEntityAndDeepMemberIDs([selectID], graph);
        let nodeID = ids.find(id => id.charAt(0) === 'n' && graph.hasEntity(id));

        if (!nodeID) {  // relation has no downloaded nodes to focus on
          const wayID = ids.find(id => id.charAt(0) === 'w' && graph.hasEntity(id));
          if (wayID) {
            nodeID = graph.entity(wayID).first();   // focus on the first node of this way
          }
        }

        if (nodeID) {
          focusCenter = graph.entity(nodeID).loc;
        }
      }
    }

    if (focusCenter) {  // Adjust the view
      const setZoom = Math.max(context.map().zoom(), 19);
      context.map().unobscuredCenterZoomEase(focusCenter, setZoom);
    }

    if (selectID) {  // Enter select mode
      window.setTimeout(() => {
        context.enter(modeSelect(context, [selectID]));
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
    const orderedIssueTypes = [                 // Show some issue types in a particular order:
      'missing_tag', 'missing_role',            // - missing data first
      'outdated_tags', 'mismatched_geometry',   // - identity issues
      'crossing_ways', 'almost_junction',       // - geometry issues where fixing them might solve connectivity issues
      'disconnected_way', 'impossible_oneway'   // - finally connectivity issues
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
    // Make sure the caches have graphs assigned to them.
    // (we don't do this in `reset` because context is still resetting things and `history.base()` is unstable then)
    const baseGraph = context.history().base();
    if (!_headCache.graph) _headCache.graph = baseGraph;
    if (!_baseCache.graph) _baseCache.graph = baseGraph;

    const prevGraph = _headCache.graph;
    const currGraph = context.graph();

    if (currGraph === prevGraph) {   // _headCache.graph is current - we are caught up
      _headIsCurrent = true;
      dispatch.call('validated');
      return Promise.resolve();
    }

    if (_headPromise) {         // Validation already in process, but we aren't caught up to current
      _headIsCurrent = false;   // We will need to catch up after the validation promise fulfills
      return _headPromise;
    }

    // If we get here, its time to start validating stuff.
    _headCache.graph = currGraph;  // take snapshot
    _completeDiff = context.history().difference().complete();
    const incrementalDiff = coreDifference(prevGraph, currGraph);
    let entityIDs = Object.keys(incrementalDiff.complete());
    entityIDs = _headCache.withAllRelatedEntities(entityIDs);  // expand set

    if (!entityIDs.size) {
      dispatch.call('validated');
      return Promise.resolve();
    }

    _headPromise = validateEntitiesAsync(entityIDs, _headCache)
      .then(() => updateResolvedIssues(entityIDs))
      .then(() => dispatch.call('validated'))
      .catch(() => { /* ignore */ })
      .then(() => {
        _headPromise = null;
        if (!_headIsCurrent) {
          validator.validate();   // run it again to catch up to current graph
        }
      });

    return _headPromise;
  };


  // register event handlers:

  // WHEN TO RUN VALIDATION:
  // When history changes:
  context.history()
    .on('restore.validator', validator.validate)   // on restore saved history
    .on('undone.validator', validator.validate)    // on undo
    .on('redone.validator', validator.validate)    // on redo
    .on('reset.validator', () => {                 // on history reset - happens after save, or enter/exit walkthrough
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

      // Make sure the caches have graphs assigned to them.
      // (we don't do this in `reset` because context is still resetting things and `history.base()` is unstable then)
      const baseGraph = context.history().base();
      if (!_headCache.graph) _headCache.graph = baseGraph;
      if (!_baseCache.graph) _baseCache.graph = baseGraph;

      let entityIDs = entities.map(entity => entity.id);
      entityIDs = _baseCache.withAllRelatedEntities(entityIDs);  // expand set
      validateEntitiesAsync(entityIDs, _baseCache);
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
    Object.keys(_rules).forEach(runValidation);   // run all rules
    return result;


    // runs validation and appends resulting issues
    function runValidation(key) {
      const fn = _rules[key];
      if (typeof fn !== 'function') {
        console.error('no such validation rule = ' + key);  // eslint-disable-line no-console
        return;
      }

      let detected = fn(entity, graph);
      if (detected.provisional) {  // this validation should be run again later
        result.provisional = true;
      }
      detected = detected.filter(applySeverityOverrides);
      result.issues = result.issues.concat(detected);


      // If there are any override rules that match the issue type/subtype,
      // adjust severity (or disable it) and keep/discard as quickly as possible.
      function applySeverityOverrides(issue) {
        const type = issue.type;
        const subtype = issue.subtype || '';
        let i;

        for (i = 0; i < _errorOverrides.length; i++) {
          if (_errorOverrides[i].type.test(type) && _errorOverrides[i].subtype.test(subtype)) {
            issue.severity = 'error';
            return true;
          }
        }
        for (i = 0; i < _warningOverrides.length; i++) {
          if (_warningOverrides[i].type.test(type) && _warningOverrides[i].subtype.test(subtype)) {
            issue.severity = 'warning';
            return true;
          }
        }
        for (i = 0; i < _disableOverrides.length; i++) {
          if (_disableOverrides[i].type.test(type) && _disableOverrides[i].subtype.test(subtype)) {
            return false;
          }
        }
        return true;
      }
    }
  }


  // `updateResolvedIssues()`   (private)
  // Determine if any issues were resolved for the given entities.
  // This is called by `validate()` after validation of the head graph
  //
  // Give the user credit for fixing an issue if:
  // - the issue is in the base cache
  // - the issue is not in the head cache
  // - the user did something to one of the entities involved in the issue
  //
  // Arguments
  //   `entityIDs` - Array or Set containing entity IDs.
  //
  function updateResolvedIssues(entityIDs) {
    entityIDs.forEach(entityID => {
      const baseIssues = _baseCache.issuesByEntityID[entityID];
      if (!baseIssues) return;

      baseIssues.forEach(issueID => {
        // Check if the user did something to one of the entities involved in this issue.
        // (This issue could involve multiple entities, e.g. disconnected routable features)
        const issue = _baseCache.issuesByIssueID[issueID];
        const userModified = (issue.entityIds || []).some(id => _completeDiff.hasOwnProperty(id));

        if (userModified && !_headCache.issuesByIssueID[issueID]) {  // issue seems fixed
          _resolvedIssueIDs.add(issueID);
        } else {                              // issue still not resolved
          _resolvedIssueIDs.delete(issueID);  // (did undo, or possibly fixed and then re-caused the issue)
        }
      });
    });
  }


  // `validateEntitiesAsync()`   (private)
  // Schedule validation for many entities.
  //
  // Arguments
  //   `entityIDs` - Array or Set containing entityIDs.
  //   `graph` - the graph to validate that contains those entities
  //   `cache` - the cache to store results in (_headCache or _baseCache)
  //
  // Returns
  //   A Promise fulfilled when the validation has completed.
  //   This may take time but happen in the background during browser idle time.
  //
  function validateEntitiesAsync(entityIDs, cache) {
    // Enqueue the work
    const jobs = Array.from(entityIDs).map(entityID => {
      if (cache.queuedEntityIDs.has(entityID)) return null;  // queued already
      cache.queuedEntityIDs.add(entityID);

      // Clear caches for existing issues related to this entity
      cache.uncacheEntityID(entityID);

      return () => {
        cache.queuedEntityIDs.delete(entityID);

        const graph = cache.graph;
        if (!graph) return;  // was reset?

        const entity = graph.hasEntity(entityID);   // Sanity check: don't validate deleted entities
        if (!entity) return;

        // detect new issues and update caches
        const result = validateEntity(entity, graph);
        if (result.provisional) {                       // provisional result
          cache.provisionalEntityIDs.add(entityID);     // we'll need to revalidate this entity again later
        }

        cache.cacheIssues(result.issues);   // update cache
      };

    }).filter(Boolean);


    // Perform the work in chunks.
    // Because this will happen during idle callbacks, we want to choose a chunk size
    // that won't make the browser stutter too badly.
    cache.queue = cache.queue.concat(utilArrayChunk(jobs, 100));

    // Perform the work
    if (cache.queuePromise) return cache.queuePromise;

    cache.queuePromise = processQueue(cache)
      .then(() => revalidateProvisionalEntities(cache))
      .catch(() => { /* ignore */ })
      .finally(() => cache.queuePromise = null);

    return cache.queuePromise;
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
      validateEntitiesAsync(Array.from(cache.provisionalEntityIDs), cache);
    }, RETRY);

    _deferredST.add(handle);
  }


  // `processQueue(queue)`   (private)
  // Process the next chunk of deferred validation work
  //
  // Arguments
  //   `cache` - The cache (_headCache or _baseCache)
  //
  // Returns
  //   A Promise fulfilled when the validation has completed.
  //   This may take time but happen in the background during browser idle time.
  //
  function processQueue(cache) {
    // console.log(`${cache.which} queue length ${cache.queue.length}`);

    if (!cache.queue.length) return Promise.resolve();  // we're done
    const chunk = cache.queue.pop();

    return new Promise((resolvePromise, rejectPromise) => {
        const handle = window.requestIdleCallback(() => {
          delete (_deferredRIC[handle]);
          // const t0 = performance.now();
          chunk.forEach(job => job());
          // const t1 = performance.now();
          // console.log('chunk processed in ' + (t1 - t0) + ' ms');
          resolvePromise();
        });
        _deferredRIC[handle] = rejectPromise;
      })
      .then(() => { // dispatch an event sometimes to redraw various UI things
        if (cache.queue.length % 25 === 0) dispatch.call('validated');
      })
      .then(() => processQueue(cache));
  }


  return validator;
}


// `validationCache()`   (private)
// Creates a cache to store validation state
// We create 2 of these:
//   `_baseCache` for validation on the base graph (unedited)
//   `_headCache` for validation on the head graph (user edits applied)
//
// Arguments
//   `which` - just a String 'base' or 'head' to keep track of it
//
function validationCache(which) {
  let cache = {
    which: which,
    graph: null,
    queue: [],
    queuePromise: null,
    queuedEntityIDs: new Set(),
    provisionalEntityIDs: new Set(),
    issuesByIssueID: {},  // issue.id -> issue
    issuesByEntityID: {}  // entity.id -> Set(issue.id)
  };


  cache.cacheIssue = (issue) => {
    (issue.entityIds || []).forEach(entityID => {
      if (!cache.issuesByEntityID[entityID]) {
        cache.issuesByEntityID[entityID] = new Set();
      }
      cache.issuesByEntityID[entityID].add(issue.id);
    });
    cache.issuesByIssueID[issue.id] = issue;
  };


  cache.uncacheIssue = (issue) => {
    (issue.entityIds || []).forEach(entityID => {
      if (cache.issuesByEntityID[entityID]) {
        cache.issuesByEntityID[entityID].delete(issue.id);
      }
    });
    delete cache.issuesByIssueID[issue.id];
  };


  cache.cacheIssues = (issues) => {
    issues.forEach(cache.cacheIssue);
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
    const entityIssueIDs = cache.issuesByEntityID[entityID];
    if (entityIssueIDs) {
      entityIssueIDs.forEach(issueID => {
        const issue = cache.issuesByIssueID[issueID];
        if (issue) {
          cache.uncacheIssue(issue);
        } else {  // shouldn't happen, clean up
          delete cache.issuesByIssueID[issueID];
        }
      });
    }

    delete cache.issuesByEntityID[entityID];
    cache.provisionalEntityIDs.delete(entityID);
  };


  // Return the expandeded set of entityIDs related to issues for the given entityIDs
  //
  // Arguments
  //   `entityIDs` - Array or Set containing entityIDs.
  //
  cache.withAllRelatedEntities = (entityIDs) => {
    let result = new Set();
    (entityIDs || []).forEach(entityID => {
      result.add(entityID);  // include self

      const entityIssueIDs = cache.issuesByEntityID[entityID];
      if (entityIssueIDs) {
        entityIssueIDs.forEach(issueID => {
          const issue = cache.issuesByIssueID[issueID];
          if (issue) {
            (issue.entityIds || []).forEach(relatedID => result.add(relatedID));
          } else {  // shouldn't happen, clean up
            delete cache.issuesByIssueID[issueID];
          }
        });
      }
    });

    return result;
  };


  return cache;
}
