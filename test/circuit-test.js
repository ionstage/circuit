var assert = require('assert');
var sinon = require('sinon');
var circuit = require('../circuit.js');

function forEach(array, fn) {
  for (var i = 0; i < array.length; i++)
    fn(array[i], i);
}

function createTestCelTypeObject(obj, list, key) {
  if (list == null)
    return;
  forEach(list, function(item) {
    obj[item] = obj[item] || {};
    obj[item][key] = (function() {});
  });
}

function createTestCel(propInList, propOutList, eventInList, eventOutList) {
  var prop = {};
  var event = {};
  createTestCelTypeObject(prop, propInList, 'in');
  createTestCelTypeObject(prop, propOutList, 'out');
  createTestCelTypeObject(event, eventInList, 'in');
  createTestCelTypeObject(event, eventOutList, 'out');
  return circuit.create({prop: prop, event: event});
}

function isFunction(obj) {
  return Object.prototype.toString.call(obj) === '[object Function]';
}

function isUndefined(obj) {
  return obj === void 0;
}

describe('.create', function() {
  it('create new object', function() {
    var obj = {};
    var cel = circuit.create(obj);
    assert.notStrictEqual(obj, cel);
  });

  it('no argument', function() {
    assert.doesNotThrow(function() {
      circuit.create();
    });
  });

  it('cel prop/event has function', function() {
    var cel = createTestCel(['a'], null, ['a', 'b'], ['a']);
    assert(isFunction(cel.prop.a['in']));
    assert(isUndefined(cel.prop.a.out));
    assert(isFunction(cel.event.a['in']));
    assert(isFunction(cel.event.b['in']));
    assert(isFunction(cel.event.a.out));
    assert(isUndefined(cel.event.b.out));
  });

  it('cel prop/event has reference of cel', function() {
    var cel = createTestCel(['a'], null, ['b'], null);
    assert.strictEqual(cel, cel.prop.a.element);
    assert.strictEqual(cel, cel.event.b.element);
  });

  it('cel prop/event has type', function() {
    var cel = createTestCel(['a'], null, ['b'], null);
    assert.equal(cel.prop.a.type, 'prop');
    assert.equal(cel.event.b.type, 'event');
  });

  it('create new cel based on cel', function() {
    var baseCel = createTestCel(['a'], null, null, null);
    var cel = circuit.create(baseCel);
    assert.notStrictEqual(baseCel, cel);
    assert.notStrictEqual(baseCel.prop, cel.prop);
    assert.notStrictEqual(baseCel.prop.a, cel.prop.a);
    assert.strictEqual(baseCel.prop.a['in'], cel.prop.a['in']);
  });

  it('initialize cel', function() {
    var cel = circuit.create({
      init: function() {
        this.element.isInitialized = true;
      }
    });
    assert(cel.isInitialized);
  });
});

