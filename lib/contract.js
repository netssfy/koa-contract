'use strict';

/*
contract用来描述一个接口定义，包括如下字段
{
  name: 'contract name'
  url: '/range/:param1',
  method: 'get',
  description: 'desc',
  params: { paramName1: { TYPE: String, from: 'path', require: true, default: 'value' },
            paramName2: { TYPE: [Number], from: 'query', require: true, defalut: 1000 } }
  result: { TYPE: String, filter: ['xx'], description: 'xxx'}
  processor: function *gen(param1, param2) {},
}
name: 名称
url: 接口地址，必填
method: 接口http方法,可选，默认为get
description: 接口功能描述，可选
params: 接口参数定义。参数定义在下面会描述
result: 返回值定义
{
  TYPE: 返回值类型定义，目前只需描述content字段的内容
  filter: ['fieldName1', 'fieldName2'], 用来过滤resultType
  description: 描述
}
processor: generator function, api逻辑的实现

参数定义：
{
  name: { TYPE: paramTypeDef, from: 'path', require: true, default: 'value' } }]
}
使用大写的TYPE来区分作为对象字段的type,在对象中经常会遇到type作为一个字段名
from的取值为: path, query, body, @body, header
  1. @body是将整个this.request.body与定义的参数绑定, 那此时TYPE一定是一个object定义
  2. body是将this.request.body[paramName]与定义的参数绑定
require缺省为true, require为true时default无效

paramTypeDef：
primTypeDef | { name1 : primTypeDef, name2: { subname1: primTypeDef } } | [primTypeDef | { ... }]

primTypeDef：     基础类型只有3种，既String, Number, Boolean
primTypeDefExt：  基础类型扩展定义，只能用在对象类型内的成员类型上，支持TYPE, require, default
e.g. { TYPE: String, require: true, default: 'abc' }
require缺省为true, require为true时default无效
*/

const _ = require('lodash');
const assert = require('assert');

class Contract {
  constructor(definition) {
    assert(definition, 'contract definition is not defined');
    assert(definition.name, 'contract.name is not defined');
    assert(definition.url, 'contract.url is not defined');
    assert(definition.method, 'contract.method is not defined');
    assert(definition.result, 'contract.result is not defined');

    _.assign(this, definition);

    this._checkParamsDefine();
  }

  //运行时获取真正的参数
  getRuntimeParamsValue(query, params, body, headers) {
    let paramsValueArray = [];
    _(this.params).forEach((paramDef, paramName) => {
      let paramValue = undefined;
      let tryConvert = true;
      if (paramDef.from === 'query') {
        //query[xxx]返回的是个数组
        paramValue = query[paramName];
        //如果类型定义不是一个数组，那么取第一个元素作为值
        if (paramValue && !_isValidArrayType(paramDef.TYPE)) {
          paramValue = paramValue[0];
        }
      } else if (paramDef.from === 'path') {
        paramValue = params[paramName];
      } else if (paramDef.from === 'body') {
        paramValue = body[paramName];
        tryConvert = false;
      } else if (paramDef.from === '@body') {
        paramValue = body;
        tryConvert = false;
      } else if (paramDef.from === 'header') {
        paramValue = headers[paramName];
      } else {
        //这个不应该发生，因为在new Contract时检查过了，这里只是保证逻辑的完整
        throw `param ${paramName} from ${paramDef.from} is not recognized`;
      }
      //从外部获取到了参数，就需要做类型检查
      if (paramValue !== undefined) {
        if (tryConvert) {
          paramValue = _convertStrValueByType(paramDef.TYPE, paramValue);
        }
        _checkValue(paramDef.TYPE, paramValue);
      } else {
        //如果没有获取到参数值，看是否需要应用默认值
        if (paramDef.require === false) {
          paramValue = paramDef.default;
        } else {
          throw `param ${paramName} from ${paramDef.from} is required but undefined`;
        }
      }

      paramsValueArray.push(paramValue);
    });

    return paramsValueArray;
  }

  processResult(resultValue) {
    //filter fields
    resultValue = this._filterResult(resultValue);

    //after filter, need check field value according to its define
    if (!this.novalidate) {
      try {
        //if has TYPE, type define is contained in TYPE
        //otherwise result itself is type defin
        _checkValue(this.result.TYPE || this.result, resultValue);
      } catch (err) {
        throw 'check result failed: ' + err;
      }
    }
    
    return resultValue;
  }

  _filterResult(resultValue) {
    if (this.result.filter) {
      let filter = this.result.filter;
      //filter: ['x', 'x', 'x'] filter的定义直接是字段数组，则对整个result做处理
      if (_.isArray(filter)) {
        resultValue = _filterFields(resultValue, filter);
      } else if (_.isObject(filter)) { //filter：｛ 'xxx', ['x', 'x', 'x']｝
        for (let name in filter) {
          let fields = filter[name];
          let target = resultValue[name];
          if (fields && target) {
            resultValue[name] = _filterFields(target, fields);
          }
        }
      }
    }

    return resultValue;
  }

  _checkParamsDefine() {
    _(this.params).forEach((paramDef, paramName) => {
      try {
        //首先检查是不是正确的参数定义
        _checkParamDefine(paramDef);
        //然后再检查参数的类型定义是否正确
        _checkTypeDefine(paramDef.TYPE);
        //如果有default值，检查default值是否和类型匹配，这里要用undefined, 因为false, 0, null都是可允许的值
        if (paramDef.default !== undefined) {
          _checkValue(paramDef.TYPE, paramDef.default);
        }
      } catch (errmsg) {
        throw `${this.name} param=${paramName} ${errmsg}`;
      }
    });
  }

