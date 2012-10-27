from xml.dom.minidom import parse, parseString
import re, json

# this needs to strip xml entities first
doc = parse(open('tmp_markers.xml'))

rules = []

b = re.compile(r"\[(?P<tag>\w+)\]\s*\=\s*\'(?P<value>\w+)\'")
c = re.compile(r"\/(?P<icon>\w+)")
for s in doc.getElementsByTagName('Rule'):
    filt =  str(s.getElementsByTagName('Filter')[0].childNodes[0].wholeText)
    sym =  str(s.getElementsByTagName('PointSymbolizer')[0].getAttribute('file'))
    gd = b.match(filt).groupdict()
    ic = c.match(sym).groupdict()
    rules.append({
        'tags': {
            gd['tag']: gd['value']
        },
        'icon': ic['icon']
    })
json.dump(rules, open('rules.js', 'w'), indent=4)
