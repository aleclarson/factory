
require "isDev"

{ Void
  Null
  Kind
  Maybe
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

NamedFunction = require "NamedFunction"
emptyFunction = require "emptyFunction"
mergeDefaults = require "mergeDefaults"
Injector = require "injector"
combine = require "combine"
define = require "define"
steal = require "steal"
guard = require "guard"
sync = require "sync"

# The `__id` of the highest level factory in the creation chain.
highestLevel = null

registeredNames = Object.create null

ReactionInjector = Injector "Reaction"

module.exports =
Factory = NamedFunction "Factory", (name, config) ->

  assertType name, String, "name"
  validateTypes config, Factory.configTypes

  mixins = steal config, "mixins", []
  sync.each mixins, (mixin) ->
    assertType mixin, Function, { name, mixin, mixins }
    mixin config

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

    args = [] # The 'arguments' object cannot be leaked!
    args.push arg for arg in arguments

    args = initArguments args

    if optionDefaults
      args[optionsIndex] ?= {}
      mergeDefaults args[optionsIndex], optionDefaults

    if isDev and optionTypes and isType args[optionsIndex], Object
      guard -> validateTypes args[optionsIndex], optionTypes
      .fail (error) -> throwFailure error, { factory }

    instance = getFromCache.apply factory, args
    return instance if instance isnt undefined

    higherLevel = highestLevel
    highestLevel ?= name + "_" + instanceCount++

    unless higherLevel?
      willCreate.call null, highestLevel, args

    instance = guard -> create.apply factory, args
    .fail (error) -> throwFailure error, { method: "create", factory, args }

    setType instance, factory

    if highestLevel?
      define instance, "__id", { value: highestLevel, enumerable: no, frozen: yes }
      highestLevel = null

    unless higherLevel?
      assertType instance, factory, { key: "instance.constructor" }
      didCreate.apply instance, args

    guard ->
      ReactionInjector.push "autoStart", yes
      initValues instance, args
      ReactionInjector.pop "autoStart"
      init.apply instance, args
    .fail (error) ->
      throwFailure error, { instance, factory, args }

    unless higherLevel?
      didInit.apply instance, args

    return instance

  setType factory, Factory
  setKind factory, kind

  statics = Factory.initStatics config,
    optionTypes: { value: optionTypes }
    optionDefaults: { value: optionDefaults }
    Kind: Kind factory
    Maybe: Maybe factory

  initFactory = steal config, "initFactory", emptyFunction
  initFactory.call factory

  define factory.prototype, config

  if singleton is yes
    return factory()

  define factory, statics

  factory

setKind Factory, Function

# Transform built-in types into factories!
require("./Builtin") Factory

define Factory,

  Kind: Kind Factory

  Maybe: Maybe Factory

  configTypes: value:
    mixins: Array.Maybe
    kind: [ Kind(Function), Null, Void ]
    getFromCache: Function.Maybe
    create: Function.Maybe
    func: Function.Maybe
    statics: Object.Maybe
    singleton: Boolean.Maybe
    initFactory: Function.Maybe
    initArguments: Function.Maybe
    optionTypes: Object.Maybe
    optionDefaults: Object.Maybe
    optionsIndex: Number.Maybe
    getFromCache: Function.Maybe
    customValues: Object.Maybe
    initValues: Function.Maybe
    initFrozenValues: Function.Maybe
    initReactiveValues: Function.Maybe
    init: Function.Maybe
    willCreate: Function.Maybe
    didCreate: Function.Maybe
    didInit: Function.Maybe
    valueCreators: Array.Maybe
    defineValues: Function.Maybe
    didDefineValues: Function.Maybe

  valueCreators: value:
    boundMethods: BoundMethodCreator()
    customValues: CustomValueCreator()
    initFrozenValues: FrozenValueCreator()
    initValues: WritableValueCreator()
    initReactiveValues: ReactiveValueCreator()

  getDefaultCreate: (config, kind) ->
    create = steal config, "create"
    func = steal config, "func"
    if create then create
    else if func then -> self = -> func.apply self, arguments
    else if kind is Object then -> {}
    else if kind is Array then -> []
    else if kind is null then -> Object.create null
    else ->
      args = [ null ]
      args.push arg for arg in arguments
      new (Function::bind.apply kind, args)()

  initArguments: (config) ->
    initArguments = steal config, "initArguments", -> arguments
    return (args) ->
      args = initArguments.apply null, args
      unless isKind(args, Object) and isType(args.length, Number)
        error = TypeError "'initArguments' must return an Array-like object"
        throwFailure error, { args }
      sync.map Object.keys(args), (key) -> args[key]

  initStatics: (config, defaultValues) ->

    statics = steal config, "statics", {}

    sync.each defaultValues, (value, key) ->
      statics[key] = value

    sync.map statics, (value, key) ->
      enumerable = key[0] isnt "_"
      if isType value, Object
        value.enumerable ?= enumerable
        return value
      { value, enumerable }
