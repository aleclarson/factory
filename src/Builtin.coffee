
{ Kind
  Maybe
  setType } = require "type-utils"

module.exports = (Factory) ->

  # Value types
  [
    Number
    String
    Boolean
  ]
  .forEach (type) ->
    setType type, Factory
    type.Maybe = Maybe type

  # Reference types
  [
    Date
    Error
    Array
    Object
    RegExp
    Function
  ]
  .forEach (type) ->
    setType type, Factory
    type.Kind = Kind type
    type.Maybe = Maybe type
