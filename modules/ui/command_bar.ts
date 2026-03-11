import { select as d3_select } from 'd3-selection';
import { COMMAND_CATEGORIES, t, type Command } from '../core';
import { uiCmd } from './cmd';
import { uiCmdSequence } from './cmd_sequence';
import { isElementScrolledIntoView } from '../util/layout';

const MAX_RECENTS = 8;

export function uiCommandBar(context: iD.Context) {
  let _selection = d3_select<HTMLDialogElement, never>(null!);
  let _selectedId: string | undefined;
  let _searchValue = '';
  let _filteredEntries: Command[] = [];
  let _recentlyUsed: string[] = [];

  function execute(event: MouseEvent | KeyboardEvent, entry: Command) {
    // remember the N most recently used commands
    _recentlyUsed = _recentlyUsed
      .filter((id) => id !== entry.id)
      .slice(0, MAX_RECENTS - 1);
    _recentlyUsed.unshift(entry.id);

    // reset state
    _selectedId = undefined;
    _searchValue = '';
    const input = _selection.select<HTMLInputElement>('input').node();
    if (input) input.value = '';

    _selection.node()?.close();
    entry.action(event);
  }

  function onKeyDown(event: KeyboardEvent) {
    // trigger the currently-selected item
    if (event.key === 'Enter' && _selectedId) {
      const selected = context.commands.registry[_selectedId];
      if (selected) execute(event, selected);
    }

    // navigate up & down the list
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const index = _filteredEntries.findIndex((x) => x.id === _selectedId);

      const newIndex =
        event.key === 'ArrowDown'
          ? Math.min(index + 1, _filteredEntries.length - 1)
          : Math.max(index - 1, 0);

      const newId = _filteredEntries[newIndex]?.id;
      _selectedId = newId;
      event.preventDefault();
      reRenderList();
      return;
    }
  }

  /** called as the user types or navigates the list */
  function reRenderList() {
    const allCommands = context.commands.getAll();

    // TODO: use utilEditDistance like the preset searchbar?

    _filteredEntries = _searchValue
      ? // if there is a search query, only show matching results
        allCommands.filter((t) =>
          t.label.toLowerCase().includes(_searchValue.toLowerCase()),
        )
      : // else, show recently used first, then all others
        [
          ..._recentlyUsed.map((id) => context.commands.registry[id]),
          ...allCommands.filter((x) => !_recentlyUsed.includes(x.id)),
        ];

    _selection
      .select('.command-bar-no-results')
      .classed('hide', !!_filteredEntries.length);

    const ul = _selection.select('div').select('ul');

    const li = ul
      .selectAll<HTMLLIElement, Command>('li')
      .data(_filteredEntries, (d) => d?.id)
      .order();

    const liEnter = li.enter().append('li').on('click', execute);

    liEnter
      .append('span')
      .text((d) => `${COMMAND_CATEGORIES[d.categoryId]()}: ${d.label}`);

    liEnter.each(function (d) {
      if (!d.keyboardShortcut) return;
      uiCmdSequence(d.keyboardShortcut)(d3_select(this));
    });

    liEnter
      .merge(li)
      .classed('command-bar-selected', (d) => d.id === _selectedId)
      .classed('command-bar-recently-used', (d) => _recentlyUsed.includes(d.id))
      .each(function (d) {
        if (d.id === _selectedId) {
          // this list item is selected, so ensure that it's in view
          if (!isElementScrolledIntoView(this, this.parentElement!)) {
            this.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    li.exit().remove();
  }

  /** called once */
  function render(selection: typeof _selection) {
    _selection = selection.append('dialog').classed('command-bar', true);

    const wrapper = _selection.append('div');

    wrapper
      .append('input')
      .attr('placeholder', t('command-bar.placeholder'))
      .on('input', (event) => {
        _searchValue = event.target.value;
        reRenderList();
      })
      .on('keydown', onKeyDown);

    wrapper.append('ul').data([]);
    reRenderList();

    wrapper
      .append('div')
      .classed('command-bar-no-results', true)
      .classed('hide', true)
      .text('No Results!');

    const footer = wrapper.append('footer');

    const section1 = footer.append('section');
    section1.append('kbd').attr('class', 'shortcut').text(uiCmd.display('↑'));
    section1.append('kbd').attr('class', 'shortcut').text(uiCmd.display('↓'));
    section1.append('span').text(' ' + t('command-bar.help.navigate_list'));

    const section2 = footer.append('section');
    section2.append('kbd').attr('class', 'shortcut').text(uiCmd.display('↩'));
    section2.append('span').text(' ' + t('command-bar.help.execute'));

    const section3 = footer.append('section');
    section3.append('kbd').attr('class', 'shortcut').text(uiCmd.display('⎋'));
    section3.append('span').text(' ' + t('command-bar.help.exit'));
  }

  function activate() {
    reRenderList();
    _selection.node()?.showModal();
  }

  context.keybinding().on('⌘' + t('command-bar.key'), activate);

  return render;
}
