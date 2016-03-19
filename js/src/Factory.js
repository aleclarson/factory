var BoundMethodCreator, CustomValueCreator, Factory, FrozenValueCreator, Kind, NamedFunction, Null, Reaction, ReactiveValueCreator, ValueDefiner, Void, WritableValueCreator, assert, assertType, combine, define, emptyFunction, highestLevel, isDev, isKind, isType, ref, ref1, registeredNames, setKind, setType, steal, sync, throwFailure, validateTypes,
  slice = [].slice;

ref = require("type-utils"), Void = ref.Void, Null = ref.Null, Kind = ref.Kind, isType = ref.isType, isKind = ref.isKind, setType = ref.setType, setKind = ref.setKind, assert = ref.assert, assertType = ref.assertType, validateTypes = ref.validateTypes;

ref1 = require("ValueDefiner"), ValueDefiner = ref1.ValueDefiner, BoundMethodCreator = ref1.BoundMethodCreator, CustomValueCreator = ref1.CustomValueCreator, FrozenValueCreator = ref1.FrozenValueCreator, WritableValueCreator = ref1.WritableValueCreator, ReactiveValueCreator = ref1.ReactiveValueCreator;

throwFailure = require("failure").throwFailure;

NamedFunction = require("named-function");

emptyFunction = require("emptyFunction");

Reaction = require("reaction");

combine = require("combine");

define = require("define");

steal = require("steal");

isDev = require("isDev");

sync = require("sync");

highestLevel = null;

registeredNames = Object.create(null);

Factory = NamedFunction("Factory", function(name, config) {
  var create, didCreate, didInit, factory, getFromCache, init, initArguments, initFactory, initValues, instanceCount, kind, mixins, optionDefaults, optionTypes, optionsIndex, singleton, statics, willCreate;
  assertType(name, String, "name");
  validateTypes(config, Factory.configTypes);
  mixins = steal(config, "mixins", []);
  sync.each(mixins, function(mixin) {
    assertType(mixin, Function, {
      name: name,
      mixin: mixin,
      mixins: mixins
    });
    return mixin(config);
  });
  statics = steal(config, "statics", {});
  initArguments = Factory.initArguments(config);
  optionTypes = steal(config, "optionTypes");
  optionDefaults = steal(config, "optionDefaults");
  optionsIndex = steal(config, "optionsIndex", 0);
  singleton = steal(config, "singleton");
  kind = steal(config, "kind", Object);
  getFromCache = steal(config, "getFromCache", emptyFunction);
  willCreate = steal(config, "willCreate", emptyFunction);
  create = Factory.getDefaultCreate(config, kind);
  didCreate = steal(config, "didCreate", emptyFunction);
  didInit = steal(config, "didInit", emptyFunction);
  init = steal(config, "init", emptyFunction);
  initValues = ValueDefiner(config, {
    valueCreatorTypes: combine({}, Factory.valueCreators, steal(config, "valueCreators")),
    defineValues: steal(config, "defineValues"),
    didDefineValues: steal(config, "didDefineValues")
  });
  assert(registeredNames[name] == null, {
    name: name,
    reason: "Factory names must be unique!"
  });
  registeredNames[name] = true;
  instanceCount = 0;
  factory = NamedFunction(name, function() {
    var args, error, higherLevel, instance, prevAutoStart;
    args = initArguments(arguments);
    if (optionDefaults != null) {
      args[optionsIndex] = Factory.mergeOptionDefaults(args[optionsIndex], optionDefaults);
    }
    if (optionTypes != null) {
      Factory.validateOptionTypes(args[optionsIndex], optionTypes, factory);
    }
    instance = getFromCache.apply(factory, args);
    if (instance !== void 0) {
      return instance;
    }
    higherLevel = highestLevel;
    if (highestLevel == null) {
      highestLevel = name + "_" + instanceCount++;
    }
    if (higherLevel == null) {
      willCreate.call(null, highestLevel, args);
    }
    try {
      instance = create.apply(factory, args);
    } catch (_error) {
      error = _error;
      throwFailure(error, {
        method: "create",
        factory: factory,
        args: args
      });
    }
    setType(instance, factory);
    if (highestLevel != null) {
      define(instance, "__id", {
        value: highestLevel,
        enumerable: false,
        frozen: true
      });
      highestLevel = null;
    }
    if (higherLevel == null) {
      assertType(instance, factory, {
        key: "instance.constructor"
      });
      didCreate.apply(instance, args);
    }
    prevAutoStart = Reaction.autoStart;
    Reaction.autoStart = true;
    if (isDev) {
      try {
        initValues(instance, args);
        init.apply(instance, args);
      } catch (_error) {
        error = _error;
        throwFailure(error, {
          instance: instance,
          factory: factory,
          args: args
        });
      }
    } else {
      initValues(instance, args);
      init.apply(instance, args);
    }
    if (higherLevel == null) {
      didInit.apply(instance, args);
    }
    Reaction.autoStart = prevAutoStart;
    return instance;
  });
  setType(factory, Factory);
  setKind(factory, kind);
  initFactory = steal(config, "initFactory", emptyFunction);
  initFactory.call(factory);
  define(factory.prototype, function() {
    this.options = {
      frozen: false
    };
    return this(sync.map(config, function(value, key) {
      return {
        value: value,
        enumerable: key[0] !== "_"
      };
    }));
  });
  if (singleton === true) {
    return factory();
  }
  statics.optionTypes = {
    value: optionTypes
  };
  statics.optionDefaults = {
    value: optionDefaults
  };
  statics.Kind = {
    lazy: function() {
      return Kind(factory);
    }
  };
  statics = sync.map(statics, function(value, key) {
    var enumerable;
    enumerable = key[0] !== "_";
    if (isType(value, Object)) {
      if (value.frozen == null) {
        value.frozen = true;
      }
      if (value.enumerable == null) {
        value.enumerable = enumerable;
      }
      return value;
    }
    return {
      value: value,
      frozen: true,
      enumerable: enumerable
    };
  });
  return define(factory, statics);
});

