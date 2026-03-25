import type { Selection } from 'd3-selection';
import { select as d3_select } from 'd3-selection';
import { localizer } from '../../core/localizer';
import { uiSetInlineLoading } from '../inline_loading';
import { ESRI_WAYBACK_ID } from '../../renderer/background_source_wayback';
import type { WaybackSource } from '../../renderer/background_source_wayback';

const WAYBACK_LOADING_CLASS = 'wayback-loading';
const WAYBACK_READY_CLASS = 'wayback-ready';
const WAYBACK_SPINNER_CLASS = 'wayback-spinner';

/**
 * Format a wayback release date string for display in the dropdown.
 */
export function formatWaybackReleaseLabel(dateString: string, localeCode?: string): string {
    const date = new Date(dateString + 'T00:00:00Z');
    const code = localeCode ?? localizer.localeCode();
    const localeDate = isNaN(date.getTime()) ? dateString : date.toLocaleDateString(code);
    return `${localeDate} Release`;
}

/**
 * Populate the wayback date dropdown with options from the wayback source.
 * Sets current date selection; no-op if no release dates yet.
 */
export function updateWaybackDropdownOptions(
    dropdown: Selection<HTMLSelectElement, unknown, null, undefined>,
    waybackSource: WaybackSource
): void {
    let currDate = waybackSource.date();
    const releaseDates = waybackSource.getAvailableReleaseDates();
    if (releaseDates.length === 0) return;

    if (!currDate) {
        waybackSource.date(releaseDates[0]);
        currDate = releaseDates[0];
    }

    const options = dropdown.selectAll('option')
        .data(releaseDates, (d: string) => d);

    options.exit().remove();

    options.enter()
        .append('option')
        .merge(options as Selection<HTMLOptionElement, string, HTMLSelectElement, unknown>)
        .attr('value', (d: string) => d)
        .text((d: string) => formatWaybackReleaseLabel(d))
        .property('selected', (d: string) => d === currDate);
}

/**
 * Set loading state on the wayback list item (spinner visible, dropdown hidden).
 */
export function setWaybackLoading(
    li: Selection<HTMLLIElement, unknown, null, undefined>,
    isLoading: boolean,
    context: iD.Context
): void {
    li.classed(WAYBACK_READY_CLASS, !isLoading);
    uiSetInlineLoading(li, isLoading, {
        className: WAYBACK_LOADING_CLASS,
        spinner: true,
        spinnerClass: WAYBACK_SPINNER_CLASS,
        spinnerImage: context.imagePath('loader-black.gif')
    });
}

/**
 * Show or hide the wayback date dropdown (e.g. once we have results and are not loading).
 */
export function setWaybackDropdownVisible(
    li: Selection<HTMLLIElement, unknown, null, undefined>,
    visible: boolean
): void {
    li.classed(WAYBACK_READY_CLASS, visible);
}

/**
 * Ensure wayback data is loaded and then refetch release dates for the current map location.
 * Call when the user selects the wayback radio so the dropdown gets location-specific dates.
 */
export function ensureWaybackAndRefetch(waybackSource: WaybackSource): Promise<void> {
    return waybackSource.initWaybackAsync()
        .then(() => waybackSource.fetchReleaseDatesAsync())
        .then(() => {});
}

/**
 * Load wayback data and refetch for current location, then update the given list item:
 * clear loading, show dropdown, populate options.
 */
export function ensureWaybackRefetchAndUpdateRow(
    waybackSource: WaybackSource,
    li: Selection<HTMLLIElement, unknown, null, undefined>,
    context: iD.Context
): Promise<void> {
    setWaybackLoading(li, true, context);
    return ensureWaybackAndRefetch(waybackSource)
        .then(() => {
            const dropdown = li.select<HTMLSelectElement>('.wayback-date');
            updateWaybackDropdownOptions(dropdown, waybackSource);
            setWaybackLoading(li, false, context);
            setWaybackDropdownVisible(li, true);
        })
        .catch(() => {
            setWaybackLoading(li, false, context);
            setWaybackDropdownVisible(li, false);
        });
}

/**
 * Run when user selects the wayback radio: load data if needed, set base layer, refetch for
 * current location, then update the row (dropdown visible, options populated, spinner off).
 */
export function selectWaybackAndUpdateRow(
    waybackSource: WaybackSource,
    li: Selection<HTMLLIElement, unknown, null, undefined>,
    context: iD.Context,
    setBaseLayer: () => void
): Promise<void> {
    setWaybackLoading(li, true, context);
    return waybackSource.initWaybackAsync()
        .then(() => {
            setBaseLayer();
            return waybackSource.fetchReleaseDatesAsync();
        })
        .then(() => {
            const dropdown = li.select<HTMLSelectElement>('.wayback-date');
            updateWaybackDropdownOptions(dropdown, waybackSource);
            setWaybackLoading(li, false, context);
            setWaybackDropdownVisible(li, true);
        })
        .catch(() => {
            setWaybackLoading(li, false, context);
            setWaybackDropdownVisible(li, false);
        });
}

/**
 * Refresh wayback dropdown from API (e.g. on focus) and update the row.
 */
export function refreshWaybackDropdownFromApi(
    waybackSource: WaybackSource,
    li: Selection<HTMLLIElement, unknown, null, undefined>,
    context: iD.Context
): Promise<void> {
    setWaybackLoading(li, true, context);
    return waybackSource.fetchReleaseDatesAsync()
        .then(() => {
            const dropdown = li.select<HTMLSelectElement>('.wayback-date');
            updateWaybackDropdownOptions(dropdown, waybackSource);
            setWaybackDropdownVisible(li, true);
        })
        .finally(() => {
            setWaybackLoading(li, false, context);
        });
}

/**
 * Update the wayback row UI: if we have release dates, show dropdown and options;
 * otherwise keep dropdown hidden until loaded.
 */
export function updateWaybackRow(
    li: Selection<HTMLLIElement, unknown, null, undefined>,
    waybackSource: WaybackSource
): void {
    const releaseDates = waybackSource.getAvailableReleaseDates();
    const hasResults = releaseDates.length > 0;
    if (hasResults) {
        const dropdown = li.select<HTMLSelectElement>('.wayback-date');
        updateWaybackDropdownOptions(dropdown, waybackSource);
        setWaybackDropdownVisible(li, true);
    } else {
        setWaybackDropdownVisible(li, false);
    }
}

/**
 * Render the wayback-specific row content: spinner container (inside label, after text)
 * and date dropdown (sibling of label). Call with the enter selection of wayback li elements.
 */
export function renderWaybackRowContent(
    waybackLiEnter: Selection<HTMLLIElement, unknown, null, undefined>,
    context: iD.Context,
    callbacks: {
        onDateFocus: (dropdown: Selection<HTMLSelectElement, unknown, null, undefined>) => void;
        onDateChange: (evt: Event) => void;
    }
): void {
    waybackLiEnter
        .classed('wayback-row', true);

    // Spinner container inside label (after the text span), aligned with label
    waybackLiEnter.select('label')
        .append('span')
        .attr('class', WAYBACK_SPINNER_CLASS + ' hide')
        .attr('aria-hidden', 'true');

    // Dropdown as sibling of label; visibility controlled by .wayback-ready on li
    waybackLiEnter
        .append('select')
        .attr('class', 'wayback-date')
        .attr('aria-label', 'Wayback release date')
        .on('focus', function (this: HTMLSelectElement) {
            callbacks.onDateFocus(d3_select(this));
        })
        .on('change', callbacks.onDateChange);
}

export { ESRI_WAYBACK_ID };
