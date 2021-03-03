import { t } from '../core/localizer';

import { actionChangePreset } from '../actions/change_preset';
import { actionChangeTags } from '../actions/change_tags';
import { actionUpgradeTags } from '../actions/upgrade_tags';
import { fileFetcher } from '../core';
import { presetManager } from '../presets';
import { services } from '../services';
import { osmIsOldMultipolygonOuterMember, osmOldMultipolygonOuterMemberOfRelation } from '../osm/multipolygon';
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
    const oldTags = Object.assign({}, entity.tags);  // shallow copy
    let preset = presetManager.match(entity, graph);
    let subtype = 'deprecated_tags';
    if (!preset) return [];
    if (!entity.hasInterestingTags()) return [];

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
    const nsi = services.nsi;
    let waitingForNsi = false;
    if (nsi) {
      waitingForNsi = (nsi.status() === 'loading');
      if (!waitingForNsi) {
        const loc = entity.extent(graph).center();
        const result = nsi.upgradeTags(newTags, loc);
        if (result) {
          newTags = result;
          subtype = 'noncanonical_brand';
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
    if (subtype === 'noncanonical_brand') {
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
