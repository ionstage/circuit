# circuit

Data binding library

```js
var i = circuit.prop(0);
var square = circuit.prop(function(x) {
  return x * x;
});
circuit.bind(i, square);

var pulse = circuit.event();
var countUp = circuit.event(function() {
  i(i() + 1);
});
circuit.bind(pulse, countUp);

setInterval(function() {
  console.log(square());
  pulse();
}, 1000);
```

## Features

- Cross-browser: works on IE6+, Firefox, Safari, Chrome, Opera
- Node.js ready (require('circuit'))
- Standalone, no dependencies

## Usage

### Browser

```
<script src="circuit.js"></script>
```

### Node

Install it with npm or add it to your `package.json`:

```
$ npm install circuit
```

Then:

```
var circuit = require('circuit');
```

## API

### prop

Return a getter/setter function that stores arbitrary data

```js
// create a getter-setter with initial value `foo`
var text = circuit.prop('foo');

// get the value
var a = text(); // a == "foo"

// set the value to `bar`
text('bar');

// get the value
var b = text(); // b == "bar"
```

Set function for data transformation

```js
// create a getter-setter with function
var message = circuit.prop(function(name) {
  return 'Hello, ' + name;
});

// set the value to `Alice`
message('Alice');

// get the transformed value
var a = message(); // a == "Hello, Alice"

// set the value to `Bob`
message('Bob');

// get the transformed value
var b = message(); // b == "Hello, Bob"
```

### event

Return a function for event transmission

```js
var text = 'Hello, world!';

// create a event function
var hello = circuit.event(function() {
  console.log(text);
});

// call event
hello(); // output: "Hello, World!"
```

Get argument as event context (event.context())

```js
var text = 'Hello, world!';

var hello = circuit.event(function(event) {
  console.log(event.context());
});

hello(text); // output: "Hello, World!"
```

### bind

Bind arguments of prop function (data synchronization)

```js
var a = circuit.prop(0);
var b = circuit.prop(0);

// bind prop 'a' to prop 'b'
circuit.bind(a, b);

// change value of 'a'
a(1);

console.log(b()); // output: 1
```

Support lazy evaluation

```js
var a = circuit.prop(0);
var b = circuit.prop(function(value) {
  console.log('b is called');
  return value;
});

circuit.bind(a, b);

for (var i = 0; i < 10000; i++) {
  a(i);
}

b(); // output "b is called" only once
```

Multiple bind for prop function

```js
var a = circuit.prop(0);
var b = circuit.prop(0);
var sum = circuit.prop(function(x, y) {
  return x + y;
});

// bind value of 'a' to argument 'x' of sum()
circuit.bind(a, sum);

// bind value of 'b' to argument 'y' of sum()
circuit.bind(b, sum);

a(2);
b(3);

console.log(sum()); // output: 5
```

Create event chains

```js
var a = circuit.event();
var b = circuit.event(function() {
  console.log('Hello, world!');
});

// bind event 'a' to event 'b'
circuit.bind(a, b);

// call event 'a'
a();

// event 'b' will be called and output "Hello, world!"
```

Cancel event propagation (event.cancel())

```js
var a = circuit.event();
var b = circuit.event(function(event) {
  event.cancel();
});
var c = circuit.event(function() {
  console.log('Hello, world!');
});

circuit.bind(a, b);
circuit.bind(b, c);

a();

// event 'b' will be called but event 'c' will not be called
```

Dispatch event later (event.dispatch())

```js
var a = circuit.event();
var b = circuit.event(function(event) {
  event.cancel();
  setTimeout(function() {
    event.dispatch();
  }, 1000);
});
var c = circuit.event(function() {
  console.log('Hello, world!');
});

circuit.bind(a, b);
circuit.bind(b, c);

a();

// event 'c' will be called 1 second after
```

Relay event context

```js
var a = circuit.event(function(event) {
  var context = event.context;
  context(context() + 1);
});
var b = circuit.event(function(event) {
  console.log(event.context());
});

circuit.bind(a, b);
a(1);

// event 'b' will be called and output `2`
```

