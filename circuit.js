/**
 * circuit v1.1.1
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

  var circuit = {};

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

    if (typeof initialValue !== 'function') {
      this.cache = initialValue;
      this.value = identity;
      this.dirty = false;
      this.timer = null;
    } else {
      // this.cache is unset until first update
      this.value = initialValue;
      this.dirty = true;
      this.timer = setTimeout(function() {
        self.timer = null;
        self.dirty = true;
        self.update();
      }, 0);
    }

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

        if (lastIndexOf(dirtyTargets, target) === -1)
          dirtyTargets.push(target);

        CircuitProp.markDirtyTargets(targetSelf.targets);
      }

      if (timer !== null)
        return;

      timer = setTimeout(function updateDirtyTargets() {
        var updateTargets = dirtyTargets.slice();
        dirtyTargets = [];

        for (var i = 0, len = updateTargets.length; i < len; i++) {
          var target = updateTargets[i];
          if (target._self.dirty)
            target();
        }

        if (dirtyTargets.length !== 0)
          updateDirtyTargets();

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

    if (sourceSelf.constructor !== targetSelf.constructor)
      throw new TypeError('Cannot bind prop and event');

    sourceSelf.targets.push(target);
    targetSelf.sources.push(source);

    if (sourceSelf.constructor === CircuitProp) {
      CircuitProp.markDirtyTargets([target]);
      source();
    }
  };

  circuit.unbind = function(source, target) {
    if (!source || !target)
      throw new TypeError('Not enough arguments');

    var sourceSelf = source._self;
    var targetSelf = target._self;

    var targetIndex = lastIndexOf(sourceSelf.targets, target);

    if (targetIndex === -1)
      throw new Error('Already unbound');

    if (targetSelf.constructor === CircuitProp && targetSelf.dirty)
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
