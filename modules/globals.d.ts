import type { FetchMockStatic } from 'fetch-mock';

declare global {
  declare var iD: typeof import('.');
  declare var d3: typeof import('d3');
  declare var fetchMock: FetchMockStatic;
  declare var before: typeof beforeEach;
  declare var after: typeof afterEach;
  declare var VITEST: true;
}

export {};
