var Factory, Kind, addValidatorType, assertType, builtinRefTypes, builtinValueTypes, i, isKind, j, len, len1, ref, setType, type, validateWithFactory;

require("lotus-require");

ref = require("type-utils"), Kind = ref.Kind, isKind = ref.isKind, setType = ref.setType, assertType = ref.assertType, addValidatorType = ref.addValidatorType;

module.exports = Factory = require("./Factory");

addValidatorType({
  isType: function(value) {
    return isKind(value, Factory);
  },
  validate: validateWithFactory = function(value, factory, keyPath) {
    return assertType(value, factory, keyPath);
  }
});

builtinValueTypes = [Number, String, Boolean];

for (i = 0, len = builtinValueTypes.length; i < len; i++) {
  type = builtinValueTypes[i];
  setType(type, Factory);
}

builtinRefTypes = [Date, Array, Object, RegExp, Function];

for (j = 0, len1 = builtinRefTypes.length; j < len1; j++) {
  type = builtinRefTypes[j];
  setType(type, Factory);
  type.Kind = Kind(type);
}

//# sourceMappingURL=../../map/src/index.map
