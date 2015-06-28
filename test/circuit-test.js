var assert = require('assert');
var sinon = require('sinon');
var circuit = require('../circuit.js');

describe('.prop', function() {
  it('getter/setter', function() {
    var obj = {};
    var prop = circuit.prop(null);
    assert.equal(prop(), null);
    prop(obj);
    assert.equal(prop(), obj);
  });

  it('no argument', function() {
    var prop = circuit.prop();
    assert(typeof prop() === 'undefined');
  });

  it('function as argument', function() {
    var func = sinon.spy();
    var prop = circuit.prop(func);
    prop(1);
    assert(func.calledWith(1));
  });
});

describe('.event', function() {
  it('wrap function', function() {
    var func = sinon.spy();
    var event = circuit.event(func)
    event();
    assert(func.called);
  });

  it('no argument', function() {
    var event = circuit.event();
    assert.doesNotThrow(function() {
      event();
    });
  });
});

describe('.bind', function() {
  it('prop', function() {
    var obj0 = {};
    var a = circuit.prop(obj0);
    var b = circuit.prop();
    var c = circuit.prop();
    var d = circuit.prop();
    circuit.bind(a, b);
    circuit.bind(b, c);
    circuit.bind(c, d);
    assert.equal(d(), obj0);
    var obj1 = {};
    a(obj1);
    assert.equal(d(), obj1);
  });

  it('event', function(done) {
    var funcA = sinon.spy();
    var a = circuit.event(funcA);
    var funcB = sinon.spy();
    var b = circuit.event(funcB);
    circuit.bind(a, b);
    setTimeout(function() {
      assert(!funcA.called);
      a();
      setTimeout(function() {
        assert(funcB.called);
        done();
      }, 0);
    }, 0);
  });

  it('different type', function() {
    var a = circuit.prop();
    var b = circuit.event();
    assert.throws(function() {
      circuit.bind(a, b);
    });
  });

  it('no argument', function() {
    assert.throws(function() {
      circuit.bind();
    });
  });

  it('only 1 argument', function() {
    var a = circuit.prop();
    assert.throws(function() {
      circuit.bind(a);
    });
    assert.throws(function() {
      circuit.connect(null, a);
    });
    assert.throws(function() {
      circuit.connect(undefined, a);
    });
  });

  it('bind same prop', function() {
    var a = circuit.prop(0);
    circuit.bind(a, a);
    a(1);
    assert.equal(a(), 1);
  });

  it('bind same prop with function', function(done) {
    var a = circuit.prop(function(x) {
      return x + 1;
    });
    circuit.bind(a, a);
    a(1);
    assert.equal(a(), 2);
    setTimeout(function() {
      assert.equal(a(), 3);
      setTimeout(function() {
        assert.equal(a(), 4);
        done();
      });
    });
  });

  it('should not update binding prop immediately', function() {
    var a = circuit.prop(1);
    var func = sinon.spy();
    var b = circuit.prop(func);
    circuit.bind(a, b);
    a(2);
    assert(!func.called);
  });

  it('shoud update binding prop when the call stack has cleared', function(done) {
    var a = circuit.prop(1);
    var func = sinon.spy();
    var b = circuit.prop(func);
    circuit.bind(a, b);
    a(2);
    setTimeout(function() {
      assert(func.called);
      done();
    }, 0);
  });

  it('bind prop with setting function as argument', function() {
    var a = circuit.prop(function(value) {
      return value;
    });
    var b = circuit.prop();
    circuit.bind(a, b);
    var obj = {};
    a(obj);
    assert.equal(b(), obj);
  });

  it('bind prop more than once', function() {
    var a = circuit.prop(0);
    var b = circuit.prop(1);
    var c = circuit.prop(function(x, y) {
      return x + y;
    });
    circuit.bind(a, c);
    circuit.bind(b, c);
    a(1);
    assert.equal(c(), 2);
  });

  it('bind same prop more than once', function() {
    var a = circuit.prop(1);
    var b = circuit.prop(function(x, y) {
      assert.equal(x, 1);
      assert.equal(y, 1);
    });
    circuit.bind(a, b);
    circuit.bind(a, b);
    b();
  });

  it('update prop values at the same time', function() {
    var a = circuit.prop(1);
    var b = circuit.prop(1);
    var func = sinon.spy();
    var c = circuit.prop(func);
    circuit.bind(a, c);
    circuit.bind(b, c);
    a(2);
    c();
    assert(func.calledOnce);
  });

  it('bind prop each other', function() {
    var a = circuit.prop(0);
    var b = circuit.prop(0);
    circuit.bind(a, b);
    circuit.bind(b, a);

    b(1);
    assert.equal(a(), 1);
    a(2);
    assert.equal(b(), 2);
  });

  it('cancel event', function(done) {
    var a = circuit.event(function(event) {
      event.cancel();
    });
    var func = sinon.spy();
    var b = circuit.event(func);
    circuit.bind(a, b);
    a();
    setTimeout(function() {
      assert(!func.called);
      done();
    }, 0);
  });

  it('dispatch event', function(done) {
    var a = circuit.event(function(event) {
      event.cancel();
      event.dispatch();
    });
    var func = sinon.spy();
    var b = circuit.event(func);
    circuit.bind(a, b);
    a();
    setTimeout(function() {
      assert(func.called);
      done();
    }, 0);
  });

  it('event context', function(done) {
    var a = circuit.event(function(event) {
      var context = event.context;
      assert.equal(context(), 1);
      context(context() + 1);
    });
    var b = circuit.event(function(event) {
      assert.equal(event.context(), 2);
      done();
    });
    circuit.bind(a, b);
    a(1);
  });
});

describe('unbind', function() {
  it('prop', function() {
    var a = circuit.prop();
    var b = circuit.prop();
    circuit.bind(a, b);
    circuit.unbind(a, b);
    var obj = {};
    a(obj);
    assert.notEqual(b(), obj);
  });

  it('event', function(done) {
    var a = circuit.event();
    var func = sinon.spy();
    var b = circuit.event(func);
    circuit.bind(a, b);
    circuit.unbind(a, b);
    a();
    setTimeout(function() {
      assert(!func.called);
      done();
    }, 0);
  });

  it('no argument', function() {
    assert.throws(function() {
      circuit.unbind();
    });
  });

  it('should not unbind same props many times', function() {
    var a = circuit.prop();
    var b = circuit.prop();
    circuit.bind(a, b);
    circuit.unbind(a, b);
    assert.throws(function() {
      circuit.unbind(a, b);
    });
  });

  it('update prop cache', function() {
    var a = circuit.prop(0);
    var b = circuit.prop(0);
    circuit.bind(a, b);
    a(1);
    circuit.unbind(a, b);
    assert.equal(b(), 1);
  });
});