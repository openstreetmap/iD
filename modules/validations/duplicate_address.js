import { t } from '../core/localizer';
import { utilArrayIntersection, utilDisplayLabel } from '../util';
import { validationIssue } from '../core/validation';


export function validationDuplicateAddress(context) {
  const type = 'duplicate_address';


  function hasAddress(entity) {
    return Object.keys(entity.tags).some(k => /^addr:/.test(k));
  }


  function isDuplicate(entity1, entity2) {
    if (entity1.id === entity2.id) return false;   // ignore self

    let dupe = { entity1: entity1, entity2: entity2, tags: {} };
    let different = false;

    // if any of these tags don't match, *and both are present*, it's not a duplicate..
    ['addr:block', 'addr:city', 'addr:postcode'].forEach(k => {
      const val1 = entity1.tags[k] || '';
      const val2 = entity2.tags[k] || '';
      if (val1 && val2) {     // both features have this tag assigned
        if (val1.toLowerCase() !== val2.toLowerCase()) {
          different = true;   // values don't match
        } else {
          dupe.tags[k] = val1;
        }
      }
    });
    if (different) return false;

    // Same logic as above, but `addr:street` and `addr:place` can really be used interchangeably
    // see comments on https://github.com/openstreetmap/iD/pull/7740
    {
      const street1 = entity1.tags['addr:street'];
      const street2 = entity2.tags['addr:street'];
      const place1 = entity1.tags['addr:place'];
      const place2 = entity2.tags['addr:place'];
      const val1 = street1 || place1 || '';
      const val2 = street2 || place2 || '';
      if (val1 && val2) {     // both features have a street or a place
        if (val1.toLowerCase() !== val2.toLowerCase()) {
          different = true;   // values don't match
        } else {
          if (val1 === street1)  dupe.tags['addr:street'] = val1;
          if (val1 === place1)  dupe.tags['addr:place'] = val1;
        }
      }
    }
    if (different) return false;

    // if any of these tags don't match, *and one is present*, it's not a duplicate..
    ['addr:door', 'addr:unit', 'addr:flats', 'addr:floor'].forEach(k => {
      const val1 = entity1.tags[k] || '';
      const val2 = entity2.tags[k] || '';
      if (val1 || val2) {     // one feature has this tag assigned
        if (val1.toLowerCase() !== val2.toLowerCase()) {
          different = true;   // values don't match
        } else {
          dupe.tags[k] = val1;
        }
      }
    });
    if (different) return false;

    // compare housenumbers, which may contain multiple values
    const housenumbers1 = (entity1.tags['addr:housenumber'] || '').split(/[;,]/).filter(Boolean);
    const housenumbers2 = (entity2.tags['addr:housenumber'] || '').split(/[;,]/).filter(Boolean);
    if (housenumbers1.length && housenumbers2.length) {
      const inCommon = utilArrayIntersection(housenumbers1, housenumbers2);
      if (!inCommon.length) {
        different = true;   // housenumbers exist and don't match
      } else {
        dupe.tags['addr:housenumber'] = inCommon.join(';');
      }
    }
    if (different) return false;


    // return whatever duplicate tags we found..
    return Object.keys(dupe.tags).length ? dupe : false;
  }



  let validation = function checkDuplicateAddress(entity, graph) {
    if (!hasAddress(entity)) return [];

    const tree = context.history().tree();
    const extent = entity.extent(graph).padByMeters(50);
    const hits = tree.intersects(extent, graph);
    const dupes = hits.map(hit => isDuplicate(hit, entity)).filter(Boolean);

    return dupes.map(dupe => {
      return new validationIssue({
        type: type,
        severity: 'warning',
        entityIds: [ dupe.entity1.id, dupe.entity2.id ],

        message: (context) => {
          const entity1 = context.hasEntity(dupe.entity1.id);
          const entity2 = context.hasEntity(dupe.entity2.id);
          const entity1Display = entity1 ? utilDisplayLabel(entity1, context) : 'Entity1';
          const entity2Display = entity2 ? utilDisplayLabel(entity2, context) : 'Entity2';
          return t('issues.duplicate_address.message', { entity1: entity1Display, entity2: entity2Display });
        },

        reference: (selection) => {
          const tagData = Object.keys(dupe.tags).map(k => ({ k: k, v: dupe.tags[k] }));

          let enter = selection.selectAll('.issue-reference')
            .data([0])
            .enter();

          enter
            .append('div')
            .attr('class', 'issue-reference')
            .text(t('issues.duplicate_address.reference.text'));

          enter
            .append('div')
            .attr('class', 'issue-reference')
            .text(t('issues.duplicate_address.reference.tags'));

          let rowsEnter = enter
            .append('table')
            .attr('class', 'tagDiff-table')
            .selectAll('.tagDiff-row')
            .data(tagData)
            .enter()
            .append('tr')
            .attr('class', 'tagDiff-row');

          rowsEnter
            .append('td')
            .attr('class', 'tagDiff-cell')
            .text(d => d.k);

          rowsEnter
            .append('td')
            .attr('class', 'tagDiff-cell')
            .text(d => d.v);
        }

      });
    });

  };

  validation.type = type;

  return validation;
}
