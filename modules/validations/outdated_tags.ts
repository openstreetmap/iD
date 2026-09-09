import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';

import { actionChangePreset } from '../actions/change_preset';
import { actionChangeTags } from '../actions/change_tags';
import { actionUpgradeTags } from '../actions/upgrade_tags';
import { fileFetcher, type coreGraph } from '../core';
import { presetManager } from '../presets';
import { services } from '../services';
import { utilArrayUniq, utilHashcode, utilTagDiff } from '../util';
import { utilSplitAtSemicolon, type TagDiff } from '../util/util';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';
import { getDeprecatedTags } from '../osm/deprecated';
import type { Deprecated } from '@openstreetmap/id-tagging-schema';
import type { CreateValidator, validationIssueList, Validator } from '../core/validation/models';


export const validationOutdatedTags: CreateValidator = () => {
  const type = 'outdated_tags';
  let _waitingForDeprecated = true;
  let _dataDeprecated: Deprecated;

  // fetch deprecated tags
  fileFetcher.get('deprecated')
    .then(d => _dataDeprecated = d)
    .catch(() => { /* ignore */ })
    .finally(() => _waitingForDeprecated = false);


  const validation: Validator = (entity, graph) => {
    if (!entity.hasInterestingTags()) return [];

    let preset = presetManager.match(entity, graph);
    if (!preset) return [];

    const oldTags = Object.assign({}, entity.tags);  // shallow copy

    // Upgrade preset, if a replacement is available..
    if (preset.replacement) {
      const newPreset = presetManager.item(preset.replacement)!;
      graph = actionChangePreset(entity.id, preset, newPreset, true /* skip field defaults */)(graph);
      entity = graph.entity(entity.id);
      preset = newPreset;
    }

    // Attempt to match a canonical record in the name-suggestion-index.
    const nsi = services.nsi;
    let waitingForNsi = false;
    let nsiResult: ReturnType<typeof nsi.upgradeTags> | undefined;
    if (nsi) {
      waitingForNsi = (nsi.status() === 'loading');
      if (!waitingForNsi) {
        const loc = entity.extent(graph).center();
        nsiResult = nsi.upgradeTags(oldTags, loc);
      }
    }
    const nsiDiff = nsiResult ? utilTagDiff(oldTags, nsiResult.newTags) : [];

    // Upgrade deprecated tags
    let deprecatedTags: Deprecated | undefined;
    if (_dataDeprecated) {
      deprecatedTags = getDeprecatedTags(entity.tags, _dataDeprecated);
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
        });
        entity = graph.entity(entity.id);
      }
    }

    // Add missing addTags from the detected preset
    let newTags = { ...entity.tags };  // shallow copy
    if (preset.tags !== preset.addTags) {
      Object.keys(preset.addTags).filter(k => {
        // if nsi suggestion already includes this tag: don't repeat it in "incomplete tags"
        return !nsiResult?.newTags[k];
      }).forEach(k => {
        if (!newTags[k]) {
          if (preset.addTags[k] === '*') {
            newTags[k] = 'yes';
          } else if (preset.addTags[k]) {
            newTags[k] = preset.addTags[k];
          }
        }
      });
    }
    const deprecationDiffContext = Object.keys(oldTags)
        .filter(key => deprecatedTags?.some(deprecated => deprecated.replace?.[key] !== undefined))
        .filter(key => newTags[key] === oldTags[key]);
    const deprecationDiff = utilTagDiff(oldTags, newTags, deprecationDiffContext);

    let issues: validationIssueList = [];
    issues.provisional = (_waitingForDeprecated || waitingForNsi);

    if (deprecationDiff.some(d => d.type !== '~')) {
      const isOnlyAddingTags = !deprecationDiff.some(d => d.type === '-');
      const prefix = isOnlyAddingTags ? 'incomplete.' : '';

      issues.push(new validationIssue({
        type: type,
        subtype: isOnlyAddingTags ? 'incomplete_tags' : 'deprecated_tags',
        severity: 'warning',
        message: (context) => {
          const currEntity = context.hasEntity(entity.id);
          if (!currEntity) return '';

          const feature = utilDisplayLabel(currEntity, context.graph(), /* verbose */ true);

          return t.append(`issues.outdated_tags.${prefix}message`, { feature });
        },
        reference: selection => showTagDiffReference(
          selection,
          t.append(`issues.outdated_tags.${prefix}reference`),
          deprecationDiff
        ),
        entityIds: [entity.id],
        hash: utilHashcode(JSON.stringify(deprecationDiff)),
        dynamicFixes: () => {
          let fixes = [
            new validationIssueFix({
              title: t.append('issues.fix.upgrade_tags.title'),
              onClick: (context) => {
                context.perform(graph => doUpgrade(graph, deprecationDiff), t('issues.fix.upgrade_tags.annotation'));
              }
            })
          ];
          return fixes;
        }
      }));
    }

    if (nsiDiff.length) {
      const isOnlyAddingTags = nsiDiff.every(d => d.type === '+');

      issues.push(new validationIssue({
        type: type,
        subtype: 'noncanonical_brand',
        severity: 'warning',
        message: (context) => {
          const currEntity = context.hasEntity(entity.id);
          if (!currEntity) return '';

          const feature = utilDisplayLabel(currEntity, context.graph(), /* verbose */ true);

          return isOnlyAddingTags
            ? t.append('issues.outdated_tags.noncanonical_brand.message_incomplete', { feature })
            : t.append('issues.outdated_tags.noncanonical_brand.message', { feature });
        },
        reference: selection => showTagDiffReference(
          selection,
          t.append('issues.outdated_tags.noncanonical_brand.reference'),
          nsiDiff
        ),
        entityIds: [entity.id],
        hash: utilHashcode(JSON.stringify(nsiDiff)),
        dynamicFixes: () => {
          let fixes = [
            new validationIssueFix({
              title: t.append('issues.fix.upgrade_tags.title'),
              onClick: (context) => {
                context.perform(graph => doUpgrade(graph, nsiDiff), t('issues.fix.upgrade_tags.annotation'));
              }
            }),
            new validationIssueFix({
              title: t.append('issues.fix.tag_as_not.title', { name: nsiResult!.matched!.displayName }),
              onClick: (context) => {
                context.perform(addNotTag, t('issues.fix.tag_as_not.annotation'));
              }
            })
          ];
          return fixes;
        }
      }));
    }

    return issues;


    function doUpgrade(graph: coreGraph, diff: TagDiff[]) {
      const currEntity = graph.hasEntity(entity.id);
      if (!currEntity) return graph;

      let newTags = { ...currEntity.tags };  // shallow copy
      diff.forEach(diff => {
        if (diff.type === '-') {
          delete newTags[diff.key];
        } else if (diff.type === '+') {
          newTags[diff.key] = diff.newVal;
        }
      });

      return actionChangeTags(currEntity.id, newTags)(graph);
    }


    function addNotTag(graph: coreGraph) {
      const currEntity = graph.hasEntity(entity.id);
      if (!currEntity) return graph;

      const item = nsiResult && nsiResult.matched;
      if (!item) return graph;

      let newTags = { ...currEntity.tags };  // shallow copy
      const wd = item.mainTag;     // e.g. `brand:wikidata`
      const notwd = `not:${wd}`;   // e.g. `not:brand:wikidata`
      const qid = item.tags[wd];
      if (newTags[notwd]) {
        newTags[notwd] = utilArrayUniq([
            ...utilSplitAtSemicolon(newTags[notwd]),
            qid,
        ]).join(';');
      } else {
        newTags[notwd] = qid;
      }

      if (newTags[wd] === qid) {   // if `brand:wikidata` was set to that qid
        const wp = item.mainTag.replace('wikidata', 'wikipedia');
        delete newTags[wd];        // remove `brand:wikidata`
        delete newTags[wp];        // remove `brand:wikipedia`
      }

      return actionChangeTags(currEntity.id, newTags)(graph);
    }
  };
  validation.type = type;

  return validation;
};

export function showTagDiffReference(selection: d3.Selection, reference: d3.Selector, tagDiff: TagDiff[]) {
    let enter = selection.selectAll('.issue-reference')
    .data([0])
    .enter();

    enter
    .append('div')
    .attr('class', 'issue-reference')
    .call(reference);

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
        const klass = 'tagDiff-cell';
        switch (d.type) {
        case '+':
            return `${klass} tagDiff-cell-add`;
        case '-':
            return `${klass} tagDiff-cell-remove`;
        default:
            return `${klass} tagDiff-cell-unchanged`;
        }
    })
    .each(function(d) {
        d3_select<HTMLElement, unknown>(this).call(d.render);
    });
}
