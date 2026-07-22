declare global {
  declare var iD: typeof import('.');
  declare var VITEST: true;

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

    export type OsmNode = import('./osm/node').osmNode;
    export type OsmWay = import('./osm/way').osmWay;
    export type OsmRelation = import('./osm/relation').osmRelation;
    export type OsmEntity = import('./osm/abstract-entity').OsmEntity;
    export type OsmAbstractEntity = import('./osm/abstract-entity').OsmAbstractEntity;

    export type Projection = import('./geo/raw_mercator').Projection;
  }

  declare namespace d3 {
    export type Selection<T = HTMLElement> = import('d3-selection').Selection<
      T,
      any,
      any,
      unknown
    >;

    export type Selector = <T extends HTMLElement>(selection: Selection<T>) => void;
  }

    interface ObjectConstructor {
        // custom overload so that `Object.keys(Record<T, …>)` returns `T[]`
        keys<T>(o: T extends Record<infer K, unknown> ? [K] extends [string] ? T : never : never): (keyof T)[];
    }

    // override to make Array#filter(Boolean) work,
    // from https://github.com/mattpocock/ts-reset
    type NonFalsy<T> = T extends false | 0 | 0n | '' | null | undefined ? never : T;
    interface Array<T> {
        filter<S extends T>(predicate: BooleanConstructor, thisArg?: any): NonFalsy<S>[];
    }

    interface ParentNode extends Node {
        /** used internally by d3 to store the values passed to `.data()` */
        __data__: any;
    }
}

export {};
