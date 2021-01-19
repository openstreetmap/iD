import { t } from '../core/localizer';
import { matcher as Matcher } from 'name-suggestion-index';

import { fileFetcher, locationManager } from '../core';
import { actionChangePreset } from '../actions/change_preset';
import { actionChangeTags } from '../actions/change_tags';
import { actionUpgradeTags } from '../actions/upgrade_tags';
import { presetManager } from '../presets';
import { osmIsOldMultipolygonOuterMember, osmOldMultipolygonOuterMemberOfRelation } from '../osm/multipolygon';
import { utilArrayUniq, utilDisplayLabel, utilTagDiff } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


let _dataDeprecated;
let _nsi;

export function validationOutdatedTags() {
  const type = 'outdated_tags';

  // A concern here in switching to async data means that `_dataDeprecated`
  // and `_nsi` will not be available at first, so the data on early tiles
  // may not have tags validated fully.

  // fetch deprecated tags
  fileFetcher.get('deprecated')
    .then(d => _dataDeprecated = d)
    .catch(() => { /* ignore */ });


  function delay(msec) {
    return new Promise(resolve => {
      window.setTimeout(resolve, msec);
    });
  }

  // This Promise will fulfill after NSI presets are loaded and locations merged into the locationManager.
  function waitForNSIPresets() {
    return Promise.all([
      fileFetcher.get('nsi_presets'),
      fileFetcher.get('nsi_features')
    ])
    .then(() => delay(1000))  // wait 1 sec for locationSets to enter the locationManager queue
    .then(() => locationManager.mergeLocationSets([]) );
  }

  // Fetch the name-suggestion-index data
  waitForNSIPresets()
    .then(() => Promise.all([
      fileFetcher.get('nsi_data'),
      fileFetcher.get('nsi_replacements'),
      fileFetcher.get('nsi_trees')
    ]))
    .then(vals => {
      if (_nsi) return _nsi;

      _nsi = {
        data:          vals[0].nsi,            // the raw name-suggestion-index data
        replacements:  vals[1].replacements,   // trivial old->new qid replacements
        trees:         vals[2].trees,          // metadata about trees, main tags
        keys:          new Set(),              // primary osm keys to check for a NSI match
        qids:          new Map(),              // Map wd/wp tag values -> qids
        ids:           new Map()               // Map id -> NSI item
      };

      _nsi.matcher = Matcher();
      _nsi.matcher.buildMatchIndex(_nsi.data);
      _nsi.matcher.buildLocationIndex(_nsi.data, locationManager.loco());

      Object.keys(_nsi.data).forEach(tkv => {
        const parts = tkv.split('/', 3);     // tkv = "tree/key/value"
        const t = parts[0];
        const k = parts[1];

        // Collect primary keys  (e.g. "amenity", "craft", "shop", "man_made", "route", etc)
        _nsi.keys.add(k);

        const tree = _nsi.trees[t];     // e.g. "brands", "operators"
        const mainTag = tree.mainTag;   // e.g. "brand:wikidata", "operator:wikidata", etc

        const items = _nsi.data[tkv] || [];
        items.forEach(item => {
          // Cache NSI ids and main tags
          item.mainTag = mainTag;
          _nsi.ids.set(item.id, item);

          // Cache Wikidata/Wikipedia values, for #6416
          const wd = item.tags[mainTag];
          const wp = item.tags[mainTag.replace('wikidata', 'wikipedia')];
          if (wd)         _nsi.qids.set(wd, wd);
          if (wp && wd)   _nsi.qids.set(wp, wd);
        });
      });

      _nsi.keys.add('building');  // fallback can match building=* for some categories

      return _nsi;
    })
    .catch(() => { /* ignore */ });


  // Returns true if this tag key is a "namelike" tag that the NSI matcher would have indexed..
  function isNamelike(k) {
    const namePatterns = [
      /^(flag:)?name$/i,                                             // e.g. `name`, `flag:name`
      /^(brand|country|flag|operator|network|subject)$/i,
      /^\w+_name$/i,                                                 // e.g. `alt_name`, `short_name`
      /^(name|brand|country|flag|operator|network|subject):\w+$/i,   // e.g. `name:en`, `name:ru`
      /^\w+_name:\w+$/i                                              // e.g. `alt_name:en`, `short_name:ru`
    ];

    return namePatterns.some(pattern => {
      if (!pattern.test(k)) return false;    // k is not a name tag, skip

      // There are a few exceptions to the namelike regexes.
      // Usually a tag suffix contains a language code like `name:en`, `name:ru`
      // but we want to exclude things like `operator:type`, `name:etymology`, etc..
      if (/:(colour|type|left|right|etymology|pronunciation|wikipedia)$/.test(k)) return false;

      return true;
    });
  }


  function oldTagIssues(entity, graph) {
    const oldTags = Object.assign({}, entity.tags);  // shallow copy
    let preset = presetManager.match(entity, graph);
    let subtype = 'deprecated_tags';
    if (!preset) return [];

    // Upgrade preset, if a replacement is available..
    if (preset.replacement) {
      const newPreset = presetManager.item(preset.replacement);
      graph = actionChangePreset(entity.id, preset, newPreset, true /* skip field defaults */)(graph);
      entity = graph.entity(entity.id);
      preset = newPreset;
    }

    // Upgrade deprecated tags..
    if (_dataDeprecated) {
      const deprecatedTags = entity.deprecatedTags(_dataDeprecated);
      if (deprecatedTags.length) {
        deprecatedTags.forEach(tag => {
          graph = actionUpgradeTags(entity.id, tag.old, tag.replace)(graph);
        });
        entity = graph.entity(entity.id);
      }
    }

    // Add missing addTags from the detected preset
    let newTags = Object.assign({}, entity.tags);  // shallow copy
    if (preset.tags !== preset.addTags) {
      Object.keys(preset.addTags).forEach(k => {
        if (!newTags[k]) {
          if (preset.addTags[k] === '*') {
            newTags[k] = 'yes';
          } else {
            newTags[k] = preset.addTags[k];
          }
        }
      });
    }

    // Attempt to match a canonical record in the name-suggestion-index.
    // This index contains the most correct tagging for many commonly mapped features.
    // See https://github.com/osmlab/name-suggestion-index  and https://nsi.guide
    if (_nsi) {

      // Perform trivial Wikipedia/Wikidata replacements
      Object.keys(newTags).forEach(osmkey => {
        const matchTag = osmkey.match(/^(\w+:)?wikidata$/);
        if (matchTag) {                         // Look at '*:wikidata' tags
          const prefix = (matchTag[1] || '');
          const wd = newTags[osmkey];
          const replace = _nsi.replacements[wd];    // If it matches a QID in the replacement list...

          if (replace && replace.wikidata !== undefined) {   // replace or delete `*:wikidata` tag
            if (replace.wikidata) {
              newTags[osmkey] = replace.wikidata;
            } else {
              delete newTags[osmkey];
            }
          }
          if (replace && replace.wikipedia !== undefined) {  // replace or delete `*:wikipedia` tag
            const wpkey = `${prefix}wikipedia`;
            if (replace.wikipedia) {
              newTags[wpkey] = replace.wikipedia;
            } else {
              delete newTags[wpkey];
            }
          }
        }
      });

      // Do `wikidata` or `wikipedia` tags identify this entity as a chain?  #6416
      // If so, these tags can be swapped to e.g. `brand:wikidata`/`brand:wikipedia` below.
      let foundQID = _nsi.qids.get(newTags.wikidata) || _nsi.qids.get(newTags.wikipedia);

      // We will only spend time to compute these things if it's necessary
      let names, loc, match;

      // Try each primary key ("amenity", "craft", "shop", "man_made", "route", etc)
      const nsiKeys = Array.from(_nsi.keys);
      for (let i = 0; i < nsiKeys.length; i++) {
        if (match) break;  // matched already, stop looking
        let k = nsiKeys[i];
        let v = newTags[k];
        if (!v) continue;

        // Only attempt a match on building/yes if there is nothing else remarkable about that building.
        if (k === 'building') {
          v = 'yes';
          if (preset.id !== 'building/yes') continue;  // the feature matched a better preset
        }

        if (!loc) {     // collect location for this feature only once
          loc = entity.extent(graph).center();
        }
        if (!names) {   // collect names for this feature only once
          names = Object.keys(newTags)
            .map(k => isNamelike(k) ? newTags[k] : null)
            .filter(Boolean);

          if (foundQID) names.unshift(foundQID);  // matcher will recognize the QID as a name too
          names = utilArrayUniq(names);
        }

        // Try each namelike value
        for (let n = 0; n < names.length; n++) {
          match = _nsi.matcher.match(k, v, names[n], loc);   // Attempt to match an item in NSI
          if (!match) continue;  // keep looking

          // If we get here, there was a match..
          // A match may contain multiple results, the first one is the best one for this location
          // e.g. `['pfk-a54c14', 'kfc-1ff19c', 'kfc-658eea']`
          const itemID = match[0].itemID;
          const item = _nsi.ids.get(itemID);
          const mainTag = item.mainTag;               // e.g. `brand:wikidata`
          const itemQID = item.tags[mainTag];         // e.g. `brand:wikidata` qid
          const notQID = newTags[`not:${mainTag}`];   // e.g. `not:brand:wikidata` qid

          // Exceptions, throw out the match
          if (
            (!itemQID || itemQID === notQID) ||       // no `*:wikidata` or matched a `not:*:wikidata`
            (newTags.office && !item.tags.office)     // feature may be a coprorate office for a brand? - #6416
          ) {
            match = null;   // forget match and keep looking
            continue;       // (it might make sense to stop looking, not sure)
          }

          // We are keeping the match at this point
          subtype = 'noncanonical_brand';

          // Preserve some tags values that we don't want NSI to overwrite.
          const keepTags = ['takeaway', 'building']
            .reduce((acc, k) => {
              if (newTags[k]) acc[k] = newTags[k];
              return acc;
            }, {});

          // Replace the primary tags with what's in NSI ("amenity", "craft", "shop", "man_made", "route", etc)
          nsiKeys.forEach(k => delete newTags[k]);
          // Replace `wikidata`/`wikipedia` with e.g. `brand:wikidata`/`brand:wikipedia`
          if (foundQID) {
            delete newTags.wikipedia;
            delete newTags.wikidata;
          }

          Object.assign(newTags, item.tags, keepTags);
          break;  // stop looking
        }
      }

      // maybe someday: match features without the location to determine
      // if a feature appears somewhere in the world that it shouldn't.

    }   // end if _nsi

    // determine diff
    const tagDiff = utilTagDiff(oldTags, newTags);
    if (!tagDiff.length) return [];

    const isOnlyAddingTags = tagDiff.every(d => d.type === '+');

    let prefix = '';
    if (subtype === 'noncanonical_brand') {
      prefix = 'noncanonical_brand.';
    } else if (subtype === 'deprecated_tags' && isOnlyAddingTags) {
      subtype = 'incomplete_tags';
      prefix = 'incomplete.';
    }

    // don't allow autofixing brand tags
    let autoArgs = subtype !== 'noncanonical_brand' ? [doUpgrade, t('issues.fix.upgrade_tags.annotation')] : null;

    return [new validationIssue({
      type: type,
      subtype: subtype,
      severity: 'warning',
      message: showMessage,
      reference: showReference,
      entityIds: [entity.id],
      hash: JSON.stringify(tagDiff),
      dynamicFixes: () => {
        return [
          new validationIssueFix({
            autoArgs: autoArgs,
            title: t.html('issues.fix.upgrade_tags.title'),
            onClick: (context) => {
              context.perform(doUpgrade, t('issues.fix.upgrade_tags.annotation'));
            }
          })
        ];
      }
    })];


    function doUpgrade(graph) {
      const currEntity = graph.hasEntity(entity.id);
      if (!currEntity) return graph;

      let newTags = Object.assign({}, currEntity.tags);  // shallow copy
      tagDiff.forEach(diff => {
        if (diff.type === '-') {
          delete newTags[diff.key];
        } else if (diff.type === '+') {
          newTags[diff.key] = diff.newVal;
        }
      });

      return actionChangeTags(currEntity.id, newTags)(graph);
    }


    function showMessage(context) {
      const currEntity = context.hasEntity(entity.id);
      if (!currEntity) return '';

      let messageID = `issues.outdated_tags.${prefix}message`;
      if (subtype === 'noncanonical_brand' && isOnlyAddingTags) {
        messageID += '_incomplete';
      }
      return t.html(messageID, { feature: utilDisplayLabel(currEntity, context.graph()) });
    }


    function showReference(selection) {
      let enter = selection.selectAll('.issue-reference')
        .data([0])
        .enter();

      enter
        .append('div')
        .attr('class', 'issue-reference')
        .html(t.html(`issues.outdated_tags.${prefix}reference`));

      enter
        .append('strong')
        .html(t.html('issues.suggested'));

      enter
        .append('table')
        .attr('class', 'tagDiff-table')
        .selectAll('.tagDiff-row')
        .data(tagDiff)
        .enter()
        .append('tr')
        .attr('class', 'tagDiff-row')
        .append('td')
        .attr('class', d => {
          let klass = d.type === '+' ? 'add' : 'remove';
          return `tagDiff-cell tagDiff-cell-${klass}`;
        })
        .html(d => d.display);
    }
  }


  function oldMultipolygonIssues(entity, graph) {
    let multipolygon, outerWay;
    if (entity.type === 'relation') {
      outerWay = osmOldMultipolygonOuterMemberOfRelation(entity, graph);
      multipolygon = entity;
    } else if (entity.type === 'way') {
      multipolygon = osmIsOldMultipolygonOuterMember(entity, graph);
      outerWay = entity;
    } else {
      return [];
    }

    if (!multipolygon || !outerWay) return [];

    return [new validationIssue({
      type: type,
      subtype: 'old_multipolygon',
      severity: 'warning',
      message: showMessage,
      reference: showReference,
      entityIds: [outerWay.id, multipolygon.id],
      dynamicFixes: () => {
        return [
          new validationIssueFix({
            autoArgs: [doUpgrade, t('issues.fix.move_tags.annotation')],
            title: t.html('issues.fix.move_tags.title'),
            onClick: (context) => {
              context.perform(doUpgrade, t('issues.fix.move_tags.annotation'));
            }
          })
        ];
      }
    })];


    function doUpgrade(graph) {
      let currMultipolygon = graph.hasEntity(multipolygon.id);
      let currOuterWay = graph.hasEntity(outerWay.id);
      if (!currMultipolygon || !currOuterWay) return graph;

      currMultipolygon = currMultipolygon.mergeTags(currOuterWay.tags);
      graph = graph.replace(currMultipolygon);
      return actionChangeTags(currOuterWay.id, {})(graph);
    }


    function showMessage(context) {
      let currMultipolygon = context.hasEntity(multipolygon.id);
      if (!currMultipolygon) return '';

      return t.html('issues.old_multipolygon.message',
          { multipolygon: utilDisplayLabel(currMultipolygon, context.graph()) }
      );
    }


    function showReference(selection) {
      selection.selectAll('.issue-reference')
        .data([0])
        .enter()
        .append('div')
        .attr('class', 'issue-reference')
        .html(t.html('issues.old_multipolygon.reference'));
    }
  }


  let validation = function checkOutdatedTags(entity, graph) {
    let issues = oldMultipolygonIssues(entity, graph);
    if (!issues.length) issues = oldTagIssues(entity, graph);
    return issues;
  };


  validation.type = type;

  return validation;
}