  _checkResultDefine() {
    try {
      _checkTypeDefine(this.result);
    } catch (errmsg) {
      throw `${this.name} result ${errmsg}`;
    }
  }
}

function _filterFields(value, fields) {
  //如果结果是数组，对数组中每个元素做过滤
  if (_.isArray(value)) {
    value = _.map(value, item => { return _.pick(item, fields); });
  } else {
    value = _.pick(value, fields);
  }

  return value;
}

//尝试将字符串数据转换成定义的数据类型
function _convertStrValueByType(type, strValue) {
  if (typeof strValue !== 'string')
    return strValue;

  if (type === Number) {
    let number = +strValue;
    if (_.isNaN(number)) {
      throw `value ${JSON.stringify(strValue)} can't be converted to type define ${type.name}`;
    } else {
      return number;
    }
  } else if (type === Boolean) {
    if (strValue === 'true')
      return true;
    else if (strValue === 'false')
      return false;
    else
      throw `value ${JSON.stringify(strValue)} can't be converted to type define ${type.name}`;
  } else if (_isValidPrimTypeExt(type)) { 
    return _convertStrValueByType(type.TYPE, strValue);
  } else if (_isValidArrayType(type)) {
    return JSON.parse(strValue);
  } else if (_isValidObjectType(type)) {
    return JSON.parse(strValue);
  } else {
    return strValue;
  }
}

//检查是不是合法的参数定义对象
function _checkParamDefine(paramDef) {
  let result = typeof paramDef === 'object' &&
    paramDef.TYPE &&
    paramDef.from &&
    _(['path', 'body', 'query', '@body', 'header']).includes(paramDef.from);
  if (!result)
    throw 'param define is invalid';
}

//检查是不是合法的类型定义对象
function _checkTypeDefine(typeDef) {
  do {
    if (_isValidPrimType(typeDef))
      break;
    else if (_isValidPrimTypeExt(typeDef))
      break;
    else if (_isValidArrayType(typeDef))
      break;
    else if (_isValidObjectType(typeDef))
      break;
    else
      throw 'type define is invalid';
  } while (false);
}

//检查是不是一个合法的基础类型
function _isValidPrimType(type) {
  return type === String || type === Number || type === Boolean;
}

//检查是不是一个合法的扩展基础类型定义
function _isValidPrimTypeExt(extType) {
  if (typeof extType !== 'object')
    return false;
  if (!extType.TYPE)
    return false;
  if (!_isValidPrimType(extType.TYPE))
    return false;
  //如果有default值，检查default值是否符合定义
  if (extType.default !== undefined) {
    return _isValidPrimValue(extType.TYPE, extType.default);
  } else {
    return true;
  }
}

//检查是不是一个合法的数组类型定义
function _isValidArrayType(arrayTypeDef) {
  if (arrayTypeDef instanceof Array && arrayTypeDef.length === 1) {
    //数组中可能是基础类型，也可能是对象类型(数组嵌套数组的定义因为用处不大，所以这里认为是错误的)
    let innerTypeDef = arrayTypeDef[0];
    _checkTypeDefine(innerTypeDef);
    return true;
  } else {
    return false;
  }
}

//检查是不是一个合法的对象类型定义
function _isValidObjectType(objectTypeDef) {
  if (typeof objectTypeDef === 'object') {
    //对每个字段递归进行检查
    _(objectTypeDef).forEach((memberTypeDef, memberName) => {
      try {
        _checkTypeDefine(memberTypeDef);
      } catch (errmsg) {
        throw `member=${memberName} ${errmsg}`;
      }
    });
    return true;
  } else {
    return false;
  }
}

//检查值是否符合类型定义
function _checkValue(type, value) {
  if (_isValidPrimType(type)) {
    if (_isValidPrimValue(type, value)) {
      return;
    } else {
      throw `value ${JSON.stringify(value)} is not conform to type define ${type.name}`;
    }
  } else if (_isValidPrimTypeExt(type)) {
    if (_isValidPrimValue(type.TYPE, value)) {
      return;
    } else if ((value === undefined || value === null) && type.require === false) { //值不存在，但也不是必须的
      return;
    } else {
      throw `value ${JSON.stringify(value)} is not conform to type define ${type.TYPE.name} or is required`;
    }
  } else if (_isValidArrayType(type)) {
    return _checkArrayValue(type, value);
  } else if (_isValidObjectType(type)) {
    return _checkObjectValue(type, value);
  } else {
    throw `${JSON.stringify(type)} is not qualified`;
  }
}

function _isValidPrimValue(type, value) {
  if (type === String && _.isString(value))
    return true;
  else if (type === Number && _.isNumber(value))
    return true;
  else if (type === Boolean && _.isBoolean(value))
    return true;

  return false;
}

function _checkArrayValue(arrayType, arrayValue) {
  if (!_.isArray(arrayValue))
    throw `type is array, but value=${arrayValue} is not array`;
  
  let innerType = arrayType[0];
  for (let value of arrayValue) {
    _checkValue(innerType, value);
  }
}

function _checkObjectValue(objType, objValue) {
  _(objType).forEach((memberType, memberName) => {
    let memberValue = objValue[memberName];
    try {
      _checkValue(memberType, memberValue);
    } catch(errmsg) {
      throw `object field ${memberName}: ${errmsg}`;
    }
  });
}

exports.Contract = Contract;
exports.ContractFactory = function(definition) {
  return new Contract(definition);
};