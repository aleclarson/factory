
{ Void, Kind,
  isType, isKind,
  setType, setKind,
  assertType, validateTypes } = require "type-utils"

NamedFunction = require "named-function"
reportFailure = require "report-failure"
emptyFunction = require "emptyFunction"
Reaction = require "reaction"
{ sync } = require "io"
combine = require "combine"
define = require "define"
steal = require "steal"
log = require "lotus-log"

Factory = NamedFunction "Factory", (name, config) ->

  assertType name, String, "name"
  validateTypes config, _configTypes

  mixins = steal config, "mixins", []
  sync.each mixins, (mixin) -> mixin config

  statics = steal config, "statics", {}
  optionTypes = steal config, "optionTypes"
  optionDefaults = steal config, "optionDefaults"

  kind = steal config, "kind", Object
  create = _getDefaultCreate config, kind
  getFromCache = steal config, "getFromCache", emptyFunction
  init = steal config, "init", emptyFunction
  initArguments = _initArguments config
  initValues = _initValues config

  factory = NamedFunction name, ->
    args = initArguments factory.prototype, arguments
    if optionDefaults?
      args[0] = _mergeOptionDefaults args[0], optionDefaults
    # TODO: Disable validation when not in __DEV__ mode
    if optionTypes? and isType args[0], Object
      validateTypes args[0], optionTypes
    instance = getFromCache.apply factory, args
    return instance if instance isnt undefined
    instance = create.apply factory, args
    setType instance, factory
    prevAutoStart = Reaction.autoStart
    Reaction.autoStart = yes
    initValues instance, args
    init.apply instance, args
    Reaction.autoStart = prevAutoStart
    instance

  setType factory, Factory
  setKind factory, kind

  initFactory = steal config, "initFactory", emptyFunction
  initFactory.call factory

  define factory.prototype, ->
    @options = frozen: yes
    @ sync.map config, _toPropConfig

  if config.singleton is yes
    return factory()

  combine statics,
    optionTypes: optionTypes
    optionDefaults: optionDefaults
    Kind: Kind factory

  define factory, ->
    @options = frozen: yes
    @ sync.map statics, _toPropConfig

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
    return ->
      instance = ->
        func.apply instance, arguments
  switch kind
    when Object then -> {}
    when null then -> Object.create null
    else -> _createInstance.apply kind, arguments

_createInstance = (args...) ->
  new (Function::bind.apply this, [null].concat args)()

_mergeOptionDefaults = (options, optionDefaults) ->
  unless isType options, Object
    return combine {}, optionDefaults
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
    args

_isEnumerableKey = (key) ->
  key[0] isnt "_"

_toPropConfig = (value, key) ->
  { value, enumerable: _isEnumerableKey key }

_valueBehaviors =

  initValues:
    options: { configurable: no }
    getConfig: _toPropConfig

  initFrozenValues:
    options: { frozen: yes }
    getConfig: _toPropConfig

  initReactiveValues:
    options: { reactive: yes, configurable: no }
    getConfig: _toPropConfig

_initValues = (config) ->
  boundMethods = steal config, "boundMethods"
  customValues = steal config, "customValues", {}
  valueBehaviors = sync.map _valueBehaviors, (behavior, key) ->
    combine {}, behavior, init: steal config, key, emptyFunction
  return initValues = (instance, args) ->
    define instance, ->

      if boundMethods?
        @options = { frozen: yes }
        @ _initBoundMethods instance, boundMethods

      @options = { configurable: no }
      @ customValues

      sync.each valueBehaviors, (behavior) =>
        values = behavior.init.apply instance, args
        return unless values?
        values = combine.apply null, values if isType values, Array
        assertType values, Object
        @options = behavior.options
        @ sync.map values, behavior.getConfig

_initBoundMethods = (instance, boundMethods) ->

  sync.reduce boundMethods, {}, (methods, key) ->

    method = instance[key]

    unless isKind method, Function
      keyPath = instance.constructor.name + "." + key
      error = TypeError "'#{keyPath}' must be a Function!"
      reportFailure error, { instance, key }

    methods[key] =
      enumerable: _isEnumerableKey key
      value: method.bind instance

    methods
