/**
 * 类型判断
 * @param {*} type 需要检查的类型
 * @returns Boolean
 */
function isType(type) {
  return (x) => Object.prototype.toString.call(x) === `[object ${type}]`;
}

exports.isFunction = isType('Function');