module.exports = setKind(Factory, Function);

define(Factory, {
  configTypes: {
    value: {
      mixins: [Array, Void],
      kind: [Factory, Null, Void],
      getFromCache: [Function, Void],
      create: [Function, Void],
      func: [Function, Void],
      statics: [Object, Void],
      singleton: [Boolean, Void],
      initFactory: [Function, Void],
      initArguments: [Function, Void],
      optionTypes: [Object, Void],
      optionDefaults: [Object, Void],
      optionsIndex: [Number, Void],
      getFromCache: [Function, Void],
      customValues: [Object, Void],
      initValues: [Function, Void],
      initFrozenValues: [Function, Void],
      initReactiveValues: [Function, Void],
      init: [Function, Void],
      willCreate: [Function, Void],
      didCreate: [Function, Void],
      didInit: [Function, Void],
      valueCreators: [Array, Void],
      defineValues: [Function, Void],
      didDefineValues: [Function, Void]
    }
  },
  valueCreators: {
    value: {
      boundMethods: BoundMethodCreator(),
      customValues: CustomValueCreator(),
      initFrozenValues: FrozenValueCreator(),
      initValues: WritableValueCreator(),
      initReactiveValues: ReactiveValueCreator()
    }
  },
  createInstance: function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return new (Function.prototype.bind.apply(this, [null].concat(args)))();
  },
  getDefaultCreate: function(config, kind) {
    var create, func;
    create = steal(config, "create");
    func = steal(config, "func");
    if (create != null) {
      return create;
    }
    if (func != null) {
      return function() {
        var instance;
        return instance = function() {
          return func.apply(instance, arguments);
        };
      };
    }
    switch (kind) {
      case Object:
        return function() {
          return {};
        };
      case null:
        return function() {
          return Object.create(null);
        };
      default:
        return function() {
          return Factory.createInstance.apply(kind, arguments);
        };
    }
  },
  initArguments: function(config) {
    var initArguments;
    initArguments = steal(config, "initArguments", function() {
      return arguments;
    });
    return function(args) {
      var error;
      args = initArguments.apply(null, args);
      if (!(isKind(args, Object) && isType(args.length, Number))) {
        error = TypeError("'" + prototype.constructor.name + ".initArguments' must return an Array-like object");
        throwFailure(error, {
          prototype: prototype,
          args: args
        });
      }
      return sync.map(Object.keys(args), function(key) {
        return args[key];
      });
    };
  },
  validateOptionTypes: function(options, optionTypes, factory) {
    var error;
    if (isDev) {
      return;
    }
    if (!isType(options, Object)) {
      return;
    }
    try {
      return validateTypes(options, optionTypes);
    } catch (_error) {
      error = _error;
      return throwFailure(error, {
        factory: factory
      });
    }
  },
  mergeOptionDefaults: function(options, optionDefaults) {
    var defaultValue, key;
    if (options == null) {
      options = {};
    }
    assertType(options, Object);
    for (key in optionDefaults) {
      defaultValue = optionDefaults[key];
      if (isType(defaultValue, Object)) {
        options[key] = Factory.mergeOptionDefaults(options[key], defaultValue);
      } else if (options[key] === void 0) {
        options[key] = defaultValue;
      }
    }
    return options;
  }
});

//# sourceMappingURL=../../map/src/Factory.map
