import { actionChangeTags } from '../actions/change_tags';
import { presetManager } from '../presets';
import { services } from '../services';
import { t, localizer } from '../core/localizer';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationSuspiciousName() {
  const type = 'suspicious_name';
  const keysToTestForGenericValues = [
    'aerialway', 'aeroway', 'amenity', 'building', 'craft', 'highway',
    'leisure', 'railway', 'man_made', 'office', 'shop', 'tourism', 'waterway'
  ];
  let _waitingForNsi = false;


  // Attempt to match a generic record in the name-suggestion-index.
  function isGenericMatchInNsi(tags) {
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
  function nameMatchesRawTag(lowercaseName, tags) {
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

  function isGenericName(name, tags) {
    name = name.toLowerCase();
    return nameMatchesRawTag(name, tags) || isGenericMatchInNsi(tags);
  }

  function makeGenericNameIssue(entityId, nameKey, genericName, langCode) {
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
              let entityId = this.issue.entityIds[0];
              let entity = context.entity(entityId);
              let tags = Object.assign({}, entity.tags);   // shallow copy
              delete tags[nameKey];
              context.perform(
                actionChangeTags(entityId, tags), t('issues.fix.remove_generic_name.annotation')
              );
            }
          })
        ];
      }
    });

    function showReference(selection) {
      selection.selectAll('.issue-reference')
        .data([0])
        .enter()
        .append('div')
        .attr('class', 'issue-reference')
        .call(t.append('issues.generic_name.reference'));
    }
  }

  function makeIncorrectNameIssue(entityId, nameKey, incorrectName, langCode) {
    return new validationIssue({
      type: type,
      subtype: 'not_name',
      severity: 'warning',
      message: function(context) {
        const entity = context.hasEntity(this.entityIds[0]);
        if (!entity) return '';
        const preset = presetManager.match(entity, context.graph());
        const langName = langCode && localizer.languageName(langCode);
        return t.append('issues.incorrect_name.message' + (langName ? '_language' : ''),
          { feature: preset.name(), name: incorrectName, language: langName }
        );
      },
      reference: showReference,
      entityIds: [entityId],
      hash: `${nameKey}=${incorrectName}`,
      dynamicFixes: function() {
        return [
          new validationIssueFix({
            icon: 'iD-operation-delete',
            title: t.append('issues.fix.remove_the_name.title'),
            onClick: function(context) {
              const entityId = this.issue.entityIds[0];
              const entity = context.entity(entityId);
              let tags = Object.assign({}, entity.tags);   // shallow copy
              delete tags[nameKey];
              context.perform(
                actionChangeTags(entityId, tags), t('issues.fix.remove_mistaken_name.annotation')
              );
            }
          })
        ];
      }
    });

    function showReference(selection) {
      selection.selectAll('.issue-reference')
        .data([0])
        .enter()
        .append('div')
        .attr('class', 'issue-reference')
        .call(t.append('issues.generic_name.reference'));
    }
  }


  let validation = function checkGenericName(entity) {
    const tags = entity.tags;

    // a generic name is allowed if it's a known brand or entity
    const hasWikidata = (!!tags.wikidata || !!tags['brand:wikidata'] || !!tags['operator:wikidata']);
    if (hasWikidata) return [];

    let issues = [];
    const notNames = (tags['not:name'] || '').split(';');

    for (let key in tags) {
      const m = key.match(/^name(?:(?::)([a-zA-Z_-]+))?$/);
      if (!m) continue;

      const langCode = m.length >= 2 ? m[1] : null;
      const value = tags[key];
      if (notNames.length) {
        for (let i in notNames) {
          const notName = notNames[i];
          if (notName && value === notName) {
            issues.push(makeIncorrectNameIssue(entity.id, key, value, langCode));
            continue;
          }
        }
      }
      if (isGenericName(value, tags)) {
        issues.provisional = _waitingForNsi;  // retry later if we are waiting on NSI to finish loading
        issues.push(makeGenericNameIssue(entity.id, key, value, langCode));
      }
    }

    return issues;
  };


  validation.type = type;

  return validation;
}
