import { actionChangeTags } from '../actions/change_tags';
import { presetManager, type presetPreset } from '../presets';
import { services } from '../services';
import { t, localizer } from '../core/localizer';
import { validationIssue, validationIssueFix } from '../core/validation';
import type { CreateValidator, validationIssueList, Validator } from '../core/validation/models';
import type { EntityId } from '../osm';


export const validationSuspiciousName: CreateValidator = (context) => {
  const type = 'suspicious_name';
  const keysToTestForGenericValues = [
    'aerialway', 'aeroway', 'amenity', 'building', 'craft', 'highway',
    'leisure', 'railway', 'man_made', 'office', 'shop', 'tourism', 'waterway'
  ];
  const ignoredPresets = new Set([
    'amenity/place_of_worship/christian/jehovahs_witness',
    '__test__ignored_preset' // for unit tests
  ]);
  let _waitingForNsi = false;


  // Attempt to match a generic record in the name-suggestion-index.
  function isGenericMatchInNsi(tags: Tags) {
    const nsi = services.nsi;
    if (nsi) {
      _waitingForNsi = (nsi.status() === 'loading');
      if (!_waitingForNsi) {
        return nsi.isGenericName(tags);
      }
    }
    return false;
  }


  // Test if the name is just the key or tag value (e.g. "park")
  function nameMatchesRawTag(lowercaseName: string, tags: Tags) {
    for (let i = 0; i < keysToTestForGenericValues.length; i++) {
      let key = keysToTestForGenericValues[i];
      let val = tags[key];
      if (val) {
        val = val.toLowerCase();
        if (key === lowercaseName ||
          val === lowercaseName ||
          key.replace(/\_/g, ' ') === lowercaseName ||
          val.replace(/\_/g, ' ') === lowercaseName) {
          return true;
        }
      }
    }
    return false;
  }

  function nameMatchesPresetName(name: string, preset: presetPreset) {
    if (!preset) return false;
    if (ignoredPresets.has(preset.id)) return false;

    name = name.toLowerCase();
    return name === preset.name().toLowerCase() || preset.aliases().some(alias => name === alias.toLowerCase());
  }

  function isGenericName(name: string, tags: Tags, preset: presetPreset) {
    name = name.toLowerCase();
    return nameMatchesRawTag(name, tags) || nameMatchesPresetName(name, preset) || isGenericMatchInNsi(tags);
  }

  function makeGenericNameIssue(entityId: EntityId, nameKey: TagKey, genericName: string, langCode: string | undefined | null) {
    return new validationIssue({
      type: type,
      subtype: 'generic_name',
      severity: 'warning',
      message: function(context) {
        let entity = context.hasEntity(this.entityIds[0]);
        if (!entity) return '';
        let preset = presetManager.match(entity, context.graph());
        let langName = langCode && localizer.languageName(langCode);
        return t.append('issues.generic_name.message' + (langName ? '_language' : ''),
          { feature: preset.name(), name: genericName, language: langName }
        );
      },
      reference: showReference,
      entityIds: [entityId],
      hash: `${nameKey}=${genericName}`,
      dynamicFixes: function() {
        return [
          new validationIssueFix({
            icon: 'iD-operation-delete',
            title: t.append('issues.fix.remove_the_name.title'),
            onClick: function(context) {
              let entityId = this.issue!.entityIds[0];
              let entity = context.entity(entityId);
              let tags = { ...entity.tags };   // shallow copy
              delete tags[nameKey];
              context.perform(
                actionChangeTags(entityId, tags), t('issues.fix.remove_generic_name.annotation')
              );
            }
          })
        ];
      }
    });

    function showReference(selection: d3.Selection) {
      selection.selectAll('.issue-reference')
        .data([0])
        .enter()
        .append('div')
        .attr('class', 'issue-reference')
        .call(t.append('issues.generic_name.reference'));
    }
  }

  const validation: Validator = function checkGenericName(entity) {
    const tags = entity.tags;

    // a generic name is allowed if it's a known brand or entity
    const hasWikidata = (!!tags.wikidata || !!tags['brand:wikidata'] || !!tags['operator:wikidata']);
    if (hasWikidata) return [];

    let issues: validationIssueList = [];

    const preset = presetManager.match(entity, context.graph());

    for (let key in tags) {
      const m = key.match(/^name(?:(?::)([a-zA-Z_-]+))?$/);
      if (!m) continue;

      const langCode = m.length >= 2 ? m[1] : null;
      const value = tags[key];

      if (isGenericName(value, tags, preset)) {
        issues.provisional = _waitingForNsi;  // retry later if we are waiting on NSI to finish loading
        issues.push(makeGenericNameIssue(entity.id, key, value, langCode));
      }
    }

    return issues;
  };


  validation.type = type;

  return validation;
};
