# circuit

Data binding library

## Usage
### In Browser
````
<script src="circuit.js"></script>
````
### node.js
````
var circuit = require('./circuit.js');
````

## SYNOPSIS

````javascript
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
````

## License
Copyright &copy; 2015 iOnStage
Licensed under the [MIT License][mit].

[MIT]: http://www.opensource.org/licenses/mit-license.php