var assert = require('assert');
var Bacon = require('baconjs');
var sinon = require('sinon');
var Symbol = require('../src/common/symbol');

var makeElementStreamMerger = require('../src/platform-implementation-js/lib/dom/make-element-stream-merger');

describe('makeElementStreamMerger', function() {
  it('passes through unrelated events', function(done) {
    var e1 = {
      el: Symbol('e1.el'),
      removalStream: new Bacon.Bus()
    };
    var e2 = {
      el: Symbol('e2.el'),
      removalStream: new Bacon.Bus()
    };
    var i = 0;
    Bacon.fromArray([e1, e2]).flatMap(makeElementStreamMerger()).onValue(function(event) {
      switch (++i) {
        case 1:
          assert.strictEqual(event.el, e1.el);
          event.removalStream.onValue(function() {
            assert.strictEqual(i, 2);
            done();
          });
          break;
        case 2:
          assert.strictEqual(event.el, e2.el);
          event.removalStream.onValue(function() {
            throw new Error("Should not be removed");
          });
          e1.removalStream.push(null);
          e1.removalStream.end();
          break;
        default:
          throw new Error("Should not happen");
      }
    });
  });

  it('can persist elements', function(done) {
    // All but e2 and e5 are element events concerning the same element "e1.el".
    // The element will be removed and re-added instantly several times (which
    // means those element events should be merged) and then the element will
    // be removed and re-added a moment later (e6), which shouldn't get merged
    // and should get its own event.
    var e1 = {
      el: Symbol('e1.el'),
      removalStream: new Bacon.Bus()
    };
    var e2 = {
      el: Symbol('e2.el'),
      removalStream: new Bacon.Bus()
    };
    var e3 = {
      el: e1.el,
      removalStream: new Bacon.Bus()
    };
    var e4 = {
      el: e1.el,
      removalStream: new Bacon.Bus()
    };
    var e5 = {
      el: Symbol('e5.el'),
      removalStream: new Bacon.Bus()
    };
    var e6 = {
      el: e1.el,
      removalStream: new Bacon.Bus()
    };
    var bus = new Bacon.Bus(), i = 0, elWasRemoved = false;
    bus.flatMap(makeElementStreamMerger()).onValue(function(event) {
      switch(++i) {
        case 1:
          assert.strictEqual(event.el, e1.el);
          event.removalStream.onValue(function() {
            assert.strictEqual(i, 3, 'check that e1.el is removed after e5 is received');
            elWasRemoved = true;
          });
          break;
        case 2:
          assert.strictEqual(event.el, e2.el);
          setTimeout(function() {
            e3.removalStream.push(null);
            e3.removalStream.end();
            bus.push(e4);
            bus.push(e5);
          }, 0);
          break;
        case 3:
          assert.strictEqual(event.el, e5.el);

          // This should finally trigger the first event's removal stream in
          // case 1.
          e4.removalStream.push(null);
          e4.removalStream.end();

          setTimeout(function() {
            bus.push(e6);
          }, 0);
          break;
        case 4:
          assert(elWasRemoved, 'has received a removal event for e1.el');
          assert.strictEqual(event.el, e1.el);
          done();
          break;
        default:
          throw new Error("Should not happen");
      }
    });
    bus.push(e1);
    setTimeout(function() {
      e1.removalStream.push(null);
      e1.removalStream.end();
      bus.push(e2);
      bus.push(e3);
    }, 0);
  });

  it('warns if element stays in multiple streams', function(done) {
    sinon.stub(console, "warn");
    after(function() {
      console.warn.restore();
    });
    var e1 = {
      el: Symbol('e1.el'),
      removalStream: new Bacon.Bus()
    };
    var e2 = {
      el: e1.el,
      removalStream: new Bacon.Bus()
    };
    var e3 = {
      el: e1.el,
      removalStream: new Bacon.Bus()
    };
    var i = 0;
    Bacon.fromArray([e1, e2, e3]).flatMap(makeElementStreamMerger()).onValue(function(event) {
      switch(++i) {
        case 1:
          setTimeout(function() {
            assert(console.warn.called > 0, 'console.warn was called');
            done();
          }, 5);
          break;
        default:
          throw new Error("Should not happen");
      }
    });
  });
});