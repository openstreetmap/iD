import type { FetchMockStatic } from 'fetch-mock';

declare global {
  declare var iD: typeof import('.');
  declare var d3: typeof import('d3');
  declare var fetchMock: FetchMockStatic;
  declare var before: typeof beforeEach;
  declare var after: typeof afterEach;
  declare var VITEST: true;

  declare type Tags = { [key: string]: string };

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

    export type Graph = InstanceType<typeof iD.coreGraph>;

    export type OsmNode = import('./osm/node').OsmNode;
    export type OsmWay = import('./osm/way').OsmWay;
    export type OsmRelation = import('./osm/relation').OsmRelation;

    export type AbstractEntity = InstanceType<typeof iD.osmEntity>;
    export type OsmEntity = OsmNode | OsmWay | OsmRelation;

    export type Projection = import('./geo/raw_mercator').Projection;
  }

  declare namespace d3 {
    export type Selection<T = any> = import('d3').Selection<
      T,
      unknown,
      unknown,
      unknown
    >;
  }
}

export {};
