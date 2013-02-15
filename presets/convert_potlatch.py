from xml.dom.minidom import parse
import json

dom1 = parse('potlatch.xml')

inputSets = dom1.getElementsByTagName('inputSet')

jsonOutput = []

for inputSet in inputSets:
    setId = inputSet.getAttribute('id')
    inputs = inputSet.getElementsByTagName('input')
    for i in inputs:
        jsonInput = {}
        inputType = i.getAttribute('type')
        if inputType == 'choice':
            choices = i.getElementsByTagName('choice')
            jsonInput['type'] = 'choice'
            jsonInput['description'] = i.getAttribute('description')
            jsonInput['name'] = i.getAttribute('name')
            jsonInput['key'] = i.getAttribute('key')
            jsonInput['choices'] = []
            for c in choices:
                jsonInput['choices'].append({
                    "value": c.getAttribute('value'),
                    "text": c.getAttribute('text')
                })
        elif inputType == 'freetext':
            jsonInput['type'] = 'freetext'
            jsonInput['description'] = i.getAttribute('description')
            jsonInput['name'] = i.getAttribute('name')
            jsonInput['key'] = i.getAttribute('key')
        elif inputType == 'checkbox':
            jsonInput['type'] = 'checkbox'
            jsonInput['description'] = i.getAttribute('description')
            jsonInput['name'] = i.getAttribute('name')
            jsonInput['key'] = i.getAttribute('key')
        elif inputType == 'number':
            jsonInput['type'] = 'number'
            jsonInput['description'] = i.getAttribute('description')
            jsonInput['name'] = i.getAttribute('name')
            jsonInput['minimum'] = i.getAttribute('minimum')
            jsonInput['maximum'] = i.getAttribute('maximum')
            jsonInput['key'] = i.getAttribute('key')
        jsonOutput.append(jsonInput)

json.dump(jsonOutput, open('presets_potlatch.json', 'w'), indent=4)