describe('.connect', function() {
  it('prop', function(done) {
    var ret = {};
    var srcCel = createTestCel(null, ['a'], null, null);
    var tgtCel = createTestCel(['a'], null, null, null);
    srcCel.prop.a.out = sinon.spy(function() {
      return ret;
    });
    tgtCel.prop.a['in'] = sinon.spy();
    assert(circuit.connect(srcCel.prop.a, tgtCel.prop.a));
    setTimeout(function() {
      assert(srcCel.prop.a.out.called);
      assert(tgtCel.prop.a['in'].calledWith(ret));
      done();
    }, 0);
  });

  it('event', function(done) {
    var srcCel = createTestCel(null, null, ['a'], null);
    var tgtCel = createTestCel(null, null, null, ['a']);
    srcCel.event.a.out = sinon.spy();
    tgtCel.event.a['in'] = sinon.spy();
    assert(circuit.connect(srcCel.event.a, tgtCel.event.a));
    setTimeout(function() {
      assert(!srcCel.event.a.out.called);
      assert(!tgtCel.event.a['in'].called);
      done();
    }, 0);
  });

  it('differnt type', function() {
    var srcCel = createTestCel(null, ['a'], null, null);
    var tgtCel = createTestCel(null, null, ['a'], null);
    assert(!circuit.connect(srcCel.prop.a, tgtCel.event.a));
  });

  it('no argument', function() {
    assert(!circuit.connect());
  });

  it('only 1 argument', function() {
    var cel = createTestCel(['a'], ['a'], null, null);
    assert(!circuit.connect(cel.prop.a));
    assert(!circuit.connect(null, cel.prop.a));
    assert(!circuit.connect(undefined, cel.prop.a));
  });

  it('source prop has targets', function() {
    var srcCel = createTestCel(null, ['a'], null, null);
    var tgtCel0 = createTestCel(['a'], null, null, null);
    var tgtCel1 = createTestCel(['a'], null, null, null);
    circuit.connect(srcCel.prop.a, tgtCel0.prop.a);
    circuit.connect(srcCel.prop.a, tgtCel1.prop.a);
    assert.strictEqual(srcCel.prop.a.targets[0], tgtCel0.prop.a);
    assert.strictEqual(srcCel.prop.a.targets[1], tgtCel1.prop.a);
    assert.equal(srcCel.prop.a.targets.length, 2);
  });

  it('should not connect duplecated', function() {
    var srcCel = createTestCel(null, ['a'], null, null);
    var tgtCel = createTestCel(['a'], null, null, null);
    circuit.connect(srcCel.prop.a, tgtCel.prop.a);
    assert(!circuit.connect(srcCel.prop.a, tgtCel.prop.a));
    assert.equal(srcCel.prop.a.targets.length, 1);
  });

  it('target prop has sources', function() {
    var srcCel0 = createTestCel(null, ['a'], null, null);
    var srcCel1 = createTestCel(null, ['a'], null, null);
    var tgtCel = createTestCel(['a'], null, null, null);
    circuit.connect(srcCel0.prop.a, tgtCel.prop.a);
    circuit.connect(srcCel1.prop.a, tgtCel.prop.a);
    assert.strictEqual(tgtCel.prop.a.sources[0], srcCel0.prop.a);
    assert.strictEqual(tgtCel.prop.a.sources[1], srcCel1.prop.a);
    assert.equal(tgtCel.prop.a.sources.length, 2);
  });

  it('should not connect target which has no in-function', function() {
    var srcCel = createTestCel(null, ['a'], null, null);
    var tgtCel = createTestCel(['a'], null, null, null);
    delete tgtCel.prop.a['in'];
    assert(!circuit.connect(srcCel.prop.a, tgtCel.prop.a));
  });

  it('should not connect source which has no out-function', function() {
    var srcCel = createTestCel(null, ['a'], null, null);
    var tgtCel = createTestCel(['a'], null, null, null);
    delete srcCel.prop.a.out;
    assert(!circuit.connect(srcCel.prop.a, tgtCel.prop.a));
  });

  it('source event has targets', function() {
    var srcCel = createTestCel(null, null, null, ['a']);
    var tgtCel0 = createTestCel(null, null, ['a'], null);
    var tgtCel1 = createTestCel(null, null, ['a'], null);
    circuit.connect(srcCel.event.a, tgtCel0.event.a);
    circuit.connect(srcCel.event.a, tgtCel1.event.a);
    assert.strictEqual(srcCel.event.a.targets[0], tgtCel0.event.a);
    assert.strictEqual(srcCel.event.a.targets[1], tgtCel1.event.a);
    assert.equal(srcCel.event.a.targets.length, 2);
  });

  it('target event has sources', function() {
    var srcCel0 = createTestCel(null, null, null, ['a']);
    var srcCel1 = createTestCel(null, null, null, ['a']);
    var tgtCel = createTestCel(null, null, ['a'], null);
    circuit.connect(srcCel0.event.a, tgtCel.event.a);
    circuit.connect(srcCel1.event.a, tgtCel.event.a);
    assert.strictEqual(tgtCel.event.a.sources[0], srcCel0.event.a);
    assert.strictEqual(tgtCel.event.a.sources[1], srcCel1.event.a);
    assert.equal(tgtCel.event.a.sources.length, 2);
  });

  it('[prop] cel0 -> cel1 -> cel2', function(done) {
    var cel0 = createTestCel(null, ['a'], null, null);
    var cel1 = createTestCel(['a'], ['a'], null, null);
    var cel2 = createTestCel(['a'], null, null, null);
    cel2.prop.a['in'] = sinon.spy();
    cel1.prop.a['in'] = function() {
      this.element.updateProperty('a');
      setTimeout(function() {
        assert(cel2.prop.a['in'].calledTwice);
        done();
      }, 0);
    };
    circuit.connect(cel0.prop.a, cel1.prop.a);
    circuit.connect(cel1.prop.a, cel2.prop.a);
  });

  it('[prop] cel0 -> cel, cel1 -> cel', function(done) {
    var cel = createTestCel(['a'], null, null, null);
    var cel0 = createTestCel(null, ['a'], null, null);
    var cel1 = createTestCel(null, ['a'], null, null);
    var func = cel.prop.a['in'] = sinon.spy();
    var value0 = {}, value1 = {};
    cel0.prop.a.out = function() {
      return value0;
    };
    cel1.prop.a.out = function() {
      return value1;
    };
    circuit.connect(cel0.prop.a, cel.prop.a);
    circuit.connect(cel1.prop.a, cel.prop.a);
    cel0.updateProperty('a');
    setTimeout(function() {
      assert(func.calledThrice);
      assert.strictEqual(func.getCall(2).args[0], value0);
      assert.strictEqual(func.getCall(2).args[1], value1);
      done();
    }, 0);
  });

  it('[event] cel0 -> cel1 -> cel2', function(done) {
    var cel0 = createTestCel(null, null, null, ['a']);
    var cel1 = createTestCel(null, null, ['a'], ['a']);
    cel1.event.a.out = sinon.spy();
    var cel2 = createTestCel(null, null, ['a'], null);
    cel2.event.a['in'] = sinon.spy();
    cel1.event.a['in'] = function() {
      this.element.dispatchEvent('a');
      setTimeout(function() {
        assert(cel2.event.a['in'].called);
        done();
      }, 0);
    };
    circuit.connect(cel0.event.a, cel1.event.a);
    circuit.connect(cel1.event.a, cel2.event.a);
    cel0.dispatchEvent('a');
  });
});  

