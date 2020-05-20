import { t } from '../core/localizer';
import { matcher } from 'name-suggestion-index';
import * as countryCoder from '@ideditor/country-coder';

import { presetManager } from '../presets';
import { fileFetcher } from '../core/file_fetcher';
import { actionChangePreset } from '../actions/change_preset';
import { actionChangeTags } from '../actions/change_tags';
import { actionUpgradeTags } from '../actions/upgrade_tags';
import { osmIsOldMultipolygonOuterMember, osmOldMultipolygonOuterMemberOfRelation } from '../osm/multipolygon';
import { utilDisplayLabel, utilTagDiff } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


let _dataDeprecated;
let _nsi;

export function validationOutdatedTags() {
  const type = 'outdated_tags';
  const nsiKeys = ['amenity', 'shop', 'tourism', 'leisure', 'office'];

  // A concern here in switching to async data means that `_dataDeprecated`
  // and `_nsi` will not be available at first, so the data on early tiles
  // may not have tags validated fully.

  // initialize deprecated tags array
  fileFetcher.get('deprecated')
    .then(d => _dataDeprecated = d)
    .catch(() => { /* ignore */ });

  fileFetcher.get('nsi_brands')
    .then(d => {
      _nsi = {
        brands: d.brands,
        matcher: matcher(),
        wikidata: {},
        wikipedia: {}
      };

      // initialize name-suggestion-index matcher
      _nsi.matcher.buildMatchIndex(d.brands);

      // index all known wikipedia and wikidata tags
      Object.keys(d.brands).forEach(kvnd => {
        const brand = d.brands[kvnd];
        const wd = brand.tags['brand:wikidata'];
        const wp = brand.tags['brand:wikipedia'];
        if (wd) { _nsi.wikidata[wd] = kvnd; }
        if (wp) { _nsi.wikipedia[wp] = kvnd; }
      });

      return _nsi;
    })
    .catch(() => { /* ignore */ });


  function oldTagIssues(entity, graph) {
    const oldTags = Object.assign({}, entity.tags);  // shallow copy
    let preset = presetManager.match(entity, graph);
    let subtype = 'deprecated_tags';
    if (!preset) return [];

    // upgrade preset..
    if (preset.replacement) {
      const newPreset = presetManager.item(preset.replacement);
      graph = actionChangePreset(entity.id, preset, newPreset, true /* skip field defaults */)(graph);
      entity = graph.entity(entity.id);
      preset = newPreset;
    }

    // upgrade tags..
    if (_dataDeprecated) {
      const deprecatedTags = entity.deprecatedTags(_dataDeprecated);
      if (deprecatedTags.length) {
        deprecatedTags.forEach(tag => {
          graph = actionUpgradeTags(entity.id, tag.old, tag.replace)(graph);
        });
        entity = graph.entity(entity.id);
      }
    }

    // add missing addTags..
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

    if (_nsi) {
      // Do `wikidata` or `wikipedia` identify this entity as a brand?  #6416
      // If so, these tags can be swapped to `brand:wikidata`/`brand:wikipedia`
      let isBrand;
      if (newTags.wikidata) {                 // try matching `wikidata`
        isBrand = _nsi.wikidata[newTags.wikidata];
      }
      if (!isBrand && newTags.wikipedia) {    // fallback to `wikipedia`
        isBrand = _nsi.wikipedia[newTags.wikipedia];
      }
      if (isBrand && !newTags.office) {       // but avoid doing this for corporate offices
        if (newTags.wikidata) {
          newTags['brand:wikidata'] = newTags.wikidata;
          delete newTags.wikidata;
        }
        if (newTags.wikipedia) {
          newTags['brand:wikipedia'] = newTags.wikipedia;
          delete newTags.wikipedia;
        }
        // I considered setting `name` and other tags here, but they aren't unique per wikidata
        // (Q2759586 -> in USA "Papa John's", in Russia "Папа Джонс")
        // So users will really need to use a preset or assign `name` themselves.
      }

      // try key/value|name match against name-suggestion-index
      if (newTags.name) {
        for (let i = 0; i < nsiKeys.length; i++) {
          const k = nsiKeys[i];
          if (!newTags[k]) continue;

          const center = entity.extent(graph).center();
          const countryCode = countryCoder.iso1A2Code(center);
          const match = _nsi.matcher.matchKVN(k, newTags[k], newTags.name, countryCode && countryCode.toLowerCase());
          if (!match) continue;

          // for now skip ambiguous matches (like Target~(USA) vs Target~(Australia))
          if (match.d) continue;

          const brand = _nsi.brands[match.kvnd];
          if (brand && brand.tags['brand:wikidata'] &&
            brand.tags['brand:wikidata'] !== entity.tags['not:brand:wikidata']) {
            subtype = 'noncanonical_brand';

            const keepTags = ['takeaway'].reduce((acc, k) => {
              if (newTags[k]) {
                acc[k] = newTags[k];
              }
              return acc;
            }, {});

            nsiKeys.forEach(k => delete newTags[k]);
            Object.assign(newTags, brand.tags, keepTags);
            break;
          }
        }
      }
    }

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
            title: t('issues.fix.upgrade_tags.title'),
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
      return t(messageID, { feature: utilDisplayLabel(currEntity, context.graph()) });
    }


    function showReference(selection) {
      let enter = selection.selectAll('.issue-reference')
        .data([0])
        .enter();

      enter
        .append('div')
        .attr('class', 'issue-reference')
        .text(t(`issues.outdated_tags.${prefix}reference`));

      enter
        .append('strong')
        .text(t('issues.suggested'));

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
        .text(d => d.display);
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
            title: t('issues.fix.move_tags.title'),
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

      return t('issues.old_multipolygon.message',
          { multipolygon: utilDisplayLabel(currMultipolygon, context.graph()) }
      );
    }


    function showReference(selection) {
      selection.selectAll('.issue-reference')
        .data([0])
        .enter()
        .append('div')
        .attr('class', 'issue-reference')
        .text(t('issues.old_multipolygon.reference'));
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
