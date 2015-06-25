/**
 * circuit v0.1.4
 * (c) 2015 iOnStage
 * Released under the MIT License.
 */

(function(global) {
  'use strict';
  var nativeIndexOf = Array.prototype.indexOf;

  var isObject = function(obj) {
    var type = typeof obj;
    return type === 'object' && obj !== null;
  };

  var indexOf = function(array, item) {
    if (nativeIndexOf && array.indexOf === nativeIndexOf)
      return array.indexOf(item);
    for (var i = 0, len = array.length; i < len; i += 1) {
      if (array[i] === item)
        return i;
    }
    return -1;
  };

  var prop = function(initialValue) {
    var cache = initialValue;
    return function(value) {
      if (typeof value === 'undefined')
        return cache;
      cache = value;
    };
  };

  var sendMessage = function(target, args, type) {
    setTimeout(function() {
      if (typeof target['in'] === 'function') {
        if (type === 'prop')
          target['in'].apply(target, args);
        else
          target['in']();
      }
    }, 0);
  };

  var processConnection = function(element, type, key) {
    var source = element[type][key];

    if (typeof source === 'undefined')
      return;

    if (typeof source.out !== 'function')
      return;

    var targets = source.targets;

    if (type !== 'prop' || targets.length === 0)
      source.out();

    for (var ti = 0, tlen = targets.length; ti < tlen; ti += 1) {
      var target = targets[ti];
      var args = [];
      if (type === 'prop') {
        var sources = target.sources;
        for (var si = 0, slen = sources.length; si < slen; si += 1)
          args.push(sources[si].out());
      }
      sendMessage(target, args, type);
    }
  };

  var updateProperty = function(key) {
    processConnection(this, 'prop', key);
  };

  var dispatchEvent = function(key) {
    processConnection(this, 'event', key);
  };

  var circuit = {};

  circuit.create = function(base) {
    var element = {
      updateProperty: updateProperty,
      dispatchEvent: dispatchEvent
    };
    var types = ['prop', 'event'];

    for (var i = 0, len = types.length; i < len; i += 1) {
      var type = types[i];
      var typeObject = {};
      var baseTypeObject = (base && type in base) ? base[type] : {};

      for (var key in baseTypeObject) {
        var keyObject = {};

        var baseInFunc = baseTypeObject[key]['in'];
        var baseOutFunc = baseTypeObject[key].out;
        if (typeof baseInFunc === 'function')
          keyObject['in'] = baseInFunc;
        if (typeof baseOutFunc === 'function')
          keyObject.out = baseOutFunc;

        keyObject.el = keyObject.element = element;
        keyObject.type = type;
        keyObject.targets = [];
        keyObject.sources = [];

        typeObject[key] = keyObject;
      }

      element[type] = typeObject;
    }

    if (base && typeof base.init === 'function')
      base.init.call({element: element, el: element});

    return element;
  };

  circuit.connect = function(source, target) {
    if (!source || !target)
      throw new TypeError('Not enough arguments');

    if (source.type !== target.type)
      throw new TypeError('Cannot connect prop and event');

    if (typeof source.out !== 'function')
      throw new TypeError("Source must have 'out' function");

    if (typeof target['in'] !== 'function')
      throw new TypeError("Target must have 'in' function");

    if (indexOf(source.targets, target) !== -1)
      throw new Error('Already connected');

    target.sources.push(source);
    source.targets.push(target);

    if (source.type === 'prop') {
      setTimeout(function() {
        if (typeof target['in'] === 'function') {
          var sources = target.sources;
          var args = [];
          for (var i = 0, len = sources.length; i < len; i += 1)
            args.push(sources[i].out());
          target['in'].apply(target, args);
        }
      }, 0);
    }
  };

  circuit.disconnect = function(source, target) {
    if (!source || !target)
      throw new TypeError('Not enough arguments');

    if (source.type !== target.type)
      throw new TypeError('Cannot connect prop and event');

    var targetIndex = indexOf(source.targets, target);
    if (targetIndex === -1)
      throw new Error('Already disconnected');

    var sourceIndex = indexOf(target.sources, source);
    target.sources.splice(sourceIndex, 1);
    source.targets.splice(targetIndex, 1);
  };

  circuit.noop = function() {};

  circuit.prop = function(initialValue) {
    var targets = [];
    var sources = [];
    var update = function() {
      setTimeout(function() {
        for (var i = 0, len = targets.length; i < len; i += 1) {
          var target = targets[i];
          var sourceValues = target.sources.map(function(source) {
            return source();
          });
          target.apply(null, sourceValues);
        }
      }, 0);
    };
    var cache;
    var func;

    if (typeof initialValue === 'function') {
      cache = initialValue();
      func = function() {
        if (arguments.length === 0)
          return cache;
        var value = initialValue.apply(null, arguments);
        if (value === cache && !isObject(value))
          return;
        cache = value;
        update();
      };
    } else {
      cache = initialValue;
      func = function(value) {
        if (typeof value === 'undefined')
          return cache;
        if (value === cache && !isObject(value))
          return;
        cache = value;
        update();
      };
    }

    func.targets = targets;
    func.sources = sources;
    func.type = 'prop';
    return func;
  };

  circuit.event = function(listener) {
    var targets = [];
    var sources = [];
    var func = function() {
      if (typeof listener === 'function')
        listener();
      setTimeout(function() {
        for (var i = 0, len = targets.length; i < len; i += 1)
          targets[i]();
      }, 0);
    };
    func.targets = targets;
    func.sources = sources;
    func.type = 'event';
    return func;
  };

  circuit.bind = function(source, target) {
    if (!source || !target)
      throw new TypeError('Not enough arguments');

    if (source.type !== target.type)
      throw new TypeError('Cannot bind prop and event');

    source.targets.push(target);
    target.sources.push(source);

    if (source.type === 'prop') {
      var sourceValues = target.sources.map(function(source) {
        return source();
      });
      setTimeout(function() {
        target.apply(null, sourceValues);
      }, 0);
    }
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = circuit;
  else
    global.circuit = circuit;
})(this);