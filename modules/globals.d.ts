declare global {
  declare var iD: typeof import('.');
  declare var d3: typeof import('d3');
  declare var fetchMock: FetchMock.FetchMockStatic;
  declare var VITEST: true;

  declare type EntityID = string;

  declare type TagKey = string;
  declare type TagValue = string;
  declare type TagValueUpdate = string | undefined;
  declare type Tags = { [key: TagKey]: TagValue };
  declare type TagsMulti = { [key: TagKey]: TagValue | TagValue[] };
  declare type TagsUpdate = { [key: TagKey]: TagValueUpdate };

  /**
   * A class method that acts as both a getter and a
   * setter, depending on the number of arguments.
   */
  declare type GetSet<This, T> = {
    (value: T): This;
    (): T;
  }

  declare namespace iD {
    export type Context = ReturnType<typeof iD.coreContext>;

    export type Graph = import('./core/graph').coreGraph;
    export type OsmNode = import('./osm/node').OsmNode;
    export type OsmWay = import('./osm/way').OsmWay;
    export type OsmRelation = import('./osm/relation').OsmRelation;

    export type AbstractEntity = typeof import('./osm/entity').osmEntity.prototype;
    export type OsmEntity = OsmNode | OsmWay | OsmRelation;

    export type Projection = import('./geo/raw_mercator').Projection;
  }

  declare namespace d3 {
    export type Selection<T = any> = import('d3').Selection<
      T,
      any,
      unknown,
      unknown
    >;

    export type Selector = (selection: Selection) => void;
  }
}

export {};
