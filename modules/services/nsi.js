import { Matcher } from 'name-suggestion-index';
import parseVersion from 'vparse';

import { fileFetcher, locationManager } from '../core';
import { presetManager } from '../presets';

import { nsiCdnUrl } from '../../config/id.js';

// Make very sure this resolves to iD's `package.json`
// If you mess up the `../`s, the resolver may import another random package.json from somewhere else.
import packageJSON from '../../package.json';


// This service contains all the code related to the **name-suggestion-index** (aka NSI)
// NSI contains the most correct tagging for many commonly mapped features.
// See https://github.com/osmlab/name-suggestion-index  and  https://nsi.guide


// DATA

let _nsiStatus = 'loading';  // 'loading', 'ok', 'failed'
let _nsi = {};

// Sometimes we can upgrade a feature tagged like `building=yes` to a better tag.
const buildingPreset = {
  'building/commercial': true,
  'building/government': true,
  'building/hotel': true,
  'building/retail': true,
  'building/office': true,
  'building/supermarket': true,
  'building/yes': true
};

// Exceptions to the namelike regexes.
// Usually a tag suffix contains a language code like `name:en`, `name:ru`
// but we want to exclude things like `operator:type`, `name:etymology`, etc..
const notNames = /:(colou?r|type|forward|backward|left|right|etymology|pronunciation|wikipedia)$/i;

// Exceptions to the branchlike regexes
const notBranches = /(coop|express|wireless|factory|outlet)/i;


// PRIVATE FUNCTIONS

// `setNsiSources()`
// Adds the sources to iD's filemap so we can start downloading data.
//
function setNsiSources() {
  const nsiVersion = packageJSON.dependencies['name-suggestion-index'] || packageJSON.devDependencies['name-suggestion-index'];
  const v = parseVersion(nsiVersion);
  const vMinor = `${v.major}.${v.minor}`;
  const cdn = nsiCdnUrl.replace('{version}', vMinor);
  const sources = {
    'nsi_data': cdn + 'dist/nsi.min.json',
    'nsi_dissolved': cdn + 'dist/dissolved.min.json',
    'nsi_features': cdn + 'dist/featureCollection.min.json',
    'nsi_generics': cdn + 'dist/genericWords.min.json',
    'nsi_presets': cdn + 'dist/presets/nsi-id-presets.min.json',
    'nsi_replacements': cdn + 'dist/replacements.min.json',
    'nsi_trees': cdn + 'dist/trees.min.json'
  };

  let fileMap = fileFetcher.fileMap();
  for (const k in sources) {
    if (!fileMap[k]) fileMap[k] = sources[k];
  }
}


// `loadNsiPresets()`
//  Returns a Promise fulfilled when the presets have been downloaded and merged into iD.
//
function loadNsiPresets() {
  return (
    Promise.all([
      fileFetcher.get('nsi_presets'),
      fileFetcher.get('nsi_features')
    ])
    .then(vals => {
      // Add `suggestion=true` to all the nsi presets
      // The preset json schema doesn't include it, but the iD code still uses it
      Object.values(vals[0].presets).forEach(preset => preset.suggestion = true);

      presetManager.merge({
        presets: vals[0].presets,
        featureCollection: vals[1]
      });
    })
  );
}


