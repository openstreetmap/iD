import {
  deprecatedTagValuesByKey,
  getDeprecatedTags,
  type DataDeprecated,
} from '../../../modules/osm/deprecated';

var deprecated: DataDeprecated = [
  { old: { highway: 'no' } },
  { old: { amenity: 'toilet' }, replace: { amenity: 'toilets' } },
  { old: { speedlimit: '*' }, replace: { maxspeed: '$1' } },
  {
    old: { man_made: 'water_tank' },
    replace: { man_made: 'storage_tank', content: 'water' },
  },
  {
    old: { amenity: 'gambling', gambling: 'casino' },
    replace: { amenity: 'casino' },
  },
];

describe('getDeprecatedTags', () => {
  it('returns none if entity has no tags', () => {
    expect(getDeprecatedTags({}, deprecated)).toStrictEqual([]);
  });

  it('returns none when no tags are deprecated', () => {
    expect(getDeprecatedTags({ amenity: 'toilets' }, deprecated)).toStrictEqual(
      [],
    );
  });

  it('returns 1:0 replacement', () => {
    expect(getDeprecatedTags({ highway: 'no' }, deprecated)).toStrictEqual([
      { old: { highway: 'no' } },
    ]);
  });

  it('returns 1:1 replacement', () => {
    expect(getDeprecatedTags({ amenity: 'toilet' }, deprecated)).toStrictEqual([
      { old: { amenity: 'toilet' }, replace: { amenity: 'toilets' } },
    ]);
  });

  it('returns 1:1 wildcard', () => {
    expect(getDeprecatedTags({ speedlimit: '50' }, deprecated)).toStrictEqual([
      { old: { speedlimit: '*' }, replace: { maxspeed: '$1' } },
    ]);
  });

  it('returns 1:2 total replacement', () => {
    expect(
      getDeprecatedTags({ man_made: 'water_tank' }, deprecated),
    ).toStrictEqual([
      {
        old: { man_made: 'water_tank' },
        replace: { man_made: 'storage_tank', content: 'water' },
      },
    ]);
  });

  it('returns 1:2 partial replacement', () => {
    expect(
      getDeprecatedTags(
        { man_made: 'water_tank', content: 'water' },
        deprecated,
      ),
    ).toStrictEqual([
      {
        old: { man_made: 'water_tank' },
        replace: { man_made: 'storage_tank', content: 'water' },
      },
    ]);
  });

  it('returns 2:1 replacement', () => {
    expect(
      getDeprecatedTags(
        { amenity: 'gambling', gambling: 'casino' },
        deprecated,
      ),
    ).toStrictEqual([
      {
        old: { amenity: 'gambling', gambling: 'casino' },
        replace: { amenity: 'casino' },
      },
    ]);
  });
});

describe('deprecatedTagValuesByKey', () => {
  it('groups simple deprecations by key', () => {
    expect(deprecatedTagValuesByKey(deprecated)).toStrictEqual({
      amenity: ['toilet'], // `gambling` not included
      highway: ['no'],
      man_made: ['water_tank'],
    });
  });
});
