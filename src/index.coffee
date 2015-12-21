
require "lotus-require"

{ Kind
  isKind
  setType
  assertType
  addValidatorType } = require "type-utils"

module.exports =
Factory = require "./Factory"

addValidatorType
  isType: (value) ->
    isKind value, Factory
  validate: validateWithFactory = (value, factory, keyPath) ->
    assertType value, factory, keyPath

#
# Convert the built-in types into Factory types.
#

builtinValueTypes = [
  Number
  String
  Boolean
]

for type in builtinValueTypes
  setType type, Factory

builtinRefTypes = [
  Date
  Array
  Object
  RegExp
  Function
]

for type in builtinRefTypes
  setType type, Factory
  type.Kind = Kind type
