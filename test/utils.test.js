
/**
 * Module dependencies.
 */

var start = require('./common')
  , mongoose = start.mongoose
  , Schema = mongoose.Schema
  , utils = require('../lib/utils')
  , StateMachine = require('../lib/statemachine')
  , ObjectId = require('../lib/types/objectid')
  , MongooseBuffer = require('../lib/types/buffer')

/**
 * Setup.
 */

var ActiveRoster = StateMachine.ctor('require', 'init', 'modify');

/**
 * Test.
 */

module.exports = {

  'should detect a path as required if it has been required': function () {
    var ar = new ActiveRoster();
    ar.require('hello');
    ar.paths['hello'].should.equal('require');
  },

  'should detect a path as inited if it has been inited': function () {
    var ar = new ActiveRoster();
    ar.init('hello');
    ar.paths['hello'].should.equal('init');
  },

  'should detect a path as modified': function () {
    var ar = new ActiveRoster();
    ar.modify('hello');
    ar.paths['hello'].should.equal('modify');
  },

  'should remove a path from an old state upon a state change': function () {
    var ar = new ActiveRoster();
    ar.init('hello');
    ar.modify('hello');
    ar.states.init.should.not.have.property('hello');
    ar.states.modify.should.have.property('hello');
  },

  'forEach should be able to iterate through the paths belonging to one state': function () {
    var ar = new ActiveRoster();
    ar.init('hello');
    ar.init('goodbye');
    ar.modify('world');
    ar.require('foo');
    ar.forEach('init', function (path) {
      ['hello', 'goodbye'].should.contain(path);
    });
  },

  'forEach should be able to iterate through the paths in the union of two or more states': function () {
    var ar = new ActiveRoster();
    ar.init('hello');
    ar.init('goodbye');
    ar.modify('world');
    ar.require('foo');
    ar.forEach('modify', 'require', function (path) {
      ['world', 'foo'].should.contain(path);
    });
  },

  'forEach should iterate through all paths that have any state if given no state arguments': function () {
    var ar = new ActiveRoster();
    ar.init('hello');
    ar.init('goodbye');
    ar.modify('world');
    ar.require('foo');
    ar.forEach(function (path) {
      ['hello', 'goodbye', 'world', 'foo'].should.contain(path);
    });
  },

  'should be able to detect if at least one path exists in a set of states': function () {
    var ar = new ActiveRoster();
    ar.init('hello');
    ar.modify('world');
    ar.some('init').should.be.true;
    ar.some('modify').should.be.true;
    ar.some('require').should.be.false;
    ar.some('init', 'modify').should.be.true;
    ar.some('init', 'require').should.be.true;
    ar.some('modify', 'require').should.be.true;
  },

  'should be able to `map` over the set of paths in a given state': function () {
    var ar = new ActiveRoster();
    ar.init('hello');
    ar.modify('world');
    ar.require('iAmTheWalrus');
    var suffixedPaths = ar.map('init', 'modify', function (path) {
      return path + '-suffix';
    });
    suffixedPaths.should.eql(['hello-suffix', 'world-suffix']);
  },

  "should `map` over all states' paths if no states are specified in a `map` invocation": function () {
    var ar = new ActiveRoster();
    ar.init('hello');
    ar.modify('world');
    ar.require('iAmTheWalrus');
    var suffixedPaths = ar.map(function (path) {
      return path + '-suffix';
    });
    suffixedPaths.should.eql(['iAmTheWalrus-suffix', 'hello-suffix', 'world-suffix']);
  },

  'test utils.options': function () {
    var o = { a: 1, b: 2, c: 3, 0: 'zero1' };
    var defaults = { b: 10, d: 20, 0: 'zero2' };
    var result = utils.options(defaults, o);
    result.a.should.equal(1);
    result.b.should.equal(2);
    result.c.should.equal(3);
    result.d.should.equal(20);
    o.d.should.equal(result.d);
    result['0'].should.equal('zero1');

    var result2 = utils.options(defaults);
    result2.b.should.equal(10);
    result2.d.should.equal(20);
    result2['0'].should.equal('zero2');

    // same properties/vals
    defaults.should.eql(result2);

    // same object
    defaults.should.not.equal(result2);
  },

  'test deepEquals on ObjectIds': function () {
    var s = (new ObjectId).toString();

    var a = new ObjectId(s)
      , b = new ObjectId(s);

    utils.deepEqual(a, b).should.be.true;
    utils.deepEqual(a, a).should.be.true;
    utils.deepEqual(a, new ObjectId).should.be.false;
  },

  'deepEquals on MongooseDocumentArray works': function () {
    var db = start()
      , A = new Schema({ a: String })
      , M = db.model('deepEqualsOnMongooseDocArray', new Schema({
            a1: [A]
          , a2: [A]
        }));

    db.close();

    var m1 = new M({
        a1: [{a: 'Hi'}, {a: 'Bye'}]
    });

    m1.a2 = m1.a1;
    utils.deepEqual(m1.a1, m1.a2).should.be.true;

    var m2 = new M;
    m2.init(m1.toObject());

    utils.deepEqual(m1.a1, m2.a1).should.be.true;

    m2.set(m1.toObject());
    utils.deepEqual(m1.a1, m2.a1).should.be.true;
  },

  // gh-688
  'deepEquals with MongooseBuffer': function () {
    var str = "this is the day";
    var a = new MongooseBuffer(str);
    var b = new MongooseBuffer(str);
    var c = new Buffer(str);
    var d = new Buffer("this is the way");
    var e = new Buffer("other length");

    utils.deepEqual(a, b).should.be.true;
    utils.deepEqual(a, c).should.be.true;
    utils.deepEqual(a, d).should.be.false;
    utils.deepEqual(a, e).should.be.false;
    utils.deepEqual(a, []).should.be.false;
    utils.deepEqual([], a).should.be.false;
  }

};
