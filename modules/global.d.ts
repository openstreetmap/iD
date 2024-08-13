declare global {
  declare const expect: Chai.ExpectStatic;

  declare namespace iD {
    export type Context = ReturnType<typeof import('.').coreContext>;
    export type Graph = NonNullable<ReturnType<typeof import('.').coreGraph>>;

    export * from '.';
  }

  declare namespace d3 {
    export type * from 'd3';
  }
}

export {};
