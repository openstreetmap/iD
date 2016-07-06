import { check, defaultcheck} from './check';
import { combo, multiCombo, typeCombo } from './combo';
import { email, number, tel, text, url } from './input';

import { access } from './access';
import { address } from './address';
import { cycleway } from './cycleway';
import { lanes } from './lanes';
import { localized } from './localized';
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
