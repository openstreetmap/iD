// @ts-check
import { t } from '../../core';
import { operationImportFile } from '../../operations/import_file';
import { svgIcon } from '../../svg';
import { uiLoading } from '../loading';
import { uiTooltip } from '../tooltip';
import { uiErrorModal } from '../error_modal';

/** @param {iD.Context} context */
export function uiSectionImportFile(context) {
  const _loading = uiLoading(context)
    .message(t.html('operations.import_from_file.loading'))
    .blocking(true);

  const _errorModal = uiErrorModal();

  /** @param {PointerEvent} event */
  async function onClickImport(event) {
    try {
      await operationImportFile(context, event.ctrlKey, () => {
        context.container().call(_loading);
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);

      const subtitle = `${error}`.includes('Conflicts')
        ? t.html('operations.import_from_file.error.conflicts')
        : t.html('operations.import_from_file.error.unknown');

      context
        .container()
        .call(
          _errorModal
            .setTitle(t.html('operations.import_from_file.error.title'))
            .setSubtitle(subtitle)
        );
    }
    _loading.close();
  }

  /** @param {d3.Selection} selection */
  return (selection) => {
    const importDivEnter = selection
      .selectAll('.layer-list-import')
      .data([0])
      .enter()
      .append('div')
      .attr('class', 'layer-list-import');

    importDivEnter
      .append('button')
      .attr('class', 'button-link')
      .call(
        uiTooltip()
          .title(() => t.append('operations.import_from_file.tooltip'))
          .placement('right')
      )
      .call(svgIcon('#iD-icon-save', 'inline'))
      .call(t.append('operations.import_from_file.title'))
      .on('click', onClickImport);
  };
}
