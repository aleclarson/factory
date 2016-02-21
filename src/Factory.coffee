
{ Void
  Kind
  isType
  isKind
  setType
  setKind
  assertType
  validateTypes } = require "type-utils"

{ sync } = require "io"

parseErrorStack = require "parseErrorStack"
NamedFunction = require "named-function"
reportFailure = require "report-failure"
emptyFunction = require "emptyFunction"
ValueDefiner = require "ValueDefiner"
Reaction = require "reaction"
combine = require "combine"
define = require "define"
steal = require "steal"
log = require "lotus-log"

Factory = NamedFunction "Factory", (name, config) ->

  assertType name, String, "name"
  validateTypes config, _configTypes

  mixins = steal config, "mixins", []
  sync.each mixins, (mixin) ->
    assertType mixin, Function, { name, mixin, mixins }
    mixin config

  statics = steal config, "statics", {}
  optionTypes = steal config, "optionTypes"
  optionDefaults = steal config, "optionDefaults"

  kind = steal config, "kind", Object

  getFromCache = steal config, "getFromCache", emptyFunction

  create = _getDefaultCreate config, kind

  init = steal config, "init", emptyFunction
  initArguments = _initArguments config
  initValues = ValueDefiner config, ValueDefiner.types

  singleton = steal config, "singleton"

  factory = NamedFunction name, ->
    args = initArguments factory.prototype, arguments
    if optionDefaults?
      args[0] = _mergeOptionDefaults args[0], optionDefaults
    # TODO: Disable validation when not in __DEV__ mode
    if optionTypes? and isType args[0], Object
      try validateTypes args[0], optionTypes, "#{name}.options"
      catch error
        reportFailure error, { instance, args, factory }
    instance = getFromCache.apply factory, args
    return instance if instance isnt undefined
    try instance = create.apply factory, args
    catch error then reportFailure error, { factory, method: "create" }
    setType instance, factory
    prevAutoStart = Reaction.autoStart
    Reaction.autoStart = yes
    try
      initValues instance, args
      init.apply instance, args
    catch error
      reportFailure error, { instance, args, factory }
    Reaction.autoStart = prevAutoStart
    instance

  setType factory, Factory
  setKind factory, kind

  initFactory = steal config, "initFactory", emptyFunction
  initFactory.call factory

  define factory.prototype, ->
    @options = frozen: yes
    @ sync.map config, (value, key) ->
      return { value, enumerable: key[0] isnt "_" }

  return factory() if singleton is yes

  combine statics,
    optionTypes: optionTypes
    optionDefaults: optionDefaults
    Kind: Kind factory

  define factory, ->
    @options = frozen: yes
    @ sync.map statics, (value, key) ->
      return { value, enumerable: key[0] isnt "_" }

module.exports = setKind Factory, Function

#
# Internal
#

_configTypes =
  mixins: [ Array, Void ]
  statics: [ Object, Void ]
  singleton: [ Boolean, Void ]
  initFactory: [ Function, Void ]
  initArguments: [ Function, Void ]
  optionTypes: [ Object, Void ]
  optionDefaults: [ Object, Void ]
  getFromCache: [ Function, Void ]
  customValues: [ Object, Void ]
  initValues: [ Function, Void ]
  initFrozenValues: [ Function, Void ]
  initReactiveValues: [ Function, Void ]
  init: [ Function, Void ]

_getDefaultCreate = (config, kind) ->
  create = steal config, "create"
  func = steal config, "func"
  if create?
    return create
  if func?
    return -> instance = -> func.apply instance, arguments
  switch kind
    when Object then -> {}
    when null then -> Object.create null
    else -> _createInstance.apply kind, arguments

_createInstance = (args...) ->
  new (Function::bind.apply this, [null].concat args)()

_mergeOptionDefaults = (options = {}, optionDefaults) ->
  assertType options, Object
  for key, defaultValue of optionDefaults
    if isType defaultValue, Object
      options[key] = _mergeOptionDefaults options[key], defaultValue
    else if options[key] is undefined
      options[key] = defaultValue
  options

_initArguments = (config) ->
  initArguments = steal config, "initArguments", -> arguments
  return (prototype, args) ->
    args = initArguments.apply prototype, args
    unless isKind(args, Object) and isType(args.length, Number)
      error = TypeError "'#{prototype.constructor.name}.initArguments' must return an Array-like object"
      reportFailure error, { prototype, args }
    sync.map Object.keys(args), (key) -> args[key]
