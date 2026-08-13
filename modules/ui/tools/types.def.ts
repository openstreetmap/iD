import type { LocalizedTextRenderer } from '../../core/localizer';

export interface UiTool {
    (): void;
    id: string;
    label: LocalizedTextRenderer;
    render(selection: d3.Selection): void;
    uninstall?(): void;
}