// `loadNsiData()`
//  Returns a Promise fulfilled when the other data have been downloaded and processed
//
function loadNsiData() {
  return (
    Promise.all([
      fileFetcher.get('nsi_data'),
      fileFetcher.get('nsi_dissolved'),
      fileFetcher.get('nsi_replacements'),
      fileFetcher.get('nsi_trees')
    ])
    .then(vals => {
      _nsi = {
        data:          vals[0].nsi,            // the raw name-suggestion-index data
        dissolved:     vals[1].dissolved,      // list of dissolved items
        replacements:  vals[2].replacements,   // trivial old->new qid replacements
        trees:         vals[3].trees,          // metadata about trees, main tags
        kvt:           new Map(),              // Map (k -> Map (v -> t) )
        qids:          new Map(),              // Map (wd/wp tag values -> qids)
        ids:           new Map()               // Map (id -> NSI item)
      };

      const matcher = _nsi.matcher = new Matcher();
      matcher.buildMatchIndex(_nsi.data);

// *** BEGIN HACK ***

// old - built in matcher will set up the locationindex by resolving all the locationSets one-by-one
      // matcher.buildLocationIndex(_nsi.data, locationManager.loco());

// new - Use the location manager instead of redoing that work
// It has already processed the presets at this point

// We need to monkeypatch a few of the collections that the NSI matcher depends on.
// The `itemLocation` structure maps itemIDs to locationSetIDs
matcher.itemLocation = new Map();

// The `locationSets` structure maps locationSetIDs to GeoJSON
// We definitely need this, but don't need full geojson, just { properties: { area: xxx }}
matcher.locationSets = new Map();

Object.keys(_nsi.data).forEach(tkv => {
  const items = _nsi.data[tkv].items;
  if (!Array.isArray(items) || !items.length) return;

  items.forEach(item => {
    if (matcher.itemLocation.has(item.id)) return;   // we've seen item id already - shouldn't be possible?

    const locationSetID = locationManager.locationSetID(item.locationSet);
    matcher.itemLocation.set(item.id, locationSetID);

    if (matcher.locationSets.has(locationSetID)) return;   // we've seen this locationSet before..

    const fakeFeature = { id: locationSetID, properties: { id: locationSetID, area: 1 } };
    matcher.locationSets.set(locationSetID, fakeFeature);
  });
});

// The `locationIndex` is an instance of which-polygon spatial index for the locationSets.
// We only really need this to _look like_ which-polygon query `_wp.locationIndex(bbox, true);`
// i.e. it needs to return the properties of the locationsets
matcher.locationIndex = (bbox) => {
  const validHere = locationManager.locationSetsAt([bbox[0], bbox[1]]);
  const results = [];

  for (const [locationSetID, area] of Object.entries(validHere)) {
    const fakeFeature = matcher.locationSets.get(locationSetID);
    if (fakeFeature) {
      fakeFeature.properties.area = area;
      results.push(fakeFeature);
    }
  }
  return results;
};

// *** END HACK ***


      Object.keys(_nsi.data).forEach(tkv => {
        const category = _nsi.data[tkv];
        const parts = tkv.split('/', 3);     // tkv = "tree/key/value"
        const t = parts[0];
        const k = parts[1];
        const v = parts[2];

        // Build a reverse index of keys -> values -> trees present in the name-suggestion-index
        // Collect primary keys  (e.g. "amenity", "craft", "shop", "man_made", "route", etc)
        // "amenity": {
        //   "restaurant": "brands"
        // }
        let vmap = _nsi.kvt.get(k);
        if (!vmap) {
          vmap = new Map();
          _nsi.kvt.set(k, vmap);
        }
        vmap.set(v, t);

        const tree = _nsi.trees[t];     // e.g. "brands", "operators"
        const mainTag = tree.mainTag;   // e.g. "brand:wikidata", "operator:wikidata", etc

        const items = category.items || [];
        items.forEach(item => {
          // Remember some useful things for later, cache NSI id -> item
          item.tkv = tkv;
          item.mainTag = mainTag;
          _nsi.ids.set(item.id, item);

          // Cache Wikidata/Wikipedia values -> qid, for #6416
          const wd = item.tags[mainTag];
          const wp = item.tags[mainTag.replace('wikidata', 'wikipedia')];
          if (wd)         _nsi.qids.set(wd, wd);
          if (wp && wd)   _nsi.qids.set(wp, wd);
        });
      });
    })
  );
}


