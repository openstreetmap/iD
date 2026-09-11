import type { Selection } from 'd3-selection';

/**
 * Options for {@link uiSetInlineLoading}.
 */
export interface InlineLoadingOptions {
    /** CSS class to toggle on the element when loading. Default `'loading'`. */
    className?: string;
    /** Whether to show a spinner element. Default `false`. */
    spinner?: boolean;
    /** Class name for the spinner wrapper. Default `'spinner'`. */
    spinnerClass?: string;
    /** Image URL for the spinner (e.g. from `context.imagePath('loader-black.gif')`). */
    spinnerImage?: string;
}

/**
 * Toggle loading state for inline UI elements.
 *
 * Sets a loading class and `aria-busy` on the selection. When `options.spinner` is true,
 * ensures a spinner element exists and shows or hides it; the spinner reuses existing
 * `.spinner` styles from the app CSS.
 *
 * @param selection - D3 selection of the container element(s) to mark as loading.
 * @param isLoading - Whether the loading state is active.
 * @param options - Optional configuration (class name, spinner visibility, spinner image).
 *
 * @example
 * // Button loading (no spinner)
 * uiSetInlineLoading(button, true);
 *
 * @example
 * // Row loading with spinner
 * uiSetInlineLoading(li, true, {
 *   className: 'wayback-loading',
 *   spinner: true,
 *   spinnerImage: context.imagePath('loader-black.gif')
 * });
 */
export function uiSetInlineLoading(
    selection: Selection<HTMLElement, unknown, null, undefined>,
    isLoading: boolean,
    options: InlineLoadingOptions = {}
): void {
    const className = options.className ?? 'loading';
    const spinner = options.spinner ?? false;
    const spinnerClass = options.spinnerClass ?? 'spinner';

    selection
        .classed(className, isLoading)
        .attr('aria-busy', isLoading ? 'true' : null);

    if (!spinner) return;

    let spinnerSelection = selection.selectAll<HTMLSpanElement, number>(`.${spinnerClass}`)
        .data([0]);

    spinnerSelection = spinnerSelection.enter()
        .append('span')
        .attr('class', `${spinnerClass} hide`)
        .merge(spinnerSelection);

    if (options.spinnerImage) {
        const img = spinnerSelection.selectAll<HTMLImageElement, number>('img')
            .data([0]);
        img.enter()
            .append('img')
            .merge(img)
            .attr('src', options.spinnerImage)
            .attr('alt', '');
    }

    spinnerSelection.classed('hide', !isLoading);
}
