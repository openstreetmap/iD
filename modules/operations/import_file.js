// @ts-check
/** @import * as Osm from 'osm-api' */
import { parseOsmChangeXml } from 'osm-api';
import { uploadFile } from '../util/dom';
import { actionImportOsmChange, actionImportOsmPatch } from '../actions';
import { t } from '../core';
import { utilArrayChunk } from '../util';

/**
 * we need to do a full load for every feature that we're
 * about to modify or delete, to ensure that all operations
 * are safe, in particular, deleting features and modifying
 * relations.
 * @param {iD.Context} context
 * @param {string[]} entityIds
 */
async function downloadFeatures(context, entityIds) {
  // split into chunks of parallel requests, to avoid
  // getting blocked by the OSM API.
  for (const chunk of utilArrayChunk(entityIds, 10)) {
    await Promise.all(chunk.map(context.loadEntity));
  }
}

/**
 * @param {iD.Context} context
 * @param {boolean} allowConflicts
 * @param {() => void} [onLoadingStart]
 */
export async function operationImportFile(
  context,
  allowConflicts,
  onLoadingStart
) {
  const files = await uploadFile({
    accept: '.osc,.osmPatch.geo.json',
    multiple: true,
  });
  if (!files.length) return; // cancelled

  onLoadingStart?.();

  for (const file of files) {
    if (file.name.endsWith('.osc')) {
      // osmChange
      const osmChange = parseOsmChangeXml(await file.text());

      context.defaultChangesetTags(osmChange.changeset?.tags);

      await downloadFeatures(
        context,
        [...osmChange.modify, ...osmChange.delete].map(
          (feature) => feature.type[0] + feature.id
        )
      );

      const annotation = t('operations.import_from_file.annotation.osmChange');
      context.history().appendImageryUsed('.osmChange data file');
      context.perform(
        actionImportOsmChange(osmChange, allowConflicts),
        annotation
      );
    } else if (file.name.endsWith('.osmPatch.geo.json')) {
      // osmPatch
      /** @type {Osm.OsmPatch} */
      const osmPatch = JSON.parse(await file.text());

      context.defaultChangesetTags(osmPatch.changesetTags);

      await downloadFeatures(
        context,
        osmPatch.features
          .filter((f) => f.properties.__action)
          .map((f) => /** @type {string} */ (f.id))
      );

      const annotation = t('operations.import_from_file.annotation.osmPatch');
      context.history().appendImageryUsed('.osmPatch data file');
      context.perform(actionImportOsmPatch(osmPatch), annotation);
    }
  }
}
