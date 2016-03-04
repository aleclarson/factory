
{ Void
  Kind
  isType
  isKind
  setType
  setKind
  assert
  assertType
  validateTypes } = require "type-utils"

{ ValueDefiner
  BoundMethodCreator
  CustomValueCreator
  FrozenValueCreator
  WritableValueCreator
  ReactiveValueCreator } = require "ValueDefiner"

{ throwFailure } = require "failure"

{ sync } = require "io"

NamedFunction = require "named-function"
emptyFunction = require "emptyFunction"
Reaction = require "reaction"
LazyVar = require "lazy-var"
combine = require "combine"
define = require "define"
steal = require "steal"

# The `__id` of the highest level factory in the creation chain.
highestLevel = null

registeredNames = Object.create null

module.exports =
Factory = NamedFunction "Factory", (name, config) ->

  assertType name, String, "name"
  validateTypes config, _configTypes

  mixins = steal config, "mixins", []
  sync.each mixins, (mixin) ->
    assertType mixin, Function, { name, mixin, mixins }
    mixin name, config

  # disableStateHistory = steal config, "disableStateHistory", no
  # unless disableStateHistory
  #   StateHistory = require "state-history"
  #   StateHistory.mixin name, config

  statics = steal config, "statics", {}

  initArguments = _initArguments config

  optionTypes = steal config, "optionTypes"
  optionDefaults = steal config, "optionDefaults"
  optionsIndex = steal config, "optionsIndex", 0

  singleton = steal config, "singleton"
  kind = steal config, "kind", Object

  getFromCache = steal config, "getFromCache", emptyFunction
  willCreate = steal config, "willCreate", emptyFunction
  create = _getDefaultCreate config, kind
  didCreate = steal config, "didCreate", emptyFunction

  didInit = steal config, "didInit", emptyFunction
  init = steal config, "init", emptyFunction
  initValues = ValueDefiner config,
    valueCreatorTypes: combine {}, _valueCreatorTypes, (steal config, "valueCreatorTypes")
    defineValues: steal config, "defineValues"
    didDefineValues: steal config, "didDefineValues"

  assert not registeredNames[name]?, { name, reason: "Factory names must be unique!" }

  registeredNames[name] = yes
  instanceCount = 0

  factory = NamedFunction name, ->

    args = initArguments factory.prototype, arguments
    args[optionsIndex] = _mergeOptionDefaults args[optionsIndex], optionDefaults if optionDefaults?
    _validateOptionTypes args[optionsIndex], optionTypes, factory if optionTypes?

    # See if an instance is already cached.
    instance = getFromCache.apply factory, args
    return instance if instance isnt undefined

    higherLevel = highestLevel
    highestLevel ?= name + "_" + instanceCount++

    unless higherLevel?
      willCreate.call null, highestLevel, args

      # unless disableStateHistory
      #   initialActions = []
      #   historyListener = (action) -> initialActions.push action
      #   StateHistory.addListener historyListener

    try instance = create.apply factory, args
    catch error then throwFailure error, { method: "create", factory, args }
    setType instance, factory

    if highestLevel?
      define instance, "__id", { value: highestLevel, enumerable: no, frozen: yes }
      highestLevel = null

    unless higherLevel?
      assertType instance, factory, { key: "instance.constructor" }
      didCreate.apply instance, args

    prevAutoStart = Reaction.autoStart
    Reaction.autoStart = yes
    try
      initValues instance, args
      init.apply instance, args
    catch error
      throwFailure error, { instance, factory, args }

    unless higherLevel?
      didInit.apply instance, args

      # unless disableStateHistory
      #   define instance, "__initialActions", { value: initialActions, enumerable: no }
      #   StateHistory.removeListener historyListener

    Reaction.autoStart = prevAutoStart
    return instance

  setType factory, Factory
  setKind factory, kind

  initFactory = steal config, "initFactory", emptyFunction
  initFactory.call factory

  define factory.prototype, ->
    @options = frozen: yes
    @ sync.map config, (value, key) ->
      return { value, enumerable: key[0] isnt "_" }

  if singleton is yes
    return factory()

  combine statics,
    optionTypes: optionTypes
    optionDefaults: optionDefaults
    Kind: Kind factory

  define factory, ->
    @options = frozen: yes
    @ sync.map statics, (value, key) ->
      enumerable = key[0] isnt "_"
      if isType value, LazyVar then {
        get: -> value.get()
        set: -> value.set arguments[0]
        enumerable
      } else {
        value
        enumerable
      }

setKind Factory, Function

#
# Internal
#

_configTypes = {
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
  onValuesCreated: [ Function, Void ]
  init: [ Function, Void ]
}

_valueCreatorTypes = {
  boundMethods: BoundMethodCreator()
  customValues: CustomValueCreator()
  initFrozenValues: FrozenValueCreator()
  initValues: WritableValueCreator()
  initReactiveValues: ReactiveValueCreator()
}

_getDefaultCreate = (config, kind) ->
  create = steal config, "create"
  func = steal config, "func"
  if create?
    return create
  if func?
    return ->
      instance = ->
        func.apply instance, arguments
  switch kind
    when Object then -> {}
    when null then -> Object.create null
    else -> _createInstance.apply kind, arguments

_createInstance = (args...) ->
  new (Function::bind.apply this, [null].concat args)()

_validateOptionTypes = (options, optionTypes, factory) ->
  # if __DEV__
  return unless isType options, Object
  try validateTypes options, optionTypes
  catch error then throwFailure error, { factory }

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
      throwFailure error, { prototype, args }
    sync.map Object.keys(args), (key) -> args[key]
