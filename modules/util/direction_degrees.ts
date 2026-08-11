import { cardinal } from '../osm/node';


/**
 * Normalize an angle in degrees to the range [0, 360).
 */
export function utilNormalizeAzimuthDegrees(degrees: number): number {
    return ((degrees % 360) + 360) % 360;
}


/**
 * Parse one direction segment (cardinal or number) to degrees in [0, 360).
 * Locale-agnostic (`parseFloat`); dial UI can wrap with a locale parser later.
 */
export function utilParseDirectionDegreesSegment(value: string): number | null {
    const directionText = (value || '').trim().toLowerCase();
    if (!directionText) return null;

    if (cardinal[directionText] !== undefined) {
        return cardinal[directionText];
    }

    const parsed = parseFloat(directionText);
    if (!isFinite(parsed)) return null;

    return utilNormalizeAzimuthDegrees(parsed);
}


/**
 * True if any `;`-separated segment parses as a cardinal or numeric angle.
 */
export function utilHasDirectionDegrees(value: string | undefined): boolean {
    if (value === undefined || value === '') return false;

    return value.split(';').some(segment => utilParseDirectionDegreesSegment(segment) !== null);
}


/**
 * Rewrite a direction tag so the first parseable segment aims at `targetDegrees`,
 * applying the same delta to every other parseable segment (preserves two-sidedness).
 * Unparsable segments are left unchanged. Empty/absent values become a single angle.
 */
export function utilRetargetDirectionDegreesValue(
    value: string | undefined,
    targetDegrees: number
): string {
    const target = Math.round(utilNormalizeAzimuthDegrees(targetDegrees));

    if (value === undefined || value === '') {
        return target.toString();
    }

    const segments = value.split(';');
    const parsed = segments.map(segment => utilParseDirectionDegreesSegment(segment));
    const firstIndex = parsed.findIndex(degrees => degrees !== null);

    if (firstIndex === -1) {
        return value;
    }

    const delta = target - (parsed[firstIndex] as number);

    return segments.map((segment, index) => {
        const degrees = parsed[index];
        if (degrees === null) return segment;

        return Math.round(utilNormalizeAzimuthDegrees(degrees + delta)).toString();
    }).join(';');
}
