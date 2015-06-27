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
  it('prop', function(done) {
    var obj0 = {};
    var a = circuit.prop(obj0);
    var b = circuit.prop();
    circuit.bind(a, b);
    setTimeout(function() {
      assert.equal(b(), obj0);
      var obj1 = {};
      a(obj1);
      setTimeout(function() {
        assert.equal(b(), obj1);
        done();
      }, 0);
    }, 0);
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

  it('should not bind same props many times', function() {
    var a = circuit.prop();
    var b = circuit.prop();
    circuit.bind(a, b);
    assert.throws(function() {
      circuit.bind(a, b);
    });
  });

  it('should not update prop when setting same value', function(done) {
    var a = circuit.prop(1);
    var b = sinon.spy();
    b.type = 'prop';
    b.sources = [];
    circuit.bind(a, b);
    setTimeout(function() {
      a(1);
      setTimeout(function() {
        assert(b.calledOnce);
        done();
      }, 0);
    }, 0);
  });

  it('bind prop with setting function as argument', function(done) {
    var a = circuit.prop(function(value) {
      return value;
    });
    var b = circuit.prop();
    circuit.bind(a, b);
    setTimeout(function() {
      var obj = {};
      a(obj);
      setTimeout(function() {
        assert.equal(b(), obj);
        done();
      }, 0);
    }, 0);
  });

  it('bind prop more than once', function(done) {
    var a = circuit.prop(0);
    var b = circuit.prop(1);
    var obj = {
      prop: sinon.spy()
    };
    obj.prop.type = 'prop';
    obj.prop.sources = [];
    circuit.bind(a, obj.prop);
    circuit.bind(b, obj.prop);
    a(1);
    setTimeout(function() {
      assert(obj.prop.thirdCall.calledWith(1, 1));
      done();
    }, 0);
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
});

describe('unbind', function() {
  it('prop', function(done) {
    var a = circuit.prop();
    var b = circuit.prop();
    circuit.bind(a, b);
    circuit.unbind(a, b);
    var obj = {};
    a(obj);
    setTimeout(function() {
      assert.notEqual(b(), obj);
      done();
    }, 0);
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
});