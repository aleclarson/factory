var BoundMethodCreator, CustomValueCreator, Factory, FrozenValueCreator, Kind, LazyVar, NamedFunction, Reaction, ReactiveValueCreator, ValueDefiner, Void, WritableValueCreator, _configTypes, _createInstance, _getDefaultCreate, _initArguments, _mergeOptionDefaults, _validateOptionTypes, _valueCreatorTypes, assert, assertType, combine, define, emptyFunction, highestLevel, isKind, isType, ref, ref1, registeredNames, setKind, setType, steal, sync, throwFailure, validateTypes,
  slice = [].slice;

ref = require("type-utils"), Void = ref.Void, Kind = ref.Kind, isType = ref.isType, isKind = ref.isKind, setType = ref.setType, setKind = ref.setKind, assert = ref.assert, assertType = ref.assertType, validateTypes = ref.validateTypes;

ref1 = require("ValueDefiner"), ValueDefiner = ref1.ValueDefiner, BoundMethodCreator = ref1.BoundMethodCreator, CustomValueCreator = ref1.CustomValueCreator, FrozenValueCreator = ref1.FrozenValueCreator, WritableValueCreator = ref1.WritableValueCreator, ReactiveValueCreator = ref1.ReactiveValueCreator;

throwFailure = require("failure").throwFailure;

sync = require("io").sync;

NamedFunction = require("named-function");

emptyFunction = require("emptyFunction");

Reaction = require("reaction");

LazyVar = require("lazy-var");

combine = require("combine");

define = require("define");

steal = require("steal");

highestLevel = null;

registeredNames = Object.create(null);

module.exports = Factory = NamedFunction("Factory", function(name, config) {
  var create, didCreate, didInit, factory, getFromCache, init, initArguments, initFactory, initValues, instanceCount, kind, mixins, optionDefaults, optionTypes, optionsIndex, singleton, statics, willCreate;
  assertType(name, String, "name");
  validateTypes(config, _configTypes);
  mixins = steal(config, "mixins", []);
  sync.each(mixins, function(mixin) {
    assertType(mixin, Function, {
      name: name,
      mixin: mixin,
      mixins: mixins
    });
    return mixin(name, config);
  });
  statics = steal(config, "statics", {});
  initArguments = _initArguments(config);
  optionTypes = steal(config, "optionTypes");
  optionDefaults = steal(config, "optionDefaults");
  optionsIndex = steal(config, "optionsIndex", 0);
  singleton = steal(config, "singleton");
  kind = steal(config, "kind", Object);
  getFromCache = steal(config, "getFromCache", emptyFunction);
  willCreate = steal(config, "willCreate", emptyFunction);
  create = _getDefaultCreate(config, kind);
  didCreate = steal(config, "didCreate", emptyFunction);
  didInit = steal(config, "didInit", emptyFunction);
  init = steal(config, "init", emptyFunction);
  initValues = ValueDefiner(config, {
    valueCreatorTypes: combine({}, _valueCreatorTypes, steal(config, "valueCreatorTypes")),
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
    args = initArguments(factory.prototype, arguments);
    if (optionDefaults != null) {
      args[optionsIndex] = _mergeOptionDefaults(args[optionsIndex], optionDefaults);
    }
    if (optionTypes != null) {
      _validateOptionTypes(args[optionsIndex], optionTypes, factory);
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
      frozen: true
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
  combine(statics, {
    optionTypes: optionTypes,
    optionDefaults: optionDefaults,
    Kind: Kind(factory)
  });
  return define(factory, function() {
    this.options = {
      frozen: true
    };
    return this(sync.map(statics, function(value, key) {
      var enumerable;
      enumerable = key[0] !== "_";
      if (isType(value, LazyVar)) {
        return {
          get: function() {
            return value.get();
          },
          set: function() {
            return value.set(arguments[0]);
          },
          enumerable: enumerable
        };
      } else {
        return {
          value: value,
          enumerable: enumerable
        };
      }
    }));
  });
});

setKind(Factory, Function);

_configTypes = {
  mixins: [Array, Void],
  statics: [Object, Void],
  singleton: [Boolean, Void],
  initFactory: [Function, Void],
  initArguments: [Function, Void],
  optionTypes: [Object, Void],
  optionDefaults: [Object, Void],
  getFromCache: [Function, Void],
  customValues: [Object, Void],
  initValues: [Function, Void],
  initFrozenValues: [Function, Void],
  initReactiveValues: [Function, Void],
  onValuesCreated: [Function, Void],
  init: [Function, Void]
};

_valueCreatorTypes = {
  boundMethods: BoundMethodCreator(),
  customValues: CustomValueCreator(),
  initFrozenValues: FrozenValueCreator(),
  initValues: WritableValueCreator(),
  initReactiveValues: ReactiveValueCreator()
};

_getDefaultCreate = function(config, kind) {
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
        return _createInstance.apply(kind, arguments);
      };
  }
};

_createInstance = function() {
  var args;
  args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
  return new (Function.prototype.bind.apply(this, [null].concat(args)))();
};

_validateOptionTypes = function(options, optionTypes, factory) {
  var error;
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
};

_mergeOptionDefaults = function(options, optionDefaults) {
  var defaultValue, key;
  if (options == null) {
    options = {};
  }
  assertType(options, Object);
  for (key in optionDefaults) {
    defaultValue = optionDefaults[key];
    if (isType(defaultValue, Object)) {
      options[key] = _mergeOptionDefaults(options[key], defaultValue);
    } else if (options[key] === void 0) {
      options[key] = defaultValue;
    }
  }
  return options;
};

_initArguments = function(config) {
  var initArguments;
  initArguments = steal(config, "initArguments", function() {
    return arguments;
  });
  return function(prototype, args) {
    var error;
    args = initArguments.apply(prototype, args);
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
};

//# sourceMappingURL=../../map/src/Factory.map
