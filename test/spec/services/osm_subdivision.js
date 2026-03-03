import { describe, it, expect, vi, beforeEach } from 'vitest';
import osmService from '../../../modules/services/osm.js';
import { geoExtent } from '../../../modules/geo/index.js';

describe('OSM 400 tile subdivision', () => {

  let service;
  let fakeTile;

  beforeEach(() => {
    service = osmService;
    service.reset();

    fakeTile = {
      id: '0,0,16',
      extent: geoExtent([[0, 0], [1, 1]])
    };
  });


  it('subdivides only once on initial 400', () => {

    let callCount = 0;

    vi.spyOn(service, 'loadFromAPI').mockImplementation((path, cb) => {

      callCount++;

      // Only first call returns 400
      if (callCount === 1) {
        cb({
          status: 400,
          statusText: 'You requested too many nodes (limit is 50000)'
        });
      } else {
        cb(null, []); // children succeed
      }

      return { abort: () => {} }; // important
    });

    const spy = vi.spyOn(service, 'loadTile');

    service.loadTile(fakeTile, () => {});

    // 1 original + 4 children
    expect(spy).toHaveBeenCalledTimes(5);

    spy.mockRestore();
  });


  it('does not subdivide beyond max depth', () => {

    vi.spyOn(service, 'loadFromAPI').mockImplementation((path, cb) => {
      cb({
        status: 400,
        statusText: 'You requested too many nodes (limit is 50000)'
      });
      return { abort: () => {} };
    });

    const spy = vi.spyOn(service, 'loadTile');

    service.loadTile(fakeTile, () => {}, 3);

    // should not create children
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });


  it('retries for non-400 errors', () => {

    vi.useFakeTimers();

    let retryTriggered = false;

    vi.spyOn(service, 'loadFromAPI').mockImplementation((path, cb) => {
      cb({ status: 429 });
      return { abort: () => {} };
    });

    const spy = vi.spyOn(service, 'loadTile');

    service.loadTile(fakeTile, () => {});

    vi.runAllTimers();

    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
    vi.useRealTimers();
  });

});