
import fetchMock from 'fetch-mock';
import { getOsmCalEvents } from '../../../modules/services/osmcal.js';

describe('getOsmCalEvents', function() {
    beforeEach(() => {
        fetchMock.reset();
    });

    afterEach(() => {
        fetchMock.reset();
    });

    it('filters out cancelled events', async function() {
        const events = [
            {
                name: 'OpenStreetMap Conference',
                url: 'https://example.com/event',
                date: {
                    start: '2026-11-10T18:00:00-07:00',
                    human: '10th November 18:00',
                    human_short: '10th November',
                    whole_day: false
                }
            },
            {
                name: 'Cancelled OSM Meetup',
                url: 'https://example.com/cancelled-event',
                date: {
                    start: '2026-11-11T18:00:00-07:00',
                    human: '11th November 18:00',
                    human_short: '11th November',
                    whole_day: false
                },
                cancelled: true
            }
        ];

        fetchMock.get('begin:https://osmcal.org/api/v2/events/', {
            body: events,
            status: 200
        });

        const result = await getOsmCalEvents([73.8567, 18.5204]);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('OpenStreetMap Conference');
    });

    it('uses the correct API query parameters', async function() {
        fetchMock.get('begin:https://osmcal.org/api/v2/events/', {
        body: [],
        status: 200
        });

        await getOsmCalEvents([72.8777, 19.0760]);

        const requestURL = new URL(fetchMock.calls()[0][0]);
        const params = requestURL.searchParams;

        expect(params.get('around')).toBe('19.08,72.88');
        expect(params.get('radius')).toBe('100');
        expect(params.get('days')).toBe('30');
        expect(params.get('client-app')).toBe('iD');
    });

    it('caches results for the same coordinates', async function() {
        fetchMock.get('begin:https://osmcal.org/api/v2/events/', {
            body: [],
            status: 200
        });

        const center = [77.5946, 12.9716];

        const firstResult = await getOsmCalEvents(center);
        const secondResult = await getOsmCalEvents(center);

        expect(fetchMock.calls()).toHaveLength(1);
        expect(secondResult).toEqual(firstResult);
    });

    it('returns an empty array when response JSON parsing fails', async function() {
        fetchMock.get('begin:https://osmcal.org/api/v2/events/', {
            body: 'invalid json',
            status: 200
        });

        const result = await getOsmCalEvents([26.9124, 75.7873]);

        expect(result).toEqual([]);
    });

    it('returns an empty array when the network request fails', async function() {
        fetchMock.get('begin:https://osmcal.org/api/v2/events/', {
        throws: new Error('Network error')
        });

        const result = await getOsmCalEvents([26.9124, 75.7873]);

        expect(result).toEqual([]);
    });

});
