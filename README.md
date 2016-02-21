
# factory v1.0.0 [![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

The `Factory` constructor is used to define classes.

## install

```sh
npm install aleclarson/factory#1.0.0
```

## options

### kind

The class that the instances of this `Factory` will inherit from.

Defaults to `Object`.

### create

A `Function` that creates each instance.

You usually leave this undefined, because `Factory` can create instances based off `options.kind`.

But occasionally, you need to handle instance creation yourself.

### func

A shortcut for defining the `Function` that represents a new instance.

### init

The main `Function` used for instance initialization.

### initValues

...

### optionTypes

...

### optionDefaults

...

### statics

...

### mixins

...
