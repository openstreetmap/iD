import { access } from './access';
import { address } from './address';
import { check, defaultcheck} from './check';
import { combo, typeCombo, multiCombo } from './combo';
import { cycleway } from './cycleway';
import { text, url, number, email, tel } from './input';
import { localized } from './localized';
import { lanes } from './lanes';
import { maxspeed } from './maxspeed';
import { radio } from './radio';
import { restrictions } from './restrictions';
import { textarea } from './textarea';
import { wikipedia } from './wikipedia';

export var fields = {
    access: access,
    address: address,
    check: check,
    defaultcheck: defaultcheck,
    combo: combo,
    typeCombo: typeCombo,
    multiCombo: multiCombo,
    cycleway: cycleway,
    text: text,
    url: url,
    number: number,
    email: email,
    tel: tel,
    localized: localized,
    lanes: lanes,
    maxspeed: maxspeed,
    radio: radio,
    restrictions: restrictions,
    textarea: textarea,
    wikipedia: wikipedia
};
