class JSFunction {
  stringify (rawObject) {
    const entries = Object.entries(rawObject)

    for (const entry of entries) {
      const value = entry[1]

      if (typeof value === 'function') {
        entry[1] = ['JSFunction.function', value.toString()]
      }
    }

    return JSON.stringify(Object.fromEntries(entries))
  }

  parse (objectString) {
    const realObject = JSON.parse(objectString)
    const entries = Object.entries(realObject)

    for (const entry of entries) {
      const value = entry[1]

      if (value instanceof Array && value[0] === 'JSFunction.function') {
        entry[1] = this.rebuildFunction(value[1])
      }
    }

    return Object.fromEntries(entries)
  }

  rebuildFunction (stringFunction) {
    const fnBodyIndex = stringFunction.indexOf('{')
    const fnBody = stringFunction.substring(fnBodyIndex + 1, stringFunction.lastIndexOf('}'))
    const fnDeclaration = stringFunction.substring(0, fnBodyIndex)
    const fnParams = fnDeclaration.substring(fnDeclaration.indexOf('(') + 1, fnDeclaration.lastIndexOf(')'))
    const args = fnParams.split(',')

    args.push(fnBody)

    function DeclaredFunction () {
      return Function.apply(this, args)
    }

    DeclaredFunction.prototype = Function.prototype

    return new DeclaredFunction()
  }
}

module.exports = new JSFunction()
