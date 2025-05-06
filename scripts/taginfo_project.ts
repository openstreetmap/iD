import { promises as fs } from 'node:fs';
import pkg from '../package.json' with { type: "json" };
import type * as Taginfo from 'taginfo-projects';
import type { TagDictionary } from '../modules/util/object.js';
import {
  osmAreaKeysExceptions,
  osmPathHighwayTagValues,
  osmPavedTags,
  osmRightSideIsInsideTags,
  osmRoutableAerowayTags,
  osmRoutableHighwayTagValues,
  osmSemipavedTags,
  osmFlowingWaterwayTagValues,
  // osmLifecyclePrefixes, // not supported by taginfo-projects
  osmMutuallyExclusiveTagPairs,
  osmOneWayForwardTags,
  osmOneWayBackwardTags,
  osmOneWayBiDirectionalTags,
  osmRailwayTrackTagValues,
  osmAverageWidths,
  uninterestingKeys,
} from '../modules/osm/tags.js';

const groups: ({ tags: TagDictionary<string | number | boolean> } & Omit<Taginfo.Tag, 'key'>)[] = [
  {
    description: 'Treated as a paved surface type',
    tags: osmPavedTags,
    object_types: ['way'],
  },
  {
    description: 'Treated as a semi-paved surface type',
    tags: osmSemipavedTags,
    object_types: ['way'],
  },
  {
    description:
      '"waterway" tag values for line features representing water flow',
    tags: { waterway: osmFlowingWaterwayTagValues },
    object_types: ['way'],
  },
  {
    description:
      '"highway" tag values that generally do not allow motor vehicles',
    tags: { highway: osmPathHighwayTagValues },
    object_types: ['way'],
  },
  {
    description:
      '"highway" tag values that are treated as routable for pedestrians or vehicles',
    tags: { highway: osmRoutableHighwayTagValues },
    object_types: ['way'],
  },
  {
    description:
      '"aeroway" tag values that are treated as routable for aircraft',
    tags: { aeroway: osmRoutableAerowayTags },
    object_types: ['way'],
  },

  {
    description:
      'Implies that a linear feature is oneway in the forward direction',
    tags: osmOneWayForwardTags,
    object_types: ['way'],
  },
  {
    description:
      'Implies that a linear feature is oneway in the backward direction',
    tags: osmOneWayBackwardTags,
    object_types: ['way'],
  },
  {
    description: 'Implies that a linear feature is bi-directional',
    tags: osmOneWayBiDirectionalTags,
    object_types: ['way'],
  },

  {
    description:
      'Treated as an area instead of a closed line, even without an explicit area=yes tag',
    tags: osmAreaKeysExceptions,
    object_types: ['area'],
  },
  {
    description: '"railway" tag values that represet active railroad tracks',
    tags: { railway: osmRailwayTrackTagValues },
    object_types: ['way'],
  },
  {
    description:
      'A linear feature where the right-side is considered the inside; rendered with directional arrows on the inside.',
    tags: osmRightSideIsInsideTags,
    object_types: ['way'],
  },
  {
    description:
      'Assumed to be %s metres wide (for highways, the width is per lane)',
    tags: osmAverageWidths,
    object_types: ['way'],
  },
  {
    description: 'Treated as an ‘uninteresting’ key. iD will prevent users from saving features that have only uninteresting keys.',
    tags: Object.fromEntries([...uninterestingKeys].map(key => [key, true])),
  },
];

for (const [a, b] of osmMutuallyExclusiveTagPairs) {
  for (const pair of [
    [a, b],
    [b, a],
  ]) {
    groups.push({
      description: `Considered mutually exclusive with ${pair[0]}=*`,
      tags: { [pair[1]]: true },
      doc_url: 'https://osm.wiki/Special:WhatLinksHere/Property:P44',
    });
  }
}

const taginfoProject: Taginfo.Schema = {
  $schema: 'https://raw.githubusercontent.com/taginfo/taginfo-projects/master/taginfo-project-schema.json',
  data_format: 1,
  project: {
    name: pkg.name,
    description: 'Tags used by the iD editor for purposes other than presets.',
    project_url: pkg.homepage,
    icon_url: 'https://cdn.jsdelivr.net/gh/openstreetmap/iD/dist/img/logo.png',
    contact_name: pkg.bugs,
    contact_email: '',
  },
  tags: [],
};

for (const { tags, ...group } of groups) {
  for (const key in tags) {
    const values = tags[key];
    if (typeof values === 'object') {
      for (const value in values) {
        // key=value
        taginfoProject.tags.push({
          key,
          value,
          ...group,
          description: group.description?.replace('%s', `${values[value]}`),
        });
      }
    } else {
      // key=*
      taginfoProject.tags.push({ key, ...group });
    }
  }
}

fs.writeFile(
  './dist/data/taginfo.json',
  JSON.stringify(taginfoProject, null, 2),
);
