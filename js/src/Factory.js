var BoundMethodCreator, CustomValueCreator, Factory, FrozenValueCreator, Injector, Kind, Maybe, NamedFunction, Null, ReactionInjector, ReactiveValueCreator, ValueDefiner, Void, WritableValueCreator, assert, assertType, combine, define, emptyFunction, guard, highestLevel, isKind, isType, mergeDefaults, ref, ref1, registeredNames, setKind, setType, steal, sync, throwFailure, validateTypes;

require("isDev");

ref = require("type-utils"), Void = ref.Void, Null = ref.Null, Kind = ref.Kind, Maybe = ref.Maybe, isType = ref.isType, isKind = ref.isKind, setType = ref.setType, setKind = ref.setKind, assert = ref.assert, assertType = ref.assertType, validateTypes = ref.validateTypes;

ref1 = require("ValueDefiner"), ValueDefiner = ref1.ValueDefiner, BoundMethodCreator = ref1.BoundMethodCreator, CustomValueCreator = ref1.CustomValueCreator, FrozenValueCreator = ref1.FrozenValueCreator, WritableValueCreator = ref1.WritableValueCreator, ReactiveValueCreator = ref1.ReactiveValueCreator;

throwFailure = require("failure").throwFailure;

NamedFunction = require("NamedFunction");

emptyFunction = require("emptyFunction");

mergeDefaults = require("mergeDefaults");

Injector = require("injector");

combine = require("combine");

define = require("define");

steal = require("steal");

guard = require("guard");

sync = require("sync");

highestLevel = null;

registeredNames = Object.create(null);

ReactionInjector = Injector("Reaction");

module.exports = Factory = NamedFunction("Factory", function(name, config) {
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
    var arg, args, higherLevel, i, instance, len;
    args = [];
    for (i = 0, len = arguments.length; i < len; i++) {
      arg = arguments[i];
      args.push(arg);
    }
    args = initArguments(args);
    if (optionDefaults) {
      if (args[optionsIndex] == null) {
        args[optionsIndex] = {};
      }
      mergeDefaults(args[optionsIndex], optionDefaults);
    }
    if (isDev && optionTypes && isType(args[optionsIndex], Object)) {
      guard(function() {
        return validateTypes(args[optionsIndex], optionTypes);
      }).fail(function(error) {
        return throwFailure(error, {
          factory: factory
        });
      });
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
    instance = guard(function() {
      return create.apply(factory, args);
    }).fail(function(error) {
      return throwFailure(error, {
        method: "create",
        factory: factory,
        args: args
      });
    });
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
    guard(function() {
      ReactionInjector.push("autoStart", true);
      initValues(instance, args);
      ReactionInjector.pop("autoStart");
      return init.apply(instance, args);
    }).fail(function(error) {
      return throwFailure(error, {
        instance: instance,
        factory: factory,
        args: args
      });
    });
    if (higherLevel == null) {
      didInit.apply(instance, args);
    }
    return instance;
  });
  setType(factory, Factory);
  setKind(factory, kind);
  statics = Factory.initStatics(config, {
    optionTypes: {
      value: optionTypes
    },
    optionDefaults: {
      value: optionDefaults
    },
    Kind: Kind(factory),
    Maybe: Maybe(factory)
  });
  initFactory = steal(config, "initFactory", emptyFunction);
  initFactory.call(factory);
  define(factory.prototype, config);
  if (singleton === true) {
    return factory();
  }
  define(factory, statics);
  return factory;
});

setKind(Factory, Function);

require("./Builtin")(Factory);

define(Factory, {
  Kind: Kind(Factory),
  Maybe: Maybe(Factory),
  configTypes: {
    value: {
      mixins: Array.Maybe,
      kind: [Kind(Function), Null, Void],
      getFromCache: Function.Maybe,
      create: Function.Maybe,
      func: Function.Maybe,
      statics: Object.Maybe,
      singleton: Boolean.Maybe,
      initFactory: Function.Maybe,
      initArguments: Function.Maybe,
      optionTypes: Object.Maybe,
      optionDefaults: Object.Maybe,
      optionsIndex: Number.Maybe,
      getFromCache: Function.Maybe,
      customValues: Object.Maybe,
      initValues: Function.Maybe,
      initFrozenValues: Function.Maybe,
      initReactiveValues: Function.Maybe,
      init: Function.Maybe,
      willCreate: Function.Maybe,
      didCreate: Function.Maybe,
      didInit: Function.Maybe,
      valueCreators: Array.Maybe,
      defineValues: Function.Maybe,
      didDefineValues: Function.Maybe
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
  getDefaultCreate: function(config, kind) {
    var create, func;
    create = steal(config, "create");
    func = steal(config, "func");
    if (create) {
      return create;
    } else if (func) {
      return function() {
        var self;
        return self = function() {
          return func.apply(self, arguments);
        };
      };
    } else if (kind === Object) {
      return function() {
        return {};
      };
    } else if (kind === Array) {
      return function() {
        return [];
      };
    } else if (kind === null) {
      return function() {
        return Object.create(null);
      };
    } else {
      return function() {
        var arg, args, i, len;
        args = [null];
        for (i = 0, len = arguments.length; i < len; i++) {
          arg = arguments[i];
          args.push(arg);
        }
        return new (Function.prototype.bind.apply(kind, args))();
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
        error = TypeError("'initArguments' must return an Array-like object");
        throwFailure(error, {
          args: args
        });
      }
      return sync.map(Object.keys(args), function(key) {
        return args[key];
      });
    };
  },
  initStatics: function(config, defaultValues) {
    var statics;
    statics = steal(config, "statics", {});
    sync.each(defaultValues, function(value, key) {
      return statics[key] = value;
    });
    return sync.map(statics, function(value, key) {
      var enumerable;
      enumerable = key[0] !== "_";
      if (isType(value, Object)) {
        if (value.enumerable == null) {
          value.enumerable = enumerable;
        }
        return value;
      }
      return {
        value: value,
        enumerable: enumerable
      };
    });
  }
});

//# sourceMappingURL=../../map/src/Factory.map
