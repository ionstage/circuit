# circuit

Data binding library

[Demo](https://jsfiddle.net/9az08yve/)

```js
var Square = function() {
  this.width = circuit.data(1);
  this.area = circuit.data(function(x) {
    return x * x;
  });
  circuit.bind(this.width, this.area);
};

var Counter = function() {
  this.count = circuit.data(1);
  this.up = circuit.event(function() {
    this.count(this.count() + 1);
  }.bind(this));
};

var square = new Square();
var counter = new Counter();

circuit.bind(counter.count, square.width);

setInterval(function() {
  console.log(square.area());
  counter.up();
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

### circuit.data()

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

### circuit.event()

Return a function for event transmission

```js
// create event function
var hello = circuit.event(function() {
  console.log('Hello, world!');
});

// call event function
hello(); // output: "Hello, World!"
```

Get an argument of a function as event context (use event.context())

```js
var text = 'Hello, world!';

var hello = circuit.event(function(event) {
  console.log(event.context());
});

hello(text); // output: "Hello, World!"
```

### circuit.bind()

Bind arguments of data function (data synchronization)

```js
var a = circuit.data(0);

var b = circuit.data(function(x) {
  return x + 1;
});

var c = circuit.data(function(x) {
  return x * x;
});

// bind data 'a' to data 'b'
circuit.bind(a, b);

// bind data 'b' to data 'c'
circuit.bind(b, c);

// change the value of 'a'
a(1);

console.log(b()); // output: 2
console.log(c()); // output: 4
```

Support lazy evaluation

```js
var a = circuit.data(0);

var b = circuit.data(function(x) {
  console.log('b is called');
  return x;
});

circuit.bind(a, b);

for (var i = 0; i < 10000; i++) {
  a(i);
}

b(); // output "b is called" only twice
```

Multiple binding for data function

```js
var a = circuit.data(0);

var b = circuit.data(0);

var sum = circuit.data(function(x, y) {
  return x + y;
});

// bind the value of 'a' to argument 'x' of sum()
circuit.bind(a, sum);

// bind the value of 'b' to argument 'y' of sum()
circuit.bind(b, sum);

a(2);
b(3);

console.log(sum()); // output: 5

b(5);

console.log(sum()); // output: 7
```

Create event chaining

```js
var a = circuit.event();

var b = circuit.event(function() {
  console.log('b is called');
});

var c = circuit.event(function() {
  console.log('c is called');
});

// bind event 'a' to event 'b'
circuit.bind(a, b);

// bind event 'b' to event 'c'
circuit.bind(b, c);

// call event 'a'
a();

// event 'b' will be called and output "b is called"
// event 'c' will be called and output "c is called"
```

Cancel event propagation (use event.cancel())

```js
var a = circuit.event();

var b = circuit.event(function(event) {
  event.cancel();
  console.log('b is called');
});

var c = circuit.event(function() {
  console.log('c is called');
});

circuit.bind(a, b);
circuit.bind(b, c);

a();

// event 'b' will be called but event 'c' will not be called
```

Dispatch event later (use event.dispatch())

```js
var a = circuit.event();

var b = circuit.event(function(event) {
  event.cancel();
  console.log('b is called');
  setTimeout(function() {
    event.dispatch();
  }, 1000);
});

var c = circuit.event(function() {
  console.log('c is called');
});

circuit.bind(a, b);
circuit.bind(b, c);

a();

// event 'b' will be called and event 'c' will be called 1 second after
```

Relay context of event function one after another

```js
var a = circuit.event(function(event) {
  var context = event.context;
  context(context() + 1);
});

var b = circuit.event(function(event) {
	var context = event.context;
  console.log(context());
  context(context() * context());
});

var c = circuit.event(function(event) {
  console.log(event.context());
});

circuit.bind(a, b);
circuit.bind(b, c);

a(1);

// event 'b' will be called and output "2"
// event 'c' will be called and output "4"
```

### circuit.unbind()

Remove binding of data/event functions

```js
var a = circuit.data(0);

var b = circuit.data(0);

circuit.bind(a, b);

a(1);

// data 'a' and data 'b' are unbound
circuit.unbind(a, b);

a(2);

console.log(b()); // output: 1
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

[MIT]: https://opensource.org/licenses/mit-license.php