### unbind

Cancel binding of prop/event functions

```js
var a = circuit.prop(0);
var b = circuit.prop(0);
circuit.bind(a, b);

// prop 'a' and prop 'b' are unbound
circuit.unbind(a, b);

a(1);

console.log(b()); // output: 0
```

## Deprecated API

The following methods are deprecated

- create
- connect
- disconnect
- noop

### SYNOPSIS

```js
var foo = circuit.create({
  init: function() {
    var el = this.el; // === foo
    el.i = 0;
  },
  prop: {
    i: {
      out: function() {
        return this.el.i;
      }
    }
  },
  event: {
    countUp: {
      in: function() {
        this.el.i += 1;
        this.el.updateProperty('i');
      }
    }
  }
});

var bar = circuit.create({
  init: function() {
    var el = this.el; // === bar
    el.x = 0;
  },
  prop: {
    x: {
      in: function(value) {
        this.el.x = value;
        this.el.updateProperty('x ^ 2');
      }
    },
    'x ^ 2':  {
      out: function() {
        var x = this.el.x;
        return x * x;
      }
    }
  }
});

var baz = circuit.create({
  prop: {
    print: {
      in: function(value) {
        console.log(value);
      }
    }
  }
});

var qux = circuit.create({
  event: {
    clock: {
      in: function() {
        var el = this.el; // === qux
        setInterval(function() {
          el.dispatchEvent('clock');
        }, 1000);
      },
      out: circuit.noop // empty function
    }
  }
});

var main = circuit.create({
  event: {
    start: {
      out: circuit.noop
    }
  }
});

circuit.connect(foo.prop.i, bar.prop.x); // foo.prop.i.out -> bar.prop.x.in
circuit.connect(bar.prop['x ^ 2'], baz.prop.print);
circuit.connect(qux.event.clock, foo.event.countUp);
circuit.connect(main.event.start, qux.event.clock);

main.dispatchEvent('start');
// print the square of i(count up per second)

setTimeout(function() {
  circuit.disconnect(qux.event.clock, foo.event.countUp);
  console.log('stop counting...');

  setTimeout(function() {
    console.log('restart counting');
    circuit.connect(qux.event.clock, foo.event.countUp);
  }, 5000);
}, 10000);
```

### Using new API

```js
var Foo = function() {
  this.i = circuit.prop(0);
  this.countUp = circuit.event(function() {
    this.i(this.i() + 1);
  }.bind(this));
};

var Bar = function() {
  this.x = circuit.prop(0);
  this['x ^ 2'] = circuit.prop(function(x) {
    return x * x;
  });
  circuit.bind(this.x, this['x ^ 2']);
};

var Baz = function() {
  this.print = circuit.prop(function(value) {
    console.log(value);
  });
};

var Qux = function() {
  this.clock = circuit.event(function(event) {
    event.cancel();
    setInterval(function() {
      event.dispatch();
    }, 1000);
  });
};

var foo = new Foo();
var bar = new Bar();
var baz = new Baz();
var qux = new Qux();

var main = {
  start: circuit.event()
};

circuit.bind(foo.i, bar.x);
circuit.bind(bar['x ^ 2'], baz.print);
circuit.bind(qux.clock, foo.countUp);
circuit.bind(main.start, qux.clock);

main.start();

setTimeout(function() {
  circuit.unbind(qux.clock, foo.countUp);
  console.log('stop counting...');

  setTimeout(function() {
    console.log('restart counting');
    circuit.bind(qux.clock, foo.countUp);
  }, 5000);
}, 10000);
```

## Running tests

Clone the repository and install the developer dependencies:

```
git clone https://github.com/ionstage/circuit.git
cd circuit
npm install
```

Then:

```
npm test
```

## License

Copyright &copy; 2015 iOnStage
Licensed under the [MIT License][mit].

[MIT]: http://www.opensource.org/licenses/mit-license.php