/**
 * circuit v0.3.2
 * (c) 2015 iOnStage
 * Released under the MIT License.
 */

(function(global) {
  'use strict';
  var lastIndexOf = function(array, item) {
    for (var i = array.length - 1; i >= 0; i--) {
      if (array[i] === item)
        return i;
    }
    return -1;
  };

  var map = function(array, func) {
    var len = array.length;
    var results = Array(len);
    for (var i = 0; i < len; i++) {
      results[i] = func(array[i], i, array);
    }
    return results;
  };

  var identity = function(value) {
    return value;
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

    for (var ti = 0, tlen = targets.length; ti < tlen; ti++) {
      var target = targets[ti];
      var args = [];
      if (type === 'prop') {
        var sources = target.sources;
        for (var si = 0, slen = sources.length; si < slen; si++) {
          args.push(sources[si].out());
        }
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

    for (var i = 0, len = types.length; i < len; i++) {
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

    if (lastIndexOf(source.targets, target) !== -1)
      throw new Error('Already connected');

    target.sources.push(source);
    source.targets.push(target);

    if (source.type === 'prop') {
      setTimeout(function() {
        if (typeof target['in'] === 'function') {
          var sources = target.sources;
          var args = [];
          for (var i = 0, len = sources.length; i < len; i++) {
            args.push(sources[i].out());
          }
          target['in'].apply(target, args);
        }
      }, 0);
    }
  };

  circuit.disconnect = function(source, target) {
    if (!source || !target)
      throw new TypeError('Not enough arguments');

    var targetIndex = lastIndexOf(source.targets, target);
    if (targetIndex === -1)
      throw new Error('Already disconnected');

    var sourceIndex = lastIndexOf(target.sources, source);
    target.sources.splice(sourceIndex, 1);
    source.targets.splice(targetIndex, 1);
  };

  circuit.noop = function() {};

  var CircuitProp = function(initialValue) {
    var self = this;

    var func = function() {
      if (typeof arguments[0] === 'undefined') {
        self.update();
        return self.cache;
      }

      var value = self.value.apply(null, arguments);
      if (value === self.cache)
        return;

      self.updateCache(value);
      self.markDirty();
    };

    func._self = self;

    this.func = func;
    this.targets = [];
    this.sources = [];
    this.type = 'prop';

    if (typeof initialValue !== 'function') {
      this.cache = initialValue;
      this.value = identity;
    } else {
      // this.cache is undefined until initial value setting
      this.value = initialValue;
    }

    this.dirty = false;
    this.timer = null;

    return func;
  };

  CircuitProp.prototype.update = function() {
    if (!this.dirty)
      return;

    this.dirty = false;

    var sourceValues = map(this.sources, function(source) {
      return source();
    });

    var value = this.value.apply(null, sourceValues);
    if (value === this.cache)
      return;

    this.updateCache(value);
    this.markDirty();
  };

  CircuitProp.prototype.updateCache = function(value) {
    this.cache = value;
    this.dirty = false;
  };

  CircuitProp.prototype.markDirty = function() {
    CircuitProp.markDirtyTargets(this.targets);

    if (!this.dirty)
      return;

    this.dirty = false;

    if (this.timer === null) {
      var self = this;
      this.timer = setTimeout(function() {
        self.timer = null;
        self.dirty = true;
        self.update();
      }, 0);
    }
  };

  CircuitProp.markDirtyTargets = (function() {
    var dirtyTargets = [];
    var timer = null;

    return function(targets) {
      for (var i = 0, len = targets.length; i < len; i++) {
        var target = targets[i];
        var targetSelf = target._self;

        if (targetSelf.dirty)
          continue;

        targetSelf.dirty = true;

        if(lastIndexOf(dirtyTargets, target) === -1)
          dirtyTargets.push(target);

        CircuitProp.markDirtyTargets(targetSelf.targets);
      }

      if (timer !== null)
        return;

      timer = setTimeout(function() {
        for (var i = 0, len = dirtyTargets.length; i < len; i++) {
          var target = dirtyTargets[i];
          if (target._self.dirty)
            target();
        }

        dirtyTargets = [];
        timer = null;
      }, 0);
    };
  })();

  var CircuitEvent = function(listener) {
    var self = this;

    var func = function(context) {
      var canceled = false;

      var contextProp = function(value) {
        if (typeof value === 'undefined')
          return context;
        context = value;
      };

      var event = {
        cancel: function() {
          canceled = true;
        },
        dispatch: function() {
          self.dispatch(contextProp());
        },
        context: contextProp
      };

      if (typeof listener === 'function')
        listener(event);

      if (canceled)
        return;

      self.dispatch(contextProp());
    };

    func._self = self;

    this.func = func;
    this.targets = [];
    this.sources = [];
    this.type = 'event';

    return func;
  };

  CircuitEvent.prototype.dispatch = function(context) {
    var targets = this.targets;
    setTimeout(function() {
      for (var i = 0, len = targets.length; i < len; i++) {
        targets[i](context);
      }
    }, 0);
  };

  circuit.prop = function(initialValue) {
    return new CircuitProp(initialValue);
  };

  circuit.event = function(listener) {
    return new CircuitEvent(listener);
  };

  circuit.bind = function(source, target) {
    if (!source || !target)
      throw new TypeError('Not enough arguments');

    var sourceSelf = source._self;
    var targetSelf = target._self;

    if (sourceSelf.type !== targetSelf.type)
      throw new TypeError('Cannot bind prop and event');

    sourceSelf.targets.push(target);
    targetSelf.sources.push(source);

    if (sourceSelf.type === 'prop')
      CircuitProp.markDirtyTargets([target]);
  };

  circuit.unbind = function(source, target) {
    if (!source || !target)
      throw new TypeError('Not enough arguments');

    var sourceSelf = source._self;
    var targetSelf = target._self;

    var targetIndex = lastIndexOf(sourceSelf.targets, target);

    if (targetIndex === -1)
      throw new Error('Already unbound');

    if (targetSelf.type === 'prop' && targetSelf.dirty)
      target();

    var sourceIndex = lastIndexOf(targetSelf.sources, source);

    targetSelf.sources.splice(sourceIndex, 1);
    sourceSelf.targets.splice(targetIndex, 1);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = circuit;
  else
    global.circuit = circuit;
})(this);