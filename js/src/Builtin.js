var Kind, Maybe, ref, setType;

ref = require("type-utils"), Kind = ref.Kind, Maybe = ref.Maybe, setType = ref.setType;

module.exports = function(Factory) {
  [Number, String, Boolean].forEach(function(type) {
    setType(type, Factory);
    return type.Maybe = Maybe(type);
  });
  return [Date, Error, Array, Object, RegExp, Function].forEach(function(type) {
    setType(type, Factory);
    type.Kind = Kind(type);
    return type.Maybe = Maybe(type);
  });
};

//# sourceMappingURL=../../map/src/Builtin.map