// `gatherKVs()`
// Gather all the k/v pairs that we will run through the NSI matcher.
// An OSM tags object can contain anything, but only a few tags will be interesting to NSI.
//
// This function will return the interesting tag pairs like:
//   "amenity/restaurant", "man_made/flagpole"
// and fallbacks like
//   "amenity/yes"
// excluding things like
//   "tiger:reviewed", "surface", "ref", etc.
//
// Arguments
//   `tags`: `Object` containing the feature's OSM tags
// Returns
//   `Object` containing kv pairs to test:
//   {
//     'primary': Set(),
//     'alternate': Set()
//   }
//
function gatherKVs(tags) {
  let primary = new Set();
  let alternate = new Set();

  Object.keys(tags).forEach(osmkey => {
    const osmvalue = tags[osmkey];
    if (!osmvalue) return;

    // Match a 'route_master' as if it were a 'route' - name-suggestion-index#5184
    if (osmkey === 'route_master') osmkey = 'route';

    const vmap = _nsi.kvt.get(osmkey);
    if (!vmap) return;  // not an interesting key

    if (vmap.get(osmvalue)) {     // Matched a category in NSI
      primary.add(`${osmkey}/${osmvalue}`);     // interesting key/value
    } else if (osmvalue === 'yes') {
      alternate.add(`${osmkey}/${osmvalue}`);   // fallback key/yes
    }
  });

  // Can we try a generic building fallback match? - See #6122, #7197
  // Only try this if we do a preset match and find nothing else remarkable about that building.
  // For example, a way with `building=yes` + `name=Westfield` may be a Westfield department store.
  // But a way with `building=yes` + `name=Westfield` + `public_transport=station` is a train station for a town named "Westfield"
  const preset = presetManager.matchTags(tags, 'area');
  if (buildingPreset[preset.id]) {
    alternate.add('building/yes');
  }

  return { primary: primary, alternate: alternate };
}


// `identifyTree()`
// NSI has a concept of trees: "brands", "operators", "flags", "transit".
// The tree determines things like which tags are namelike, and which tags hold important wikidata.
// This takes an Object of tags and tries to identify what tree to use.
//
// Arguments
//   `tags`: `Object` containing the feature's OSM tags
// Returns
//   `string` the name of the tree if known
//   or 'unknown' if it could match several trees (e.g. amenity/yes)
//   or null if no match
//
function identifyTree(tags) {
  let unknown;
  let t;

  // Check all tags
  Object.keys(tags).forEach(osmkey => {
    if (t) return;  // found already

    const osmvalue = tags[osmkey];
    if (!osmvalue) return;

    // Match a 'route_master' as if it were a 'route' - name-suggestion-index#5184
    if (osmkey === 'route_master') osmkey = 'route';

    const vmap = _nsi.kvt.get(osmkey);
    if (!vmap) return;  // this key is not in nsi

    if (osmvalue === 'yes') {
      unknown = 'unknown';
    } else {
      t = vmap.get(osmvalue);
    }
  });

  return t || unknown || null;
}


