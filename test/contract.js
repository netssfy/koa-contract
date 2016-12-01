'use strict';

require('co-mocha');
const ContractFactory = require('../index').Contract;
const should = require('chai').should();
const _ = require('lodash');
const co = require('co');

describe('Contract define Unit Test', function() {
  describe('param type check test', function() {
    let contractOpt = {
      name: 'test',
      url: '/test',
      method: 'get',
      result: String,
      processor: function *() {}
    };
    //无参定义
    it('no params', function *() {
      ContractFactory(contractOpt);
    });

    it('processor is not generator function', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.processor = () => {};
      runWithError(()=> {
        ContractFactory(opt);
      }, 'contract.processor is not generator function');
    });

    it('wrong param define', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramName: { TYPE: String, from: 'abc' } };
      runWithError(()=> {
        ContractFactory(opt);
      }, 'test param=paramName param define is invalid');
    });

    it('param type String', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: String, from: 'path' } };
      ContractFactory(opt);
    });

    it('param type Date', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: Date, from: 'path' } };
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname type define is invalid');
    });

    it('param type String Ext', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: { TYPE: String }, from: 'path' } };
      ContractFactory(opt);
    });

    it('param type Date Ext', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: { TYPE: Date }, from: 'path' } };
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname member=TYPE type define is invalid');
    });

    it('param type [String]', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: [String], from: 'path'}};
      ContractFactory(opt);
    });

    it('param type [Date]', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: [Date], from: 'path'}};
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname type define is invalid');
    });

    it('param type [{TYPE:String}]', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: [{TYPE:String}], from: 'path'}};
      ContractFactory(opt);
    });

    it('param type [{TYPE:Date}]', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: [{TYPE:Date}], from: 'path'}};
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname member=TYPE type define is invalid');
    });

    it('param type { a: String, b: {TYPE:Number}}', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: {a: String, b: {TYPE:Number} }, from: 'path'} };
      ContractFactory(opt);
    });

    it('param type { a: String, b: {TYPE:Date}}', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: {a: String, b: {TYPE:Date} }, from: 'path'} };
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname member=b member=TYPE type define is invalid');
    });

    it('param type { a: { b: String, c: { TYPE: String} } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: { a: { b: String, c: { TYPE: String} } }, from: 'path'} };
      ContractFactory(opt);
    });

    it('param type { a: { b: String, c: { TYPE: Date} } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: { a: { b: String, c: { TYPE: Date} } }, from: 'path'} };
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname member=a member=c member=TYPE type define is invalid');
    });

    it('param type { a: [{ b: String}]}', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: { a: [{ b: String}]}, from: 'path'} };
      ContractFactory(opt);
    });

    it('param type { a: [{ b: Date}]}', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params = { paramname: { TYPE: { a: [{ b: Date}]}, from: 'path'} };
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname member=a member=b type define is invalid');
    });
  });

  describe('default value test', function() {
    let contractOpt = {
      name: 'test',
      url: '/test',
      method: 'get',
      result: String,
      params: { paramname: {from: 'path'} },
      processor: function *() {}
    };

    it('param type { TYPE: String, default: a }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = String;
      opt.params.paramname.default = 'a';
      ContractFactory(opt);
    });

    it('param type { TYPE: String, default: 1 }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = String;
      opt.params.paramname.default = 1;
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname value 1 is not conform to type define String');
    });

    it('param type { TYPE: { TYPE: String }, default: a }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { TYPE: String };
      opt.params.paramname.default = 'a';
      ContractFactory(opt);
    });

    it('param type { TYPE: { TYPE: String }, default: 1 }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { TYPE: String };
      opt.params.paramname.default = 1;
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname value 1 is not conform to type define String or is required');
    });

    it('param type { TYPE: [String], default: [a,b] }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = [String];
      opt.params.paramname.default = ['a', 'b'];
      ContractFactory(opt);
    });

    it('param type { TYPE: [String], default: [a,1] }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = [String];
      opt.params.paramname.default = ['a', 1];
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname value 1 is not conform to type define String');
    });

    it('param type { TYPE: [{TYPE:Number}], default: [1,2] }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = [{TYPE: Number}];
      opt.params.paramname.default = [1, 2];
      ContractFactory(opt);
    });

    it('param type { TYPE: [{TYPE:Number}], default: [a,1] }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = [{TYPE: Number}];
      opt.params.paramname.default = ['a', 1];
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname value "a" is not conform to type define Number or is required');
    });

    it('param type { TYPE: { a: Number, b: { TYPE: String } }, default: { a:1, b: str } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { a: Number, b: { TYPE: String } };
      opt.params.paramname.default = { a:1, b: 'str'};
      ContractFactory(opt);
    });

    it('param type { TYPE: { a: Number, b: { TYPE: String, require: false } }, default: { a:1 } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { a: Number, b: { TYPE: String, require: false } };
      opt.params.paramname.default = { a:1 };
      ContractFactory(opt);
    });

    it('param type { TYPE: { a: Number, b: { TYPE: String } }, default: { a:1 } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { a: Number, b: { TYPE: String } };
      opt.params.paramname.default = { a:1 };
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname object field b: value undefined is not conform to type define String or is required');
    });

    it('param type { TYPE: { a: Number, b: [Boolean] }, default: { a:1, b: [false] } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { a: Number, b: [Boolean] };
      opt.params.paramname.default = { a:1, b: [false] };
      ContractFactory(opt);
    });

    it('param type { TYPE: { a: Number, b: [{TYPE:Boolean, require: false}] }, default: { a:1, b: [false] } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { a: Number, b: [{TYPE:Boolean, require:false}] };
      opt.params.paramname.default = { a:1, b: [false] };
      ContractFactory(opt);
    });

    it('param type { TYPE: { a: Number, b: [{TYPE:Boolean, require: true}] }, default: { a:1, b: [false] } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { a: Number, b: [{TYPE:Boolean, require:true}] };
      opt.params.paramname.default = { a:1, b: [] };
      ContractFactory(opt);
    });

    it('param type { TYPE: { a: Number, b: [{TYPE:Boolean}] }, default: { a:1, b: [false] } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { a: Number, b: [{TYPE:Boolean}] };
      opt.params.paramname.default = { a:1, b: ['false'] };
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname object field b: value "false" is not conform to type define Boolean or is required');
    });

    it('param type { TYPE: { a: Number, b: [{c: String, d: {TYPE: Number}}] }, default: { a:1, b: [] } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { a: Number, b: [{c: String, d: {TYPE:Number}}] };
      opt.params.paramname.default = { a:1, b: [] };
      ContractFactory(opt);
    });

    it('param type { TYPE: { a: Number, b: [{c: String, d: {TYPE: Number}}] }, default: { a:1, b: [{ c: str, d: 1}] } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { a: Number, b: [{c: String, d: {TYPE:Number}}] };
      opt.params.paramname.default = { a:1, b: [{c:'str', d:1}] };
      ContractFactory(opt);
    });

    it('param type { TYPE: { a: Number, b: [{c: String, d: {TYPE: Number}}] }, default: { a:1, b: [{ c: str, d: 1}, { c: str, d: 1}] } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { a: Number, b: [{c: String, d: {TYPE:Number}}] };
      opt.params.paramname.default = { a:1, b: [{c:'str', d:1}, {c:'str', d:1}] };
      ContractFactory(opt);
    });

    it('param type { TYPE: { a: Number, b: [{c: String, d: {TYPE: Number}}] }, default: { a:1, b: [{ c: str, d: 1}, { c: str, d: true}] } }', function *() {
      let opt = _.cloneDeep(contractOpt);
      opt.params.paramname.TYPE = { a: Number, b: [{c: String, d: {TYPE:Number}}] };
      opt.params.paramname.default = { a:1, b: [{c:'str', d:1}, {c:'str', d:true}] };
      runWithError(() => {
        ContractFactory(opt);
      }, 'test param=paramname object field b: object field d: value true is not conform to type define Number or is required');
    });
  });
});

function runWithError(exec, expectedError) {
  try {
    exec();
  } catch (err) {
    if (err.message)
      err.message.should.be.equal(expectedError);
    else
      err.should.be.equal(expectedError);
  }
}