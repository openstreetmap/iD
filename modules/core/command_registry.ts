import type { CmdSequence } from '../ui/cmd_sequence';
import { t } from './localizer';

export const COMMAND_CATEGORIES = {
  background: () => t('background.title'),
  panels: () => 'UI Panels', // TODO: i18n
  behavior: () => 'Behaviour', // TODO: i18n
} satisfies Record<string, () => string>;

export type CommandCategory = keyof typeof COMMAND_CATEGORIES;

export interface Command {
  id: string;
  categoryId: CommandCategory;
  label: string;
  action(event: KeyboardEvent | MouseEvent): void;
  terms?: string[];
  keyboardShortcut?: CmdSequence;
}

export class CommandRegistry {
  readonly registry: { [id: string]: Command } = {};

  register(...items: Command[]) {
    for (const item of items) {
      this.registry[item.id] = item;
    }
  }

  getAll() {
    return Object.values(this.registry);
  }
}
