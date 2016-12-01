'use strict';

require('co-mocha');
const ContractFactory = require('../index').Contract;
const KoaBridge = require('../index').KoaBridge;
const should = require('chai').should();
const _ = require('lodash');
const co = require('co');

describe('KoaBridge processor Unit Test', function() {
    let contractOpt = {
      name: 'test',
      url: '/test',
      method: 'get',
      result: String,
      processor: function *() {
        let msg = '';
        for (let value of arguments) {
          msg += `\n\t\tparam = ${JSON.stringify(value)}`;
        }
        console.log(`\trunning with ${msg}`);
      }
    };

    it('from query type string', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE:String, from: 'query'},
        b: { TYPE:{ TYPE: String }, from: 'query'},
        c: { TYPE:String, from: 'query', require: false, default:'i am default'}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      yield *processor.call({
        query: {
          a: ['i am a'],
          b: ['i am b']
        },
        request: {}
      }, Promise.resolve());
    });

    it('from query type string, but number', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE:String, from: 'query'},
        b: { TYPE:String, from: 'query', require: false, default:'i am default'}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      try {
        yield *processor.call({ 
          query: { a: [1]},
          request: {} 
        });
      } catch (err) {
        err.should.be.equal('value 1 is not conform to type define String');
      }
    });

    it('from path type number', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE:Number, from: 'path'},
        b: { TYPE: {TYPE: Number}, from: 'path'},
        c: { TYPE:Number, from: 'path', require: false, default:1000}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      yield *processor.call({
        params: {
          a: 1,
          b: 2
        },
        request: {}
      }, Promise.resolve());
    });

    it('from path type number, but string', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE:Number, from: 'path'},
        b: { TYPE: {TYPE: Number}, from: 'path'},
        c: { TYPE:Number, from: 'path', require: false, default:1000}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      try {
        yield *processor.call({
          params: {a: 1,b: 2,c: '3'}, 
          request: {}
        }, Promise.resolve());
      } catch (err) {
        err.should.be.equal('value "3" is not conform to type define Number');
      }
    });

    it('from body type [String]', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE:[String], from: '@body'},
        b: { TYPE: [{TYPE: String}], from: '@body'}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      yield *processor.call({
        request: {
          body: ['1', '2', '3']
        }
      }, Promise.resolve());
    });

    it('from body type [String], but has Boolean', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE:[String], from: '@body'},
        b: { TYPE: [{TYPE: String}], from: '@body'}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      try {
        yield *processor.call({
          request: {
            body: ['1', '2', '3', true]
          }
        });
      } catch (err) {
        err.should.be.equal('value true is not conform to type define String');
      }
    });

    it('from body type {a: { b: String, c: { d: {TYPE:Boolean }}}}', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE: { b: String, c: { d: { TYPE: Boolean } } }, from: '@body'}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      yield *processor.call({
        request: {
          body: {
            b: 'i am b',
            c: {
              d: false
            }
          }
        }
      }, Promise.resolve());
    });

    it('from body type [String]', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE:[String], from: 'body'}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      yield *processor.call({
        request: {
          body: {
            a: ['1']
          }
        }
      }, Promise.resolve());
    });

    it('from body type [String], but element value is number', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE:[String], from: 'body'}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      try {
        yield *processor.call({
          request: {
            body: {
              a: [1]
            }
          }
        }, Promise.resolve());
      } catch(err) {
        err.should.be.equal('value 1 is not conform to type define String');
      }
    });

    it('from body type [String], but value is string', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE:[String], from: 'body'}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      try {
        yield *processor.call({
          request: {
            body: {
              a: '1'
            }
          }
        }, Promise.resolve());
      } catch(err) {
        err.should.be.equal('type is array, but value=1 is not array');
      }
    });

    it('from body type {a: { b: String, c: { d: {TYPE:Boolean }}}}, but not ok', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE: { b: String, c: { d: { TYPE: Boolean } } }, from: '@body'}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      try {
        yield *processor.call({
          request: {
            body: {
              b: 'i am b',
              c: {
                d: 0
              }
            }
          }
        });
      } catch (err) {
        err.should.be.equal('object field c: object field d: value 0 is not conform to type define Boolean or is required');
      }
    });

    it('all from type', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE:Number, from: 'query'},
        b: { TYPE:Boolean, from: 'path'},
        c: { TYPE:{ d: [String] }, from: '@body'}
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      yield *processor.call({
        query: { a: [1] },
        params: { b: true },
        request: {
          body: { d:['i am d', 'i am d'] }
        }
      }, Promise.resolve());
    });

    it('all from type', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = {
        a: { TYPE:Number, from: 'query', require: false, default:9999 },
        b: { TYPE:Boolean, from: 'path' },
        c: { TYPE:{ d: [String] }, from: '@body' }
      };

      let contract = ContractFactory(opt);
      let processor = KoaBridge({ contracts: contract })._createRouteProcessor(contract);
      yield *processor.call({
        query: {},
        params: { b: true },
        request: {
          body: { d:['i am d', 'i am d'] }
        }
      }, Promise.resolve());
    });
  });