# circuit

Data binding library

```js
var i = circuit.data(1);
var square = circuit.data(function(x) {
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

// output a square number every second
// 1, 4, 9, 16, 25, 36, 49...
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

### data

Return a getter/setter function that stores arbitrary data

```js
// create a getter-setter with initial value `foo`
var text = circuit.data('foo');

// get the value
var a = text(); // a == "foo"

// set the value to `bar`
text('bar');

// get the value
var b = text(); // b == "bar"
```

Set a function for data transformation

```js
// create a getter-setter with the function
var message = circuit.data(function(name) {
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

Get an argument of a function as event context (event.context())

```js
var text = 'Hello, world!';

var hello = circuit.event(function(event) {
  console.log(event.context());
});

hello(text); // output: "Hello, World!"
```

### bind

Bind arguments of data function (data synchronization)

```js
var a = circuit.data(0);
var b = circuit.data(0);

// bind data 'a' to data 'b'
circuit.bind(a, b);

// change value of 'a'
a(1);

console.log(b()); // output: 1
```

Support lazy evaluation

```js
var a = circuit.data(0);
var b = circuit.data(function(value) {
  console.log('b is called');
  return value;
});

circuit.bind(a, b);

for (var i = 0; i < 10000; i++) {
  a(i);
}

b(); // output "b is called" only twice
```

Multiple bind for data function

```js
var a = circuit.data(0);
var b = circuit.data(0);
var sum = circuit.data(function(x, y) {
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

Create event chain

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

Cancel binding of data/event functions

```js
var a = circuit.data(0);
var b = circuit.data(0);
circuit.bind(a, b);

// data 'a' and data 'b' are unbound
circuit.unbind(a, b);

a(1);

console.log(b()); // output: 0
```

## Code example

```js
var Foo = function() {
  this.i = circuit.data(0);
  this.countUp = circuit.event(function() {
    this.i(this.i() + 1);
  }.bind(this));
};

var Bar = function() {
  this.x = circuit.data(0);
  this['x ^ 2'] = circuit.data(function(x) {
    return x * x;
  });
  circuit.bind(this.x, this['x ^ 2']);
};

var Baz = function() {
  this.print = circuit.data(function(value) {
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
