
# factory v1.0.0 [![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

The `Factory` constructor is used to define classes.

## Options

- `kind: [ Factory, Null, Void ]` - The class to inherit from. Defaults to `Object`. [Learn more.]()
- `create: [ Function, Void ]` - Manually create the base object. [Learn more.]()
- `getFromCache: [ Function, Void ]` - Prevent duplicate instances. [Learn more.]()
- `func: [ Function, Void ]` - Whenever the instance has its `call` method invoked, call this function. [Learn more.]()

The following options allow easy validation:

- `initArguments: [ Function, Void ]` - Mutate the arguments before they are passed into the constructor. [Learn more.]()
- `optionTypes: [ Object, Void ]` - Strict & extensible type validation! [Learn more.]()
- `optionDefaults: [ Object, Void ]` - The values used when an option equals `undefined`. [Learn more.]()
- `optionsIndex: [ Number, Void ]` - The argument index for the options object. [Learn more.]()

The following options are applied to each instance in the specified order:

- `customValues: [ Object, Void ]` - Custom property descriptors that are defined on each instance. [Learn more.]()
- `initFrozenValues: [ Function, Void ]` - Create the frozen values for each instance. [Learn more.]()
- `initValues: [ Function, Void ]` - Create the writable values for each instance. [Learn more.]()
- `initReactiveValues: [ Function, Void ]` - Create the reactive values for each instance. [Learn more.]()
- `init: [ Function, Void ]` - Called right before each instance is returned by the constructor. [Learn more.]()

The following options affect the factory object:

- `statics: [ Object, Void ]` - Define properties on the factory object. [Learn more.]()
- `singleton: [ Boolean, Void ]` - If `true`, an instance is returned instead of the factory object. [Learn more.]()
- `initFactory: [ Function, Void ]` - Called right before the factory is returned. [Learn more.]()
- `valueCreators: [ Array, Void ]` - Inject custom property creators! [Learn more.]()
- `mixins: [ Array, Void ]` - Inject a `Function` that can alter your class. [Learn more.]()

The following options are useful for mixins and debugging:

- `willCreate: [ Function, Void ]` - Called right before a top-level instance is created. [Learn more.]()
- `didCreate: [ Function, Void ]` - Called right after a top-level instance's base object is created. [Learn more.]()
- `didInit: [ Function, Void ]` - Called right before a top-level instance is returned by the constructor. [Learn more.]()
- `defineValues: [ Function, Void ]` - Replace how values are defined as properties on each instance. [Learn more.]()
- `didDefineValues: [ Function, Void ]` - Inspect the values that were just defined on each instance. [Learn more.]()

## FAQ

#### How do I inherit from another class?

*Not yet answered!*

#### How do I construct the base object manually?

*Not yet answered!*

#### How do I prevent duplicate instances?

*Not yet answered!*

#### How do I add values to the prototype?

*Not yet answered!*

#### How do I add values to the factory?

*Not yet answered!*

#### How do I add a value that cannot be changed?

*Not yet answered!*

#### How do I add a value that can be changed?

*Not yet answered!*

#### How do I add a value that is reactive?

*Not yet answered!*

#### How do I add a value using a custom getter and/or setter?

*Not yet answered!*

#### How do I add a value that is lazily evaluated?

*Not yet answered!*

#### How do I access the factory before it's returned?

*Not yet answered!*

#### How do I use mixins?

*Not yet answered!*

#### How do I make my own mixins?

*Not yet answered!*
