var Factory, Kind, NamedFunction, Reaction, Void, _configTypes, _createInstance, _getDefaultCreate, _initArguments, _initBoundMethods, _initValues, _isEnumerableKey, _mergeOptionDefaults, _toPropConfig, _valueBehaviors, assertType, combine, define, emptyFunction, isKind, isType, log, ref, reportFailure, setKind, setType, steal, sync, validateTypes,
  slice = [].slice;

ref = require("type-utils"), Void = ref.Void, Kind = ref.Kind, isType = ref.isType, isKind = ref.isKind, setType = ref.setType, setKind = ref.setKind, assertType = ref.assertType, validateTypes = ref.validateTypes;

NamedFunction = require("named-function");

reportFailure = require("report-failure");

emptyFunction = require("emptyFunction");

Reaction = require("reaction");

sync = require("io").sync;

combine = require("combine");

define = require("define");

steal = require("steal");

log = require("lotus-log");

Factory = NamedFunction("Factory", function(name, config) {
  var create, factory, getFromCache, init, initArguments, initFactory, initValues, kind, mixins, optionDefaults, optionTypes, statics;
  assertType(name, String, "name");
  validateTypes(config, _configTypes);
  mixins = steal(config, "mixins", []);
  sync.each(mixins, function(mixin) {
    return mixin(config);
  });
  statics = steal(config, "statics", {});
  optionTypes = steal(config, "optionTypes");
  optionDefaults = steal(config, "optionDefaults");
  kind = steal(config, "kind", Object);
  create = _getDefaultCreate(config, kind);
  getFromCache = steal(config, "getFromCache", emptyFunction);
  init = steal(config, "init", emptyFunction);
  initArguments = _initArguments(config);
  initValues = _initValues(config);
  factory = NamedFunction(name, function() {
    var args, instance, prevAutoStart;
    args = initArguments(factory.prototype, arguments);
    if (optionDefaults != null) {
      args[0] = _mergeOptionDefaults(args[0], optionDefaults);
    }
    if ((optionTypes != null) && isType(args[0], Object)) {
      validateTypes(args[0], optionTypes);
    }
    instance = getFromCache.apply(factory, args);
    if (instance !== void 0) {
      return instance;
    }
    instance = create.apply(factory, args);
    setType(instance, factory);
    prevAutoStart = Reaction.autoStart;
    Reaction.autoStart = true;
    initValues(instance, args);
    init.apply(instance, args);
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
    return this(sync.map(config, _toPropConfig));
  });
  if (config.singleton === true) {
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
    return this(sync.map(statics, _toPropConfig));
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
  if (!isType(options, Object)) {
    return combine({}, optionDefaults);
  }
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
    return args;
  };
};

_isEnumerableKey = function(key) {
  return key[0] !== "_";
};

_toPropConfig = function(value, key) {
  return {
    value: value,
    enumerable: _isEnumerableKey(key)
  };
};

_valueBehaviors = {
  initValues: {
    options: {
      configurable: false
    },
    getConfig: _toPropConfig
  },
  initFrozenValues: {
    options: {
      frozen: true
    },
    getConfig: _toPropConfig
  },
  initReactiveValues: {
    options: {
      reactive: true,
      configurable: false
    },
    getConfig: _toPropConfig
  }
};

_initValues = function(config) {
  var boundMethods, customValues, initValues, valueBehaviors;
  boundMethods = steal(config, "boundMethods");
  customValues = steal(config, "customValues", {});
  valueBehaviors = sync.map(_valueBehaviors, function(behavior, key) {
    return combine({}, behavior, {
      init: steal(config, key, emptyFunction)
    });
  });
  return initValues = function(instance, args) {
    return define(instance, function() {
      if (boundMethods != null) {
        this.options = {
          frozen: true
        };
        this(_initBoundMethods(instance, boundMethods));
      }
      this.options = {
        configurable: false
      };
      this(customValues);
      return sync.each(valueBehaviors, (function(_this) {
        return function(behavior) {
          var values;
          values = behavior.init.apply(instance, args);
          if (values == null) {
            return;
          }
          if (isType(values, Array)) {
            values = combine.apply(null, values);
          }
          assertType(values, Object);
          _this.options = behavior.options;
          return _this(sync.map(values, behavior.getConfig));
        };
      })(this));
    });
  };
};

_initBoundMethods = function(instance, boundMethods) {
  return sync.reduce(boundMethods, {}, function(methods, key) {
    var error, keyPath, method;
    method = instance[key];
    if (!isKind(method, Function)) {
      keyPath = instance.constructor.name + "." + key;
      error = TypeError("'" + keyPath + "' must be a Function!");
      reportFailure(error, {
        instance: instance,
        key: key
      });
    }
    methods[key] = {
      enumerable: _isEnumerableKey(key),
      value: method.bind(instance)
    };
    return methods;
  });
};

//# sourceMappingURL=../../map/src/Factory.map
