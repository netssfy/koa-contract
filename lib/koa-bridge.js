'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Router = require('koa-router');
const _ = require('lodash');
const Logger = require('./logger-shim');
const Contract = require('./contract').Contract;

class KoaBridge {
  /**
   * Creates an instance of KoaBridge.
   * 
   * @param {any} options
   * @field Contract[] options.contracts
   * @field {any} options.logger - a logger implementation which has info, debug, error functions
   * @memberOf KoaBridge
   */
  constructor(options) {
    assert(options.contracts, 'options.contracts is not defined');

    this.contracts = {};
    this.logger = new Logger(options ? options.logger : null);
    this._load(options.contracts);
  }

/**
 * mountInfoList
 * {
 *  name: 'contractName',必填
 *  url: '挂载点',可选。如果该值不存在，则使用Contract默认的url
 *  如果mountInfoList不存在，则mount所有加载的contract到它默认url上
 */
  mount(mountInfoList) {
    let router = new Router();
    if (!mountInfoList) {
      for (let name in this.contracts) {
        var contract = this.contracts[name];
        assert(contract.constructor.name === 'Contract', `${JSON.stringify(contract)} is not an instanceof Contract`);

        router[contract.method](contract.url, this._createRouteProcessor(contract));
        this.logger.info(`loaded contract ${contract.name} at [${contract.method}]:[${contract.url}]`);
      }
    } else {
      assert(mountInfoList instanceof Array, 'mountInfo is not an array');
      
      for (let mi of mountInfoList) {
        assert(mi.name, 'mount info item has no name property');
        let contract = this.contracts[mi.name];
        assert(contract, `contract ${mi.name} is not found`);
        assert(contract.constructor.name === 'Contract', `${JSON.stringify(contract)} is not an instanceof Contract`);
        //如果挂载点有定义url，使用挂载点的定义，否则使用默认
        contract.url = mi.url || contract.url;

        router[contract.method](contract.url, this._createRouteProcessor(contract));
        this.logger.info(`loaded contract ${contract.name} at [${contract.method}]:[${contract.url}]`);
      }
    }
    return router.routes();
  }

  _createRouteProcessor(contract) {
    assert(this._isGeneratorFunction(contract.processor), `contract ${contract.name}'s processor is not generator function`);

    return function* (next) {
      //这这里this已经变成koa的this了
      //根据定义获取参数的值
      let paramsValueArray = contract.getRuntimeParamsValue(this.query, this.params, this.request.body, this.request.headers);
      let result = yield * contract.processor.apply(this, paramsValueArray);
      contract.resultData = result;
      this.contract = contract;

      yield next;
    };
  }

  /**
   * contracts:有4种定义
   *           1. 一个Contract
   *           2. 一个[Contract]
   *           3. 如果是一个字符串，则认为是一个路径，会尝试加载将该路劲下所有文件中的所有Contract
   *           4. 还可以是一个对象
   *           { 
   *             path: 目录, 
   *             files: 文件名数组 
   *           }
   *           files也有两种定义，如果是一个字符串，则认为是一个文件名，会尝试加载该文件导出的所有Contract
   *           还可以是一个对象，只加载指定的contract
   *           {
   *             name: 文件名
   *             contractNames: contract名的数组
   *           }
   **/
  _load(contracts) {
    if (contracts instanceof Contract) {
      this.contracts[contracts.name] = contracts;
    } else if (contracts instanceof Array) {
      for (let contract of contracts) {
        if (contract instanceof Contract) {
          this.contracts[contracts.name] = contract;
        }
      }
    } else if (typeof contracts === 'string') {
      //加载目录下所有文件导出的所有Contract
      this.contracts = this._loadAllFromFolder(contracts);
    } else if (typeof contracts === 'object' && contracts.path && contracts.files) {
      //只加载目录下指定的files导出的Contract
      for (let file of contracts.files) {
        if (typeof file === 'string') {
          //加载该文件导出的所有的Contract
          let filePath = path.join(contracts.path, file);
          _.merge(this.contracts, this._loadAllFromFile(filePath));
        } else if (file.name && file.contractNames instanceof Array) {
          //根据contractNames选择性的加载该文件导出的Contract
          let filePath = path.join(contracts.path, file.name);
          _.merge(this.contracts, this._loadPartialFromFile(filePath, file.contractNames));
        }
      }
    }
  }

  //遍历目录，导入所有导出的Contract，以后可以扩展成根据名字加载
  _loadAllFromFolder(folderPath) {
    this.logger.info(`loading all contracts under folder ${folderPath}`);
    let filenameList = fs.readdirSync(folderPath);
    //require每个文件,一个有效的Contract导出文件应该导出一个Contract或Contract数组
    let contracts = {};
    for (let filename of filenameList) {
      _.merge(contracts, this._loadAllFromFile(path.join(folderPath, filename)));
    }
    return contracts;
  }

  /**
 * return value:
 * [{
 *  name: Contract
 * }]
 */
  _loadAllFromFile(filePath) {
    this.logger.info(`loading all contracts in file ${filePath}`);
    let exportedInstance = require(filePath);
    //以数组的形式统一处理
    return _.flatten([exportedInstance])
            .reduce((obj, c) => { return _.merge(obj, { [c.name]: c }); }, {});
  }

  /**
 * return value:
 * [{
 *  name: Contract
 * }]
 */
  _loadPartialFromFile(filePath, contractNames) {
    this.logger.info(`loading ${contractNames} contracts in file ${filePath}`);
    let exportedInstance = require(filePath);
    let contracts = _.flatten([exportedInstance]);
    return _.filter(contracts, c => _.includes(contractNames, c.name))
            .reduce((obj, c) => { return _.merge(obj, { [c.name]: c }); }, {});
  }


  _isGeneratorFunction(obj) {
    if (!obj) return false;
    var constructor = obj.constructor;
    if (!constructor) return false;
    return ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName);
  }
}

exports = module.exports = function(options) {
  return new KoaBridge(options);
};