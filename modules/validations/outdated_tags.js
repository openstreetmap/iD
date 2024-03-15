import { t } from '../core/localizer';

import { actionChangePreset } from '../actions/change_preset';
import { actionChangeTags } from '../actions/change_tags';
import { actionUpgradeTags } from '../actions/upgrade_tags';
import { fileFetcher } from '../core';
import { presetManager } from '../presets';
import { services } from '../services';
import { utilDisplayLabel, utilHashcode, utilTagDiff } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationOutdatedTags() {
  const type = 'outdated_tags';
  let _waitingForDeprecated = true;
  let _dataDeprecated;

  // fetch deprecated tags
  fileFetcher.get('deprecated')
    .then(d => _dataDeprecated = d)
    .catch(() => { /* ignore */ })
    .finally(() => _waitingForDeprecated = false);


  function oldTagIssues(entity, graph) {
    if (!entity.hasInterestingTags()) return [];

    let preset = presetManager.match(entity, graph);
    if (!preset) return [];

    const oldTags = Object.assign({}, entity.tags);  // shallow copy
    let subtype = 'deprecated_tags';

    // Upgrade preset, if a replacement is available..
    if (preset.replacement) {
      const newPreset = presetManager.item(preset.replacement);
      graph = actionChangePreset(entity.id, preset, newPreset, true /* skip field defaults */)(graph);
      entity = graph.entity(entity.id);
      preset = newPreset;
    }

    const upgradeReasons = [];

    // Upgrade deprecated tags..
    if (_dataDeprecated) {
      const deprecatedTags = entity.deprecatedTags(_dataDeprecated);
      if (entity.type === 'way' && entity.isClosed() &&
          entity.tags.traffic_calming === 'island' && !entity.tags.highway) {
        // https://github.com/openstreetmap/id-tagging-schema/issues/1162#issuecomment-2000356902
        deprecatedTags.push({
          old: {traffic_calming: 'island'},
          replace: {'area:highway': 'traffic_island'}
        });
      }
      if (deprecatedTags.length) {
        deprecatedTags.forEach(tag => {
          graph = actionUpgradeTags(entity.id, tag.old, tag.replace)(graph);
          upgradeReasons.push({
            source: 'id-tagging-schema--deprecated',
            data: tag
          });
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
          } else if (preset.addTags[k]) {
            newTags[k] = preset.addTags[k];
          }
          upgradeReasons.push({
            source: 'id-tagging-schema--preset-addTags',
            data: preset
          });
        }
      });
    }

    // Attempt to match a canonical record in the name-suggestion-index.
    const nsi = services.nsi;
    let waitingForNsi = false;
    let nsiResult;
    if (nsi) {
      waitingForNsi = (nsi.status() === 'loading');
      if (!waitingForNsi) {
        const loc = entity.extent(graph).center();
        nsiResult = nsi.upgradeTags(newTags, loc);
        if (nsiResult) {
          newTags = nsiResult.newTags;
          subtype = 'noncanonical_brand';
          upgradeReasons.push({
            source: 'name-suggestion-index',
            data: nsiResult
          });
        }
      }
    }

    let issues = [];
    issues.provisional = (_waitingForDeprecated || waitingForNsi);

    // determine diff
    const tagDiff = utilTagDiff(oldTags, newTags);
    if (!tagDiff.length) return issues;

    const isOnlyAddingTags = tagDiff.every(d => d.type === '+');

    let prefix = '';
    if (nsiResult) {
      prefix = 'noncanonical_brand.';
    } else if (subtype === 'deprecated_tags' && isOnlyAddingTags) {
      subtype = 'incomplete_tags';
      prefix = 'incomplete.';
    }

    // don't allow autofixing brand tags
    let autoArgs = subtype !== 'noncanonical_brand' ? [doUpgrade, t('issues.fix.upgrade_tags.annotation')] : null;

    issues.push(new validationIssue({
      type: type,
      subtype: subtype,
      severity: 'warning',
      message: showMessage,
      reference: showReference,
      entityIds: [entity.id],
      hash: utilHashcode(JSON.stringify(tagDiff)),
      dynamicFixes: () => {
        let fixes = [
          new validationIssueFix({
            autoArgs: autoArgs,
            title: t.append('issues.fix.upgrade_tags.title'),
            onClick: (context) => {
              context.perform(doUpgrade, t('issues.fix.upgrade_tags.annotation'));
            }
          })
        ];

        const item = nsiResult && nsiResult.matched;
        if (item) {
          fixes.push(
            new validationIssueFix({
              title: t.append('issues.fix.tag_as_not.title', { name: item.displayName }),
              onClick: (context) => {
                context.perform(addNotTag, t('issues.fix.tag_as_not.annotation'));
              }
            })
          );
        }
        return fixes;

      }
    }));
    return issues;


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


    function addNotTag(graph) {
      const currEntity = graph.hasEntity(entity.id);
      if (!currEntity) return graph;

      const item = nsiResult && nsiResult.matched;
      if (!item) return graph;

      let newTags = Object.assign({}, currEntity.tags);  // shallow copy
      const wd = item.mainTag;     // e.g. `brand:wikidata`
      const notwd = `not:${wd}`;   // e.g. `not:brand:wikidata`
      const qid = item.tags[wd];
      newTags[notwd] = qid;

      if (newTags[wd] === qid) {   // if `brand:wikidata` was set to that qid
        const wp = item.mainTag.replace('wikidata', 'wikipedia');
        delete newTags[wd];        // remove `brand:wikidata`
        delete newTags[wp];        // remove `brand:wikipedia`
      }

      return actionChangeTags(currEntity.id, newTags)(graph);
    }


    function showMessage(context) {
      const currEntity = context.hasEntity(entity.id);
      if (!currEntity) return '';

      let messageID = `issues.outdated_tags.${prefix}message`;
      if (subtype === 'noncanonical_brand' && isOnlyAddingTags) {
        messageID += '_incomplete';
      }
      return t.append(messageID, {
        feature: utilDisplayLabel(currEntity, context.graph(), true /* verbose */)
      });
    }


    function showReference(selection) {
      let enter = selection.selectAll('.issue-reference')
        .data([0])
        .enter();

      enter
        .append('div')
        .attr('class', 'issue-reference')
        .call(t.append(`issues.outdated_tags.${prefix}reference`));

      enter
        .append('strong')
        .call(t.append('issues.suggested'));

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


  let validation = oldTagIssues;

  validation.type = type;

  return validation;
}
