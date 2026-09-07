import { type Vec2 } from '../geo/vector.js';
import { roundToDecimal } from '../util/units.js';

export interface OsmCalEvent {
    name: string;
    url: string;
    date: {
        start: string;
        end?: string;
        human: string;
        human_short: string;
        whole_day: boolean;
    },
    location?: {
        short?: string;
        detailed?: string;
        coords: Vec2;
        venue: string;
    },
    cancelled?: boolean;
}

const apibase = 'https://osmcal.org/api/v2/events/';

export async function getOsmCalEvents(center: Vec2): Promise<OsmCalEvent[]> {
    const url = new URL(apibase);
    const lon = roundToDecimal(center[0], 2);
    const lat = roundToDecimal(center[1], 2);
    url.searchParams.append('around', `${lat},${lon}`);
    url.searchParams.append('radius', '100'); // max 100km away
    url.searchParams.append('days', '30'); // next 30 days
    url.searchParams.append('client-app', 'iD');
    const events = (await fetch(url, { signal: AbortSignal.timeout(2000) })
        .then(r => r.json())
        .catch(err => {
            console.error(err); // eslint-disable-line no-console
            return [];
        }) as OsmCalEvent[])
        .filter(event => !event.cancelled);
    return events;
}
