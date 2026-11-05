import type { Vec2 } from '../geo/vector';
import type { Osmose } from '../services/osmose';
import type { EntityId } from './id_manager';

type Props = Partial<Pick<QAItem, 'item' | 'icon' | 'elems' | 'detail' | 'newStatus'>>;

export class QAItem {
  static nextId: number;
  loc: Vec2;
  service: string;
  itemType: string;
  id: string;
  icon?: string;
  elems?: EntityId[];
  detail?: string;
  item: number;
  status?: never;
  newStatus?: 'done' | 'false';

  constructor(loc: Vec2, service: Osmose, itemType: string, id: string, props: Props & Pick<QAItem, 'item'>) {
    // Store required properties
    this.loc = loc;
    this.service = service.title;
    this.itemType = itemType;

    // All issues must have an ID for selection, use generic if none specified
    this.id = id ? id : `${QAItem.id()}`;

    this.item = props.item;
    this.update(props);

    // Some QA services have marker icons to differentiate issues
    if (service && typeof service.getIcon === 'function') {
      this.icon = service.getIcon(itemType);
    }
  }

  update(props: Props) {
    // You can't override this initial information
    const { loc, service, itemType, id } = this;

    Object.assign(this, props);

    this.loc = loc;
    this.service = service;
    this.itemType = itemType;
    this.id = id;

    return this;
  }

  // Generic handling for newly created QAItems
  static id() {
    return this.nextId--;
  }
}
QAItem.nextId = -1;
