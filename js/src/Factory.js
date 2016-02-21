var Factory, Kind, NamedFunction, Reaction, ValueDefiner, Void, _configTypes, _createInstance, _getDefaultCreate, _initArguments, _mergeOptionDefaults, assertType, combine, define, emptyFunction, isKind, isType, log, parseErrorStack, ref, reportFailure, setKind, setType, steal, sync, validateTypes,
  slice = [].slice;

ref = require("type-utils"), Void = ref.Void, Kind = ref.Kind, isType = ref.isType, isKind = ref.isKind, setType = ref.setType, setKind = ref.setKind, assertType = ref.assertType, validateTypes = ref.validateTypes;

sync = require("io").sync;

parseErrorStack = require("parseErrorStack");

NamedFunction = require("named-function");

reportFailure = require("report-failure");

emptyFunction = require("emptyFunction");

ValueDefiner = require("ValueDefiner");

Reaction = require("reaction");

combine = require("combine");

define = require("define");

steal = require("steal");

log = require("lotus-log");

Factory = NamedFunction("Factory", function(name, config) {
  var create, factory, getFromCache, init, initArguments, initFactory, initValues, kind, mixins, optionDefaults, optionTypes, singleton, statics;
  assertType(name, String, "name");
  validateTypes(config, _configTypes);
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
  optionTypes = steal(config, "optionTypes");
  optionDefaults = steal(config, "optionDefaults");
  kind = steal(config, "kind", Object);
  getFromCache = steal(config, "getFromCache", emptyFunction);
  create = _getDefaultCreate(config, kind);
  init = steal(config, "init", emptyFunction);
  initArguments = _initArguments(config);
  initValues = ValueDefiner(config, ValueDefiner.types);
  singleton = steal(config, "singleton");
  factory = NamedFunction(name, function() {
    var args, error, instance, prevAutoStart;
    args = initArguments(factory.prototype, arguments);
    if (optionDefaults != null) {
      args[0] = _mergeOptionDefaults(args[0], optionDefaults);
    }
    if ((optionTypes != null) && isType(args[0], Object)) {
      try {
        validateTypes(args[0], optionTypes, name + ".options");
      } catch (_error) {
        error = _error;
        reportFailure(error, {
          instance: instance,
          args: args,
          factory: factory
        });
      }
    }
    instance = getFromCache.apply(factory, args);
    if (instance !== void 0) {
      return instance;
    }
    try {
      instance = create.apply(factory, args);
    } catch (_error) {
      error = _error;
      reportFailure(error, {
        factory: factory,
        method: "create"
      });
    }
    setType(instance, factory);
    prevAutoStart = Reaction.autoStart;
    Reaction.autoStart = true;
    try {
      initValues(instance, args);
      init.apply(instance, args);
    } catch (_error) {
      error = _error;
      reportFailure(error, {
        instance: instance,
        args: args,
        factory: factory
      });
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
      return {
        value: value,
        enumerable: key[0] !== "_"
      };
    }));
  });
});

module.exports = setKind(Factory, Function);

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
  init: [Function, Void]
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
      reportFailure(error, {
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