// `gatherNames()`
// Gather all the namelike values that we will run through the NSI matcher.
// It will gather values primarily from tags `name`, `name:ru`, `flag:name`
//  and fallback to alternate tags like `brand`, `brand:ru`, `alt_name`
//
// Arguments
//   `tags`: `Object` containing the feature's OSM tags
// Returns
//   `Object` containing namelike values to test:
//   {
//     'primary': Set(),
//     'fallbacks': Set()
//   }
//
function gatherNames(tags) {
  const empty = { primary: new Set(), alternate: new Set() };
  let primary = new Set();
  let alternate = new Set();
  let foundSemi = false;
  let testNameFragments = false;
  let patterns;

  // Patterns for matching OSM keys that might contain namelike values.
  // These roughly correspond to the "trees" concept in name-suggestion-index,
  let t = identifyTree(tags);
  if (!t) return empty;

  if (t === 'transit') {
    patterns = {
      primary: /^network$/i,
      alternate: /^(operator|operator:\w+|network:\w+|\w+_name|\w+_name:\w+)$/i
    };
  } else if (t === 'flags') {
    patterns = {
      primary: /^(flag:name|flag:name:\w+)$/i,
      alternate: /^(flag|flag:\w+|subject|subject:\w+)$/i   // note: no `country`, we special-case it below
    };
  } else if (t === 'brands') {
    testNameFragments = true;
    patterns = {
      primary: /^(name|name:\w+)$/i,
      alternate: /^(brand|brand:\w+|operator|operator:\w+|\w+_name|\w+_name:\w+)/i,
    };
  } else if (t === 'operators') {
    testNameFragments = true;
    patterns = {
      primary: /^(name|name:\w+|operator|operator:\w+)$/i,
      alternate: /^(brand|brand:\w+|\w+_name|\w+_name:\w+)/i,
    };
  } else {  // unknown/multiple
    testNameFragments = true;
    patterns = {
      primary: /^(name|name:\w+)$/i,
      alternate: /^(brand|brand:\w+|network|network:\w+|operator|operator:\w+|\w+_name|\w+_name:\w+)/i,
    };
  }

  // Test `name` fragments, longest to shortest, to fit them into a "Name Branch" pattern.
  // e.g. "TUI ReiseCenter - Neuss Innenstadt" -> ["TUI", "ReiseCenter", "Neuss", "Innenstadt"]
  if (tags.name && testNameFragments) {
    const nameParts = tags.name.split(/[\s\-\/,.]/);
    for (let split = nameParts.length; split > 0; split--) {
      const name = nameParts.slice(0, split).join(' ');  // e.g. "TUI ReiseCenter"
      primary.add(name);
    }
  }

  // Check all tags
  Object.keys(tags).forEach(osmkey => {
    const osmvalue = tags[osmkey];
    if (!osmvalue) return;

    if (isNamelike(osmkey, 'primary')) {
      if (/;/.test(osmvalue)) {
        foundSemi = true;
      } else {
        primary.add(osmvalue);
        alternate.delete(osmvalue);
      }
    } else if (!primary.has(osmvalue) && isNamelike(osmkey, 'alternate')) {
      if (/;/.test(osmvalue)) {
        foundSemi = true;
      } else {
        alternate.add(osmvalue);
      }
    }
  });

  // For flags only, fallback to `country` tag only if no other namelike values were found.
  // See https://github.com/openstreetmap/iD/pull/8305#issuecomment-769174070
  if (tags.man_made === 'flagpole' && !primary.size && !alternate.size && !!tags.country) {
    const osmvalue = tags.country;
    if (/;/.test(osmvalue)) {
      foundSemi = true;
    } else {
      alternate.add(osmvalue);
    }
  }

  // If any namelike value contained a semicolon, return empty set and don't try matching anything.
  if (foundSemi) {
    return empty;
  } else {
    return { primary: primary, alternate: alternate };
  }

  function isNamelike(osmkey, which) {
    if (osmkey === 'old_name') return false;
    return patterns[which].test(osmkey) && !notNames.test(osmkey);
  }
}


// `gatherTuples()`
// Generate all combinations of [key,value,name] that we want to test.
// This prioritizes them so that the primary name and k/v pairs go first
//
// Arguments
//   `tryKVs`: `Object` containing primary and alternate k/v pairs to test
//   `tryNames`: `Object` containing primary and alternate names to test
// Returns
//   `Array`: tuple objects ordered by priority
//
function gatherTuples(tryKVs, tryNames) {
  let tuples = [];
  ['primary', 'alternate'].forEach(whichName => {
    // test names longest to shortest
    const arr = Array.from(tryNames[whichName]).sort((a, b) => b.length - a.length);
    arr.forEach(n => {
      ['primary', 'alternate'].forEach(whichKV => {
        tryKVs[whichKV].forEach(kv => {
          const parts = kv.split('/', 2);
          const k = parts[0];
          const v = parts[1];
          tuples.push({ k: k, v: v, n: n });
        });
      });
    });
  });
  return tuples;
}


