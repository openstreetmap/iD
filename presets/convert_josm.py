from xml.dom.minidom import parse
import os
dirr = os.path.dirname(__file__)
import json

def relative(x):
    return os.path.join(dirr, x)
dom1 = parse(relative('./josm.xml'))

items = dom1.getElementsByTagName('item')

jsonOutput = []

for item in items:
    jitem = {
        "name": item.getAttribute('name'),
        "type": item.getAttribute('type').split(','),
        "main": []
    }
    for n in item.childNodes:
        if n.nodeType != n.TEXT_NODE and n.nodeType != n.COMMENT_NODE:
            if n.tagName == 'text':
                jitem['main'].append({
                    'type': 'text',
                    'key': n.getAttribute('key'),
                    'text': n.getAttribute('text')
                })
            if n.tagName == 'combo':
                jitem['main'].append({
                    'type': 'select',
                    'key': n.getAttribute('key'),
                    'text': n.getAttribute('text'),
                    'values': n.getAttribute('values').split(',')
                })
            if n.tagName == 'check':
                jitem['main'].append({
                    'type': 'check',
                    'key': n.getAttribute('key'),
                    'text': n.getAttribute('text'),
                    'default': (n.getAttribute('check') == 'true')
                })
    jsonOutput.append(jitem)

json.dump(jsonOutput, open(relative('presets_josm.json'), 'w'), indent=4)
