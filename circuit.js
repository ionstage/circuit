/**
 * circuit v0.1.4
 * (c) 2015 iOnStage
 * Released under the MIT License.
 */

(function(global) {
  'use strict';
  var circuit = (function() {
    var nativeIndexOf = Array.prototype.indexOf;

    function indexOf(array, item) {
      if (nativeIndexOf && array.indexOf === nativeIndexOf)
        return array.indexOf(item);
      for (var i = 0, len = array.length; i < len; i += 1) {
        if (array[i] === item)
          return i;
      }
      return -1;
    }

    function sendMessage(target, args, type) {
      setTimeout(function() {
        if (typeof target['in'] === 'function') {
          if (type === 'prop')
            target['in'].apply(target, args);
          else
            target['in']();
        }
      }, 0);
    }

    function processConnection(element, type, key) {
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
    }

    function updateProperty(key) {
      processConnection(this, 'prop', key);
    }

    function dispatchEvent(key) {
      processConnection(this, 'event', key);
    }

    function create(base) {
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
    }

    function connect(source, target) {
      if (!source || !target)
        return false;

      if (source.type !== target.type)
        return false;

      if (typeof source.out !== 'function')
        return false;

      if (typeof target['in'] !== 'function')
        return false;

      if (indexOf(source.targets, target) !== -1)
        return false;

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

      return true;
    }

    function disconnect(source, target) {
      if (!source || !target)
        return false;

      if (source.type !== target.type)
        return false;

      var targetIndex = indexOf(source.targets, target);
      if (targetIndex === -1)
        return false;

      var sourceIndex = indexOf(target.sources, source);
      target.sources.splice(sourceIndex, 1);

      source.targets.splice(targetIndex, 1);

      return true;
    }

    return {
      create: create,
      connect: connect,
      disconnect: disconnect,
      noop: function() {}
    };
  }());

  if (typeof module !== 'undefined' && module.exports)
    module.exports = circuit;
  else
    global.circuit = circuit;
}(this));