// `_upgradeTags()`
// Try to match a feature to a canonical record in name-suggestion-index
// and upgrade the tags to match.
//
// Arguments
//   `tags`: `Object` containing the feature's OSM tags
//   `loc`: Location where this feature exists, as a [lon, lat]
// Returns
//   `Object` containing the result, or `null` if no changes needed:
//   {
//     'newTags': `Object` - The tags the the feature should have
//     'matched': `Object` - The matched item
//   }
//
function _upgradeTags(tags, loc) {
  let newTags = Object.assign({}, tags);  // shallow copy
  let changed = false;

  // Before anything, perform trivial Wikipedia/Wikidata replacements
  Object.keys(newTags).forEach(osmkey => {
    const matchTag = osmkey.match(/^(\w+:)?wikidata$/);
    if (matchTag) {                         // Look at '*:wikidata' tags
      const prefix = (matchTag[1] || '');
      const wd = newTags[osmkey];
      const replace = _nsi.replacements[wd];    // If it matches a QID in the replacement list...

      if (replace && replace.wikidata !== undefined) {   // replace or delete `*:wikidata` tag
        changed = true;
        if (replace.wikidata) {
          newTags[osmkey] = replace.wikidata;
        } else {
          delete newTags[osmkey];
        }
      }
      if (replace && replace.wikipedia !== undefined) {  // replace or delete `*:wikipedia` tag
        changed = true;
        const wpkey = `${prefix}wikipedia`;
        if (replace.wikipedia) {
          newTags[wpkey] = replace.wikipedia;
        } else {
          delete newTags[wpkey];
        }
      }
    }
  });

  // Match a 'route_master' as if it were a 'route' - name-suggestion-index#5184
  const isRouteMaster = (tags.type === 'route_master');

  // Gather key/value tag pairs to try to match
  const tryKVs = gatherKVs(tags);
  if (!tryKVs.primary.size && !tryKVs.alternate.size) {
    return changed ? { newTags: newTags, matched: null } : null;
  }

  // Gather namelike tag values to try to match
  const tryNames = gatherNames(tags);

  // Do `wikidata=*` or `wikipedia=*` tags identify this entity as a chain? - See #6416
  // If so, these tags can be swapped to e.g. `brand:wikidata`/`brand:wikipedia`.
  const foundQID = _nsi.qids.get(tags.wikidata) || _nsi.qids.get(tags.wikipedia);
  if (foundQID) tryNames.primary.add(foundQID);  // matcher will recognize the Wikidata QID as name too

  if (!tryNames.primary.size && !tryNames.alternate.size) {
    return changed ? { newTags: newTags, matched: null } : null;
  }

  // Order the [key,value,name] tuples - test primary before alternate
  const tuples = gatherTuples(tryKVs, tryNames);

  for (let i = 0; i < tuples.length; i++) {
    const tuple = tuples[i];
    const hits = _nsi.matcher.match(tuple.k, tuple.v, tuple.n, loc);   // Attempt to match an item in NSI

    if (!hits || !hits.length) continue;  // no match, try next tuple
    if (hits[0].match !== 'primary' && hits[0].match !== 'alternate') break;  // a generic match, stop looking

    // A match may contain multiple results, the first one is likely the best one for this location
    // e.g. `['pfk-a54c14', 'kfc-1ff19c', 'kfc-658eea']`
    let itemID, item;
    for (let j = 0; j < hits.length; j++) {
      const hit = hits[j];
      itemID = hit.itemID;
      if (_nsi.dissolved[itemID]) continue;       // Don't upgrade to a dissolved item

      item = _nsi.ids.get(itemID);
      if (!item) continue;
      const mainTag = item.mainTag;               // e.g. `brand:wikidata`
      const itemQID = item.tags[mainTag];         // e.g. `brand:wikidata` qid
      const notQID = newTags[`not:${mainTag}`];   // e.g. `not:brand:wikidata` qid

      if (                                        // Exceptions, skip this hit
        (!itemQID || itemQID === notQID) ||       // No `*:wikidata` or matched a `not:*:wikidata`
        (newTags.office && !item.tags.office)     // feature may be a corporate office for a brand? - #6416
      ) {
        item = null;
        continue;  // continue looking
      } else {
        break;     // use `item`
      }
    }

    // Can't use any of these hits, try next tuple..
    if (!item) continue;

    // At this point we have matched a canonical item and can suggest tag upgrades..
    item = JSON.parse(JSON.stringify(item));   // deep copy
    const tkv = item.tkv;
    const parts = tkv.split('/', 3);     // tkv = "tree/key/value"
    const k = parts[1];
    const v = parts[2];
    const category = _nsi.data[tkv];
    const properties = category.properties || {};

    // Preserve some tags that we specifically don't want NSI to overwrite. ('^name', sometimes)
    let preserveTags = item.preserveTags || properties.preserveTags || [];

    // These tags can be toplevel tags -or- attributes - so we generally want to preserve existing values - #8615
    // We'll only _replace_ the tag value if this tag is the toplevel/defining tag for the matched item (`k`)
    ['building', 'emergency', 'internet_access', 'takeaway'].forEach(osmkey => {
      if (k !== osmkey) preserveTags.push(`^${osmkey}$`);
    });

    const regexes = preserveTags.map(s => new RegExp(s, 'i'));

    let keepTags = {};
    Object.keys(newTags).forEach(osmkey => {
      if (regexes.some(regex => regex.test(osmkey))) {
        keepTags[osmkey] = newTags[osmkey];
      }
    });

    // Remove any primary tags ("amenity", "craft", "shop", "man_made", "route", etc) that have a
    // value like `amenity=yes` or `shop=yes` (exceptions have already been added to `keepTags` above)
    _nsi.kvt.forEach((vmap, k) => {
      if (newTags[k] === 'yes') delete newTags[k];
    });

    // Replace mistagged `wikidata`/`wikipedia` with e.g. `brand:wikidata`/`brand:wikipedia`
    if (foundQID) {
      delete newTags.wikipedia;
      delete newTags.wikidata;
    }

    // Do the tag upgrade
    Object.assign(newTags, item.tags, keepTags);

    // Swap `route` back to `route_master` - name-suggestion-index#5184
    if (isRouteMaster) {
      newTags.route_master = newTags.route;
      delete newTags.route;
    }

    // Special `branch` splitting rules - IF..
    // - NSI is suggesting to replace `name`, AND
    // - `branch` doesn't already contain something, AND
    // - original name has not moved to an alternate name (e.g. "Dunkin' Donuts" -> "Dunkin'"), AND
    // - original name is "some name" + "some stuff", THEN
    // consider splitting `name` into `name`/`branch`..
    const origName = tags.name;
    const newName = newTags.name;
    if (newName && origName && newName !== origName && !newTags.branch) {
      const newNames = gatherNames(newTags);
      const newSet = new Set([...newNames.primary, ...newNames.alternate]);
      const isMoved = newSet.has(origName);   // another tag holds the original name now

      if (!isMoved) {
        // Test name fragments, longest to shortest, to fit them into a "Name Branch" pattern.
        // e.g. "TUI ReiseCenter - Neuss Innenstadt" -> ["TUI", "ReiseCenter", "Neuss", "Innenstadt"]
        const nameParts = origName.split(/[\s\-\/,.]/);
        for (let split = nameParts.length; split > 0; split--) {
          const name = nameParts.slice(0, split).join(' ');  // e.g. "TUI ReiseCenter"
          const branch = nameParts.slice(split).join(' ');   // e.g. "Neuss Innenstadt"
          const nameHits = _nsi.matcher.match(k, v, name, loc);
          if (!nameHits || !nameHits.length) continue;    // no match, try next name fragment

          if (nameHits.some(hit => hit.itemID === itemID)) {   // matched the name fragment to the same itemID above
            if (branch) {
              if (notBranches.test(branch)) {   // "branch" was detected but is noise ("factory outlet", etc)
                newTags.name = origName;        // Leave `name` alone, this part of the name may be significant..
              } else {
                const branchHits = _nsi.matcher.match(k, v, branch, loc);
                if (branchHits && branchHits.length) {                                             // if "branch" matched something else in NSI..
                  if (branchHits[0].match === 'primary' || branchHits[0].match === 'alternate') {  // if another brand! (e.g. "KFC - Taco Bell"?)
                    return null;                                                                   //   bail out - can't suggest tags in this case
                  }                                                                                // else a generic (e.g. "gas", "cafe") - ignore
                } else {                     // "branch" is not noise and not something in NSI
                  newTags.branch = branch;   // Stick it in the `branch` tag..
                }
              }
            }
            break;
          }
        }
      }
    }

    return { newTags: newTags, matched: item };
  }

  return changed ? { newTags: newTags, matched: null } : null;
}


