'use strict';

require('co-mocha');
const ContractFactory = require('../index').Contract;
const should = require('chai').should();
const _ = require('lodash');
const co = require('co');


// describe('processor wrapper test', function() {
//     let contractOpt = {
//       name: 'test',
//       url: '/test',
//       method: 'get',
//       result: String,
//       processor: function *() {
//         let msg = '';
//         for (let value of arguments) {
//           msg += `\n\t\tparam = ${JSON.stringify(value)}`;
//         }
//         console.log(`\trunning with ${msg}`);
//       }
//     };

//     it('from query type string', function *() {
//       let opt = _.cloneDeep(contractOpt);
//       opt.params = {
//         a: { TYPE:String, from: 'query'},
//         b: { TYPE:{ TYPE: String }, from: 'query'},
//         c: { TYPE:String, from: 'query', require: false, default:'i am default'}
//       };

//       let contract = ContractFactory(opt);
//       let wrapper = contract._processorWrapper();
//       yield *wrapper.call({
//         query: {
//           a: ['i am a'],
//           b: ['i am b']
//         }
//       }, Promise.resolve());
//     });

//     it('from query type string, but number', function *() {
//       let opt = _.cloneDeep(contractOpt);
//       opt.params = {
//         a: { TYPE:String, from: 'query'},
//         b: { TYPE:String, from: 'query', require: false, default:'i am default'}
//       };

//       let contract = ContractFactory(opt);
//       let wrapper = contract._processorWrapper();
//       try {
//         yield *wrapper.call({ query: { a: [1]} });
//       } catch (err) {
//         err.message.should.be.equal('value 1 is not conform to type define String');
//       }
//     });

//     it('from path type number', function *() {
//       let opt = _.cloneDeep(contractOpt);
//       opt.params = {
//         a: { TYPE:Number, from: 'path'},
//         b: { TYPE: {TYPE: Number}, from: 'path'},
//         c: { TYPE:Number, from: 'path', require: false, default:1000}
//       };

//       let contract = ContractFactory(opt);
//       let wrapper = contract._processorWrapper();
//       yield *wrapper.call({
//         params: {
//           a: 1,
//           b: 2
//         }
//       }, Promise.resolve());
//     });

//     it('from path type number, but string', function *() {
//       let opt = _.cloneDeep(contractOpt);
//       opt.params = {
//         a: { TYPE:Number, from: 'path'},
//         b: { TYPE: {TYPE: Number}, from: 'path'},
//         c: { TYPE:Number, from: 'path', require: false, default:1000}
//       };

//       let contract = ContractFactory(opt);
//       let wrapper = contract._processorWrapper();
//       try {
//         yield *wrapper.call({params: {a: 1,b: 2,c: '3'}});
//       } catch (err) {
//         err.message.should.be.equal('value "3" is not conform to type define Number');
//       }
//     });

//     it('from body type [String]', function *() {
//       let opt = _.cloneDeep(contractOpt);
//       opt.params = {
//         a: { TYPE:[String], from: 'body'},
//         b: { TYPE: [{TYPE: String}], from: 'body'}
//       };

//       let contract = ContractFactory(opt);
//       let wrapper = contract._processorWrapper();
//       yield *wrapper.call({
//         body: ['1', '2', '3']
//       }, Promise.resolve());
//     });

//     it('from body type [String], but has Boolean', function *() {
//       let opt = _.cloneDeep(contractOpt);
//       opt.params = {
//         a: { TYPE:[String], from: 'body'},
//         b: { TYPE: [{TYPE: String}], from: 'body'}
//       };

//       let contract = ContractFactory(opt);
//       let wrapper = contract._processorWrapper();
//       try {
//         yield *wrapper.call({
//           body: ['1', '2', '3', true]
//         });
//       } catch (err) {
//         err.message.should.be.equal('value true is not conform to type define String');
//       }
//     });

//     it('from body type {a: { b: String, c: { d: {TYPE:Boolean }}}}', function *() {
//       let opt = _.cloneDeep(contractOpt);
//       opt.params = {
//         a: { TYPE: { b: String, c: { d: { TYPE: Boolean } } }, from: 'body'}
//       };

//       let contract = ContractFactory(opt);
//       let wrapper = contract._processorWrapper();
//       yield *wrapper.call({
//         body: {
//           b: 'i am b',
//           c: {
//             d: false
//           }
//         }
//       }, Promise.resolve());
//     });

//     it('from body type {a: { b: String, c: { d: {TYPE:Boolean }}}}, but not ok', function *() {
//       let opt = _.cloneDeep(contractOpt);
//       opt.params = {
//         a: { TYPE: { b: String, c: { d: { TYPE: Boolean } } }, from: 'body'}
//       };

//       let contract = ContractFactory(opt);
//       let wrapper = contract._processorWrapper();
//       try {
//         yield *wrapper.call({
//           body: {
//             b: 'i am b',
//             c: {
//               d: 0
//             }
//           }
//         });
//       } catch (err) {
//         err.message.should.be.equal('value 0 is not conform to type define Boolean or is required');
//       }
//     });

//     it('all from type', function *() {
//       let opt = _.cloneDeep(contractOpt);
//       opt.params = {
//         a: { TYPE:Number, from: 'query'},
//         b: { TYPE:Boolean, from: 'path'},
//         c: { TYPE:{ d: [String] }, from: 'body'}
//       };

//       let contract = ContractFactory(opt);
//       let wrapper = contract._processorWrapper();
//       yield *wrapper.call({
//         query: { a: [1] },
//         params: { b: true },
//         body: { d:['i am d', 'i am d'] }
//       }, Promise.resolve());
//     });

//     it('all from type', function *() {
//       let opt = _.cloneDeep(contractOpt);
//       opt.params = {
//         a: { TYPE:Number, from: 'query', require: false, default:9999},
//         b: { TYPE:Boolean, from: 'path'},
//         c: { TYPE:{ d: [String] }, from: 'body'}
//       };

//       let contract = ContractFactory(opt);
//       let wrapper = contract._processorWrapper();
//       yield *wrapper.call({
//         query: {},
//         params: { b: true },
//         body: { d:['i am d', 'i am d'] }
//       }, Promise.resolve());
//     });
//   });