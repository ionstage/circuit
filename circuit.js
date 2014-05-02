/*
 * Copyright (c) 2014 iOnStage
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
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

    function sendMessage(target, value, type) {
      setTimeout(function() {
        if (typeof target['in'] === 'function') {
          if (type === 'prop')
            target['in'](value);
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

      var value = source.out();
      var targets = source.targets;
      for (var i = 0, len = targets.length; i < len; i += 1) {
        sendMessage(targets[i], value, type);
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
        var baseTypeObject = base ? base[type] : {};

        for (var key in baseTypeObject) {
          var keyObject = {};

          var baseInFunc = baseTypeObject[key]['in'];
          var baseOutFunc = baseTypeObject[key].out;
          if (typeof baseInFunc === 'function')
            keyObject['in'] = baseInFunc;
          if (typeof baseOutFunc === 'function')
            keyObject.out = baseOutFunc;

          keyObject.element = element;
          keyObject.type = type;
          keyObject.targets = [];
          keyObject.source = null;

          typeObject[key] = keyObject;
        }

        element[type] = typeObject;
      }

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

      if (target.source !== null)
        return false;

      if (indexOf(source.targets, target) !== -1)
        return false;

      target.source = source;

      source.targets.push(target);

      if (source.type === 'prop') {
        setTimeout(function() {
          if (typeof source.out === 'function' &&
              typeof target['in'] === 'function')
            target['in'](source.out());
        }, 0);
      }

      return true;
    }

    function disconnect(source, target) {
      if (!source || !target)
        return false;

      if (source.type !== target.type)
        return false;

      if (target.source !== source)
        return false;

      if (indexOf(source.targets, target) === -1)
        return false;

      target.source = null;

      var targets = source.targets;
      for (var i = targets.length - 1; i >= 0; i -= 1) {
        if (targets[i] === target) {
          targets.splice(i, 1);
          break;
        }
      }

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
