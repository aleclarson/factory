
{ Void
  Null
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

NamedFunction = require "named-function"
emptyFunction = require "emptyFunction"
Reaction = require "reaction"
combine = require "combine"
define = require "define"
steal = require "steal"
isDev = require "isDev"
sync = require "sync"

# The `__id` of the highest level factory in the creation chain.
highestLevel = null

registeredNames = Object.create null

Factory = NamedFunction "Factory", (name, config) ->

  assertType name, String, "name"
  validateTypes config, Factory.configTypes

  mixins = steal config, "mixins", []
  sync.each mixins, (mixin) ->
    assertType mixin, Function, { name, mixin, mixins }
    mixin config

  statics = steal config, "statics", {}

  initArguments = Factory.initArguments config

  optionTypes = steal config, "optionTypes"
  optionDefaults = steal config, "optionDefaults"
  optionsIndex = steal config, "optionsIndex", 0

  singleton = steal config, "singleton"
  kind = steal config, "kind", Object

  getFromCache = steal config, "getFromCache", emptyFunction
  willCreate = steal config, "willCreate", emptyFunction
  create = Factory.getDefaultCreate config, kind
  didCreate = steal config, "didCreate", emptyFunction

  didInit = steal config, "didInit", emptyFunction
  init = steal config, "init", emptyFunction
  initValues = ValueDefiner config,
    valueCreatorTypes: combine {}, Factory.valueCreators, (steal config, "valueCreators")
    defineValues: steal config, "defineValues"
    didDefineValues: steal config, "didDefineValues"

  assert not registeredNames[name]?, { name, reason: "Factory names must be unique!" }

  registeredNames[name] = yes
  instanceCount = 0

  factory = NamedFunction name, ->

    args = initArguments arguments
    args[optionsIndex] = Factory.mergeOptionDefaults args[optionsIndex], optionDefaults if optionDefaults?
    Factory.validateOptionTypes args[optionsIndex], optionTypes, factory if optionTypes?

    instance = getFromCache.apply factory, args
    return instance if instance isnt undefined

    higherLevel = highestLevel
    highestLevel ?= name + "_" + instanceCount++

    unless higherLevel?
      willCreate.call null, highestLevel, args

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

    if isDev
      try
        initValues instance, args
        init.apply instance, args
      catch error
        throwFailure error, { instance, factory, args }

    else
      initValues instance, args
      init.apply instance, args

    unless higherLevel?
      didInit.apply instance, args

    Reaction.autoStart = prevAutoStart
    return instance

  setType factory, Factory
  setKind factory, kind

  initFactory = steal config, "initFactory", emptyFunction
  initFactory.call factory

  define factory.prototype, ->
    @options = frozen: no
    @ sync.map config, (value, key) ->
      return { value, enumerable: key[0] isnt "_" }

  if singleton is yes
    return factory()

  statics.optionTypes = value: optionTypes
  statics.optionDefaults = value: optionDefaults
  statics.Kind = lazy: -> Kind factory

  statics = sync.map statics, (value, key) ->
    enumerable = key[0] isnt "_"
    if isType value, Object
      value.frozen ?= yes
      value.enumerable ?= enumerable
      return value
    return {
      value
      frozen: yes
      enumerable
    }

  define factory, statics

module.exports = setKind Factory, Function

define Factory,

  configTypes: value: {
    mixins: [ Array, Void ]
    kind: [ Factory, Null, Void ]
    getFromCache: [ Function, Void ]
    create: [ Function, Void ]
    func: [ Function, Void ]
    statics: [ Object, Void ]
    singleton: [ Boolean, Void ]
    initFactory: [ Function, Void ]
    initArguments: [ Function, Void ]
    optionTypes: [ Object, Void ]
    optionDefaults: [ Object, Void ]
    optionsIndex: [ Number, Void ]
    getFromCache: [ Function, Void ]
    customValues: [ Object, Void ]
    initValues: [ Function, Void ]
    initFrozenValues: [ Function, Void ]
    initReactiveValues: [ Function, Void ]
    init: [ Function, Void ]
    willCreate: [ Function, Void ]
    didCreate: [ Function, Void ]
    didInit: [ Function, Void ]
    valueCreators: [ Array, Void ]
    defineValues: [ Function, Void ]
    didDefineValues: [ Function, Void ]
  }

  valueCreators: value: {
    boundMethods: BoundMethodCreator()
    customValues: CustomValueCreator()
    initFrozenValues: FrozenValueCreator()
    initValues: WritableValueCreator()
    initReactiveValues: ReactiveValueCreator()
  }

  createInstance: (args...) ->
    new (Function::bind.apply this, [null].concat args)()

  getDefaultCreate: (config, kind) ->
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
      else -> Factory.createInstance.apply kind, arguments

  initArguments: (config) ->
    initArguments = steal config, "initArguments", -> arguments
    return (args) ->
      args = initArguments.apply null, args
      unless isKind(args, Object) and isType(args.length, Number)
        error = TypeError "'#{prototype.constructor.name}.initArguments' must return an Array-like object"
        throwFailure error, { prototype, args }
      sync.map Object.keys(args), (key) -> args[key]

  validateOptionTypes: (options, optionTypes, factory) ->
    return if isDev
    return unless isType options, Object
    try validateTypes options, optionTypes
    catch error then throwFailure error, { factory }

  mergeOptionDefaults: (options = {}, optionDefaults) ->
    assertType options, Object
    for key, defaultValue of optionDefaults
      if isType defaultValue, Object
        options[key] = Factory.mergeOptionDefaults options[key], defaultValue
      else if options[key] is undefined
        options[key] = defaultValue
    options