describe('.disconnect', function() {
  it('prop', function(done) {
    var srcCel = createTestCel(null, ['a'], null, null);
    var tgtCel = createTestCel(['a'], null, null, null);
    srcCel.prop.a.out = sinon.spy();
    tgtCel.prop.a['in'] = sinon.spy();
    circuit.connect(srcCel.prop.a, tgtCel.prop.a);
    setTimeout(function() {
      circuit.disconnect(srcCel.prop.a, tgtCel.prop.a);
      srcCel.updateProperty('a');
      assert(srcCel.prop.a.out.calledTwice);
      assert(tgtCel.prop.a['in'].calledOnce);
      done();
    }, 0);
  });

  it('event', function(done) {
    var srcCel = createTestCel(null, null, null, ['a']);
    var tgtCel = createTestCel(null, null, ['a'], null);
    srcCel.event.a.out = sinon.spy();
    tgtCel.event.a['in'] = sinon.spy();
    circuit.connect(srcCel.event.a, tgtCel.event.a);
    circuit.disconnect(srcCel.event.a, tgtCel.event.a);
    srcCel.dispatchEvent('a');
    setTimeout(function() {
      assert(srcCel.event.a.out.called);
      assert(!tgtCel.event.a['in'].called);
      done();
    }, 0);
  });

  it('no argument', function() {
    assert(!circuit.disconnect());
  });

  it('only 1 argument', function() {
    var cel = createTestCel(['a'], ['a'], null, null);
    assert(!circuit.disconnect(cel.prop.a));
    assert(!circuit.disconnect(null, cel.prop.a));
    assert(!circuit.disconnect(undefined, cel.prop.a));
  });

  it('source prop has targets', function() {
    var srcCel = createTestCel(null, ['a'], null, null);
    var tgtCel0 = createTestCel(['a'], null, null, null);
    var tgtCel1 = createTestCel(['a'], null, null, null);
    circuit.connect(srcCel.prop.a, tgtCel0.prop.a);
    circuit.connect(srcCel.prop.a, tgtCel1.prop.a);
    circuit.disconnect(srcCel.prop.a, tgtCel1.prop.a);
    assert.strictEqual(srcCel.prop.a.targets[0], tgtCel0.prop.a);
    assert(isUndefined(srcCel.prop.a.targets[1]));
    assert.equal(srcCel.prop.a.targets.length, 1);
  });

  it('should not disconnect which is not connected', function() {
    var srcCel = createTestCel(null, ['a'], null, null);
    var tgtCel0 = createTestCel(['a'], null, null, null);
    var tgtCel1 = createTestCel(['a'], null, null, null);
    circuit.connect(srcCel.prop.a, tgtCel0.prop.a);
    assert(!circuit.disconnect(srcCel.prop.a, tgtCel1.prop.a));
  });
});

