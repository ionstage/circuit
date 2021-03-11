var assert = require('assert');
var sinon = require('sinon');
var circuit = require('../circuit.js');

describe('.data', function() {
  it('getter/setter', function() {
    var o = {};
    var a = circuit.data(null);
    assert.strictEqual(a(), null);
    a(o);
    assert.strictEqual(a(), o);
  });

  it('no argument', function() {
    var a = circuit.data();
    assert(typeof a() === 'undefined');
  });

  it('function as argument', function() {
    var f = sinon.spy();
    var a = circuit.data(f);
    a(1);
    assert(f.calledWith(1));
  });

  it('alias for backward compatibility', function() {
    assert.strictEqual(circuit.data, circuit.prop);
  });
});

describe('.event', function() {
  it('wrap function', function() {
    var f = sinon.spy();
    var a = circuit.event(f)
    a();
    assert(f.called);
  });

  it('no argument', function() {
    var a = circuit.event();
    assert.doesNotThrow(function() {
      a();
    });
  });
});

describe('.bind', function() {
  it('data', function() {
    var o0 = {};
    var a = circuit.data(o0);
    var b = circuit.data();
    var c = circuit.data();
    var d = circuit.data();
    circuit.bind(a, b);
    circuit.bind(b, c);
    circuit.bind(c, d);
    assert.strictEqual(d(), o0);
    var o1 = {};
    a(o1);
    assert.strictEqual(d(), o1);
  });

  it('event', function(done) {
    var fa = sinon.spy();
    var a = circuit.event(fa);
    var fb = sinon.spy();
    var b = circuit.event(fb);
    circuit.bind(a, b);
    setTimeout(function() {
      assert(!fa.called);
      a();
      setTimeout(function() {
        assert(fb.called);
        done();
      }, 0);
    }, 0);
  });

  it('different type', function() {
    var a = circuit.data();
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
    var a = circuit.data();
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

  it('bind same data', function() {
    var a = circuit.data(0);
    circuit.bind(a, a);
    a(1);
    assert.strictEqual(a(), 1);
  });

  it('bind same data with function', function(done) {
    var a = circuit.data(function(x) {
      return x + 1;
    });
    circuit.bind(a, a);
    a(1);
    assert.strictEqual(a(), 2);
    setTimeout(function() {
      assert.strictEqual(a(), 3);
      setTimeout(function() {
        assert.strictEqual(a(), 4);
        done();
      }, 0);
    }, 0);
  });

  it('should not update binding data immediately', function() {
    var a = circuit.data(1);
    var f = sinon.spy();
    var b = circuit.data(f);
    circuit.bind(a, b);
    a(2);
    assert(!f.called);
  });

  it('should update binding data when the call stack has cleared', function(done) {
    var a = circuit.data(1);
    var f = sinon.spy();
    var b = circuit.data(f);
    circuit.bind(a, b);
    a(2);
    setTimeout(function() {
      assert(f.called);
      done();
    }, 0);
  });

  it('bind data with setting function as argument', function() {
    var a = circuit.data(function(value) {
      return value;
    });
    var b = circuit.data();
    circuit.bind(a, b);
    var o = {};
    a(o);
    assert.strictEqual(b(), o);
  });

  it('should initialize data value with setting function as argument', function() {
    var f = sinon.spy(function() {
      return 0;
    });
    var a = circuit.data(f);
    assert.strictEqual(a(), 0);
    assert(f.calledOnce);
  });

  it('should update target data value with setting function as argument', function(done) {
    var a = circuit.data();
    var b = circuit.data(function(x) {
      c(x);
    });
    var c = circuit.data();
    var f = sinon.spy();
    var d = circuit.data(f);
    circuit.bind(a, b);
    circuit.bind(c, d);
    setTimeout(function() {
      a(1);
      setTimeout(function() {
        assert(f.calledWith(1));
        done();
      }, 0);
    }, 0);
  });

  it('bind data more than once', function() {
    var a = circuit.data(0);
    var b = circuit.data(1);
    var c = circuit.data(function(x, y) {
      return x + y;
    });
    circuit.bind(a, c);
    circuit.bind(b, c);
    a(1);
    assert.strictEqual(c(), 2);
  });

  it('bind same data more than once', function() {
    var a = circuit.data(1);
    var f = sinon.spy();
    var b = circuit.data(f);
    circuit.bind(a, b);
    circuit.bind(a, b);
    b();
    assert(f.calledWith(1, 1));
  });

  it('update data values at the same time', function() {
    var a = circuit.data(1);
    var b = circuit.data(1);
    var f = sinon.spy();
    var c = circuit.data(f);
    circuit.bind(a, c);
    circuit.bind(b, c);
    a(2);
    b(2);
    c();
    assert(f.calledOnce);
  });

  it('bind data each other', function() {
    var a = circuit.data(0);
    var b = circuit.data(0);
    circuit.bind(a, b);
    circuit.bind(b, a);
    b(1);
    assert.strictEqual(a(), 1);
    a(2);
    assert.strictEqual(b(), 2);
  });

  it('bind data each other and another', function(done) {
    var a = circuit.data();
    var b = circuit.data();
    var f = sinon.spy();
    var c = circuit.data(f);
    circuit.bind(a, c);
    circuit.bind(b, a);
    circuit.bind(a, b);
    a(1);
    setTimeout(function() {
      b(2);
      setTimeout(function() {
        assert(f.calledTwice);
        done();
      }, 0);
    }, 0);
  });

  it('bind data in circle chain', function() {
    var a = circuit.data(0);
    var b = circuit.data(1);
    var c = circuit.data(2);
    circuit.bind(a, b);
    circuit.bind(b, c);
    circuit.bind(c, a);
    a(1);
    assert.strictEqual(a(), 1);
    assert.strictEqual(b(), 1);
    assert.strictEqual(c(), 1);
  });

  it('should update target data value in circle chain', function() {
    var a = circuit.data();
    var b = circuit.data();
    circuit.bind(a, b);
    b(0);
    circuit.bind(b, a);
    assert.strictEqual(a(), 0);
  });

  it('cancel event', function(done) {
    var a = circuit.event(function(event) {
      event.cancel();
    });
    var f = sinon.spy();
    var b = circuit.event(f);
    circuit.bind(a, b);
    a();
    setTimeout(function() {
      assert(!f.called);
      done();
    }, 0);
  });

  it('dispatch event', function(done) {
    var a = circuit.event(function(event) {
      event.cancel();
      event.dispatch();
    });
    var f = sinon.spy();
    var b = circuit.event(f);
    circuit.bind(a, b);
    a();
    setTimeout(function() {
      assert(f.called);
      done();
    }, 0);
  });

  it('should not relay argument of the dispatch function as event context', function(done) {
    var a = circuit.event(function(event) {
      event.cancel();
      event.context(1);
      event.dispatch(2);
    });
    var b = circuit.event(function(event) {
      var value = event.context();
      assert.strictEqual(value, 1);
      done();
    });
    circuit.bind(a, b);
    a();
  });

  it('event context', function(done) {
    var a = circuit.event(function(event) {
      var context = event.context;
      assert.strictEqual(context(), 1);
      context(context() + 1);
    });
    var b = circuit.event(function(event) {
      assert.strictEqual(event.context(), 2);
      done();
    });
    circuit.bind(a, b);
    a(1);
  });

  it('default value of event context is null', function() {
    var a = circuit.event(function(event) {
      assert.strictEqual(event.context(), null);
    });
    a();
  });

  it('assignment to event context', function(done) {
    var a = circuit.event(function(event) {
      event.context = 1;
    });
    var b = circuit.event(function(event) {
      assert.doesNotThrow(function() {
        event.context();
      });
      done();
    });
    circuit.bind(a, b);
    a();
  });
});

describe('unbind', function() {
  it('data', function() {
    var a = circuit.data();
    var b = circuit.data();
    circuit.bind(a, b);
    circuit.unbind(a, b);
    var o = {};
    a(o);
    assert.notStrictEqual(b(), o);
  });

  it('event', function(done) {
    var a = circuit.event();
    var f = sinon.spy();
    var b = circuit.event(f);
    circuit.bind(a, b);
    circuit.unbind(a, b);
    a();
    setTimeout(function() {
      assert(!f.called);
      done();
    }, 0);
  });

  it('no argument', function() {
    assert.throws(function() {
      circuit.unbind();
    });
  });

  it('should not unbind same pair many times', function() {
    var a = circuit.data();
    var b = circuit.data();
    circuit.bind(a, b);
    circuit.unbind(a, b);
    assert.throws(function() {
      circuit.unbind(a, b);
    });
  });

  it('update data cache', function() {
    var a = circuit.data(0);
    var b = circuit.data(0);
    circuit.bind(a, b);
    a(1);
    circuit.unbind(a, b);
    assert.strictEqual(b(), 1);
  });
});