// `_isGenericName()`
// Is the `name` tag generic?
//
// Arguments
//   `tags`: `Object` containing the feature's OSM tags
// Returns
//   `true` if it is generic, `false` if not
//
function _isGenericName(tags) {
  const n = tags.name;
  if (!n) return false;

  // tryNames just contains the `name` tag value and nothing else
  const tryNames = { primary: new Set([n]), alternate: new Set() };

  // Gather key/value tag pairs to try to match
  const tryKVs = gatherKVs(tags);
  if (!tryKVs.primary.size && !tryKVs.alternate.size)  return false;

  // Order the [key,value,name] tuples - test primary before alternate
  const tuples = gatherTuples(tryKVs, tryNames);

  for (let i = 0; i < tuples.length; i++) {
    const tuple = tuples[i];
    const hits = _nsi.matcher.match(tuple.k, tuple.v, tuple.n);   // Attempt to match an item in NSI

    // If we get a `excludeGeneric` hit, this is a generic name.
    if (hits && hits.length && hits[0].match === 'excludeGeneric') return true;
  }

  return false;
}



// PUBLIC INTERFACE

export default {

  // `init()`
  // On init, start preparing the name-suggestion-index
  //
  init: () => {
    // Note: service.init is called immediately after the presetManager has started loading its data.
    // We expect to chain onto an unfulfilled promise here.
    setNsiSources();
    presetManager.ensureLoaded()
      .then(() => loadNsiPresets())
      .then(() => loadNsiData())
      .then(() => _nsiStatus = 'ok')
      .catch(() => _nsiStatus = 'failed');
  },


  // `reset()`
  // Reset is called when user saves data to OSM (does nothing here)
  //
  reset: () => {},


  // `status()`
  // To let other code know how it's going...
  //
  // Returns
  //   `String`: 'loading', 'ok', 'failed'
  //
  status: () => _nsiStatus,


  // `isGenericName()`
  // Is the `name` tag generic?
  //
  // Arguments
  //   `tags`: `Object` containing the feature's OSM tags
  // Returns
  //   `true` if it is generic, `false` if not
  //
  isGenericName: (tags) => _isGenericName(tags),


  // `upgradeTags()`
  // Suggest tag upgrades.
  // This function will not modify the input tags, it makes a copy.
  //
  // Arguments
  //   `tags`: `Object` containing the feature's OSM tags
  //   `loc`: Location where this feature exists, as a [lon, lat]
  // Returns
  //   `Object` containing the result, or `null` if no changes needed:
  //   {
  //     'newTags': `Object` - The tags the the feature should have
  //     'matched': `Object` - The matched item
  //   }
  //
  upgradeTags: (tags, loc) => _upgradeTags(tags, loc),


  // `cache()`
  // Direct access to the NSI cache, useful for testing or breaking things
  //
  // Returns
  //   `Object`: the internal NSI cache
  //
  cache: () => _nsi
};
