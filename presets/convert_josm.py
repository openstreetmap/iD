from xml.dom.minidom import parse

import json
import os
import re

dirr = os.path.dirname(__file__)


def relative(x):
    return os.path.join(dirr, x)

prefs = json.load(open(relative('prefs.json')))
dom1 = parse(relative('./josm.xml'))

jsonOutput = []


def isemail(x):
    return re.search('email', x, flags=re.IGNORECASE)


def iswebsite(x):
    return re.search('web', x, flags=re.IGNORECASE)


def istel(x):
    return re.search('phone|tel|fax', x, flags=re.IGNORECASE)


def isfav(x):
    return x in prefs

for item in dom1.getElementsByTagName('item'):

    tags = {}
    for elem in item.getElementsByTagName('key'):
        tags[elem.getAttribute('key')] = elem.getAttribute('value')

    jitem = {
        "name": item.getAttribute('name'),
        "type": item.getAttribute('type').split(','),
        "tags": tags,
        "main": []
    }

    if isfav(jitem['name']):
        jitem['favorite'] = True

    for n in item.getElementsByTagName('text'):
        txt = n.getAttribute('text')
        type = 'text'
        if isemail(txt):
            type = 'email'
        elif iswebsite(txt):
            type = 'url'
        elif istel(txt):
            type = 'tel'
        jitem['main'].append({
            'type': type,
            'key': n.getAttribute('key'),
            'text': n.getAttribute('text')
        })

    for n in item.getElementsByTagName('combo'):
        jitem['main'].append({
            'type': 'select',
            'key': n.getAttribute('key'),
            'text': n.getAttribute('text'),
            'values': n.getAttribute('values').split(',')
        })

    for n in item.getElementsByTagName('check'):
        jitem['main'].append({
            'type': 'check',
            'key': n.getAttribute('key'),
            'text': n.getAttribute('text'),
            'default': (n.getAttribute('check') == 'true')
        })

    jsonOutput.append(jitem)

json.dump(jsonOutput, open(relative('presets_josm.json'), 'w'), indent=4)
