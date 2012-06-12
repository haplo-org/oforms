
// Tables of units and conversion factors for the measurement Element

// TODO: Allow measurement quanities to be adjusted and extended by users, using options on the FormDescription object

// Each quantity has properties:
//   units - look up of stored symbol to information:
//          display - (optional) text for the symbol is displayed if it is not idential to the stored symbol
//          add - (optional) add this before conversion multiplication
//          multiply - multiply by this to convert to canonical unit
//   canonicalUnit - which unit is canonical
//   defaultUnit - which unit is the default
//   choices - choices for the drop down choices, sets order. May use [string,...] and [[string,string],...] formats

var /* seal */ measurementsQuantities = {

    length: {
        units: {
            mm:   { multiply: 1000 },
            cm:   { multiply: 100 },
            m:    { multiply: 1 },
            km:   { multiply: 0.001 },
            'in': { multiply: 0.0254 },
            ft:   { multiply: 0.3048 },
            yd:   { multiply: 0.9144 },
            mile: { multiply: 1609.344 }
        },
        canonicalUnit: 'm',
        defaultUnit: 'm',
        choices: ['mm','cm','m','km','in','ft','yd','mile']
    },

    time: {
        units: {
            s:   { multiply: 1 },
            m:   { multiply: 60 },
            hr:  { multiply: 3600 },
            day: { multiply: 86400 }
        },
        canonicalUnit: 's',
        defaultUnit: 'hr',
        choices: ['s','m','hr','day']
    },

    mass: {
        units: {
            g:  { multiply: 0.001 },
            kg: { multiply: 1 },
            oz: { multiply: 0.0283495231 },
            lb: { multiply: 0.45359237 }
        },
        canonicalUnit: 'kg',
        defaultUnit: 'kg',
        choices: ['g','kg','oz','lb']
    },

    temperature: {
        units: {
            degC: {
                display: '\u00B0C',
                multiply: 1
            },
            degF: {
                display: '\u00B0F',
                add: -32,
                multiply: (5/9)
            }
        },
        canonicalUnit: 'degC',
        defaultUnit: 'degC',
        choices: [['degC','\u00B0C'],['degF','\u00B0F']]
    }

};
