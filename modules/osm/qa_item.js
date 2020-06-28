
export class QAItem {
  constructor(loc, service, itemType, id, props) {
    // Store required properties
    this.loc = loc;
    this.service = service.title;
    this.itemType = itemType;

    // All issues must have an ID for selection, use generic if none specified
    this.id = id ? id : `${QAItem.id()}`;

    this.update(props);

    // Some QA services have marker icons to differentiate issues
    if (service && typeof service.getIcon === 'function') {
      this.icon = service.getIcon(itemType);
    }

    return this;
  }

  update(props) {
    // You can't override this initial information
    const { loc, service, itemType, id } = this;

    Object.keys(props).forEach(prop => this[prop] = props[prop]);

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
