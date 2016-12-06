'use strict';

require('co-mocha');
const ContractFactory = require('../index').Contract;
const KoaBridge = require('../index').KoaBridge;
const should = require('chai').should();
const _ = require('lodash');
const co = require('co');
const Koa = require('koa');
const supertest = require('co-supertest');

describe('Contract runtime Unit Test', function() {
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
      return msg;
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

describe('KoaBridge runtime Unit Test', function() {
  function request(contracts) {
    let app = new Koa();
    let bridge = KoaBridge({ contracts: contracts });
    app.use(function* (next) {
      try {
        yield next;
      } catch (err) {
        this.body = { result: err };
      }
    });
    app.use(bridge.mount());
    //need a middle to assign data to body, otherwise will result in 404
    app.use(function* () {
      this.body = { result: this.contract.resultData };
    });
    return supertest(app.callback());
  }
  
  it('simple', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test',
      method: 'get',
      result: String,
      processor: function *() {
        return 'test';
      }
    });

    yield request(contract)
    .get('/test')
    .expect(200, {
      result: 'test'
    })
    .end();
  });

  it('param path number', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test/:number',
      method: 'get',
      params: {
        number: { TYPE: Number, from: 'path' }
      },
      result: Number,
      processor: function *(number) {
        return number;
      }
    });

    yield request(contract)
    .get('/test/1987')
    .expect(200)
    .expect({
      result: 1987
    })
    .end();
  });

  it('param path error', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test/:number',
      method: 'get',
      params: {
        number: { TYPE: Number, from: 'path' }
      },
      result: Number,
      processor: function *(number) {
        return number;
      }
    });

    yield request(contract)
    .get('/test/adfc')
    .expect(200)
    .expect({
      result: 'value "adfc" can\'t be converted to type define Number'
    })
    .end();
  });

  it('param query boolean', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test',
      method: 'get',
      params: {
        boolean: { TYPE: Boolean, from: 'query' }
      },
      result: Boolean,
      processor: function *(boolean) {
        return boolean;
      }
    });

    yield request(contract)
    .get('/test?boolean=true&boolean=true')//mock koa-router's parser
    .expect(200)
    .expect({
      result: true
    })
    .end();
  });

  it('param query boolean not show', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test',
      method: 'get',
      params: {
        boolean: { TYPE: Boolean, from: 'query' }
      },
      result: Boolean,
      processor: function *(boolean) {
        return boolean;
      }
    });

    yield request(contract)
    .get('/test')//mock koa-router's parser
    .expect(200)
    .expect({
      result: 'param boolean from query is required but undefined'
    })
    .end();
  });

  it('param query boolean not boolean', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test',
      method: 'get',
      params: {
        boolean: { TYPE: Boolean, from: 'query' }
      },
      result: Boolean,
      processor: function *(boolean) {
        return boolean;
      }
    });

    yield request(contract)
    .get('/test?boolean=hahah&boolean=hahah')//mock koa-router's parser
    .expect(200)
    .expect({
      result: 'value \"hahah\" can\'t be converted to type define Boolean'
    })
    .end();
  });

  it('result check expect boolean but string', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test',
      method: 'get',
      result: Boolean,
      processor: function *() {
        return 'str value';
      }
    });

    yield request(contract)
    .get('/test')//mock koa-qs's parser
    .expect(200)
    .expect({
      result: 'check result failed: value \"str value\" is not conform to type define Boolean'
    })
    .end();
  });

  it('result check missing field', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test',
      method: 'get',
      result: { a: String, b: Number },
      processor: function *() {
        return { a: 'a' };
      }
    });

    yield request(contract)
    .get('/test')//mock koa-qs's parser
    .expect(200)
    .expect({
      result: 'check result failed: object field b: value undefined is not conform to type define Number'
    })
    .end();
  });

  it('result check field type not match', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test',
      method: 'get',
      result: { a: String, b: Number },
      processor: function *() {
        return { a: 'a', b: 'wrong type' };
      }
    });

    yield request(contract)
    .get('/test')//mock koa-qs's parser
    .expect(200)
    .expect({
      result: 'check result failed: object field b: value \"wrong type\" is not conform to type define Number'
    })
    .end();
  });

  it('result check field not require', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test',
      method: 'get',
      result: { a: { TYPE:String, require: false }, b: { TYPE:Number, require: false } },
      processor: function *() {
        return {};
      }
    });

    yield request(contract)
    .get('/test')//mock koa-qs's parser
    .expect(200)
    .expect({
      result: {}
    })
    .end();
  });

  it('result check field null', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test',
      method: 'get',
      result: { a: String },
      processor: function *() {
        return { a: null };
      }
    });

    yield request(contract)
    .get('/test')//mock koa-qs's parser
    .expect(200)
    .expect({
      result: 'check result failed: object field a: value null is not conform to type define String'
    })
    .end();
  });

  it('result check field null but not required', function* () {
    let contract = ContractFactory({
      name: 'test',
      url:'/test',
      method: 'get',
      result: { a: { TYPE:String, require: false } },
      processor: function *() {
        return { a: null };
      }
    });

    yield request(contract)
    .get('/test')//mock koa-qs's parser
    .expect(200)
    .expect({
      result: { a: null }
    })
    .end();
  });
})