describe('.noop', function() {
  it('type', function() {
    assert(isFunction(circuit.noop));
  });
});

describe('element', function() {
  describe('#updateProperty', function() {
    it('prop', function(done) {
      var srcCel = createTestCel(null, ['a'], null, null);
      var tgtCel = createTestCel(['a'], null, null, null);
      srcCel.prop.a.out = sinon.spy();
      tgtCel.prop.a['in'] = sinon.spy();
      circuit.connect(srcCel.prop.a, tgtCel.prop.a);
      srcCel.updateProperty('a');
      setTimeout(function() {
        assert(srcCel.prop.a.out.calledTwice);
        assert(tgtCel.prop.a['in'].calledTwice);
        done();
      }, 0);
    });

    it('undefined prop', function() {
      var srcCel = createTestCel(null, ['a'], null, null);
      var tgtCel = createTestCel(['a'], null, null, null);
      circuit.connect(srcCel.prop.a, tgtCel.prop.a);
      assert.doesNotThrow(function() {
        srcCel.updateProperty('b');
      });
    });

    it('undefined prop method', function() {
      var srcCel = createTestCel(null, ['a'], null, null);
      var tgtCel = createTestCel(['a'], null, null, null);
      circuit.connect(srcCel.prop.a, tgtCel.prop.a);
      delete srcCel.prop.a.out;
      delete tgtCel.prop.a['in'];
      assert.doesNotThrow(function() {
        srcCel.updateProperty('a');
      });
    });
  });

  describe('#dispatchEvent', function() {
    it('event', function(done) {
      var srcCel = createTestCel(null, null, null, ['a']);
      var tgtCel = createTestCel(null, null, ['a'], null);
      srcCel.event.a.out = sinon.spy();
      tgtCel.event.a['in'] = sinon.spy();
      circuit.connect(srcCel.event.a, tgtCel.event.a);
      srcCel.dispatchEvent('a');
      setTimeout(function() {
        assert(srcCel.event.a.out.calledOnce);
        assert(tgtCel.event.a['in'].calledOnce);
        done();
      }, 0);
    });

    it('undefined event', function() {
      var srcCel = createTestCel(null, null, null, ['a']);
      var tgtCel = createTestCel(null, null, ['a'], null);
      circuit.connect(srcCel.event.a, tgtCel.event.a);
      assert.doesNotThrow(function() {
        srcCel.dispatchEvent('b');
      });
    });

    it('undefined prop method', function() {
      var srcCel = createTestCel(null, null, null, ['a']);
      var tgtCel = createTestCel(null, null, ['a'], null);
      circuit.connect(srcCel.event.a, tgtCel.event.a);
      delete srcCel.event.a.out;
      delete tgtCel.event.a['in'];
      assert.doesNotThrow(function() {
        srcCel.dispatchEvent('a');
      });
    });
  });
});