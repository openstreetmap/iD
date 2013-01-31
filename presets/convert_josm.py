from xml.dom.minidom import parse
import os, re, json
dirr = os.path.dirname(__file__)

def relative(x):
    return os.path.join(dirr, x)

dom1 = parse(relative('./josm.xml'))

items = dom1.getElementsByTagName('item')

jsonOutput = []

def isemail(x):
    return re.search('email', x, flags=re.IGNORECASE)
def iswebsite(x):
    return re.search('web', x, flags=re.IGNORECASE)
def istel(x):
    return re.search('phone|tel|fax', x, flags=re.IGNORECASE)

for item in items:
    jitem = {
        "name": item.getAttribute('name'),
        "type": item.getAttribute('type').split(','),
        "main": []
    }
    for n in item.childNodes:
        if n.nodeType != n.TEXT_NODE and n.nodeType != n.COMMENT_NODE:
            if n.tagName == 'text':
                txt = n.getAttribute('text')
                type = 'text'
                if isemail(txt):
                    type = 'email'
                if iswebsite(txt):
                    type = 'url'
                if istel(txt):
                    type = 'tel'
                jitem['main'].append({
                    'type': type,
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
