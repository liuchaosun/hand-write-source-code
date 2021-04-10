/**
 * 需要是一个新的 promise，避免循环引用
 * @returns
 */
exports.needNewPromise = function needNewPromise() {
  return new TypeError('Chaining cycle detected for promise #<Promise>');
};

/**
 * 需要一个函数作为参数
 * @returns
 */
exports.needAFunction = function needAFunction() {
  throw new TypeError('new Promise() should have a "function" params but found nothing!');
};

/**
 * ecma 中规定 Promise不能作为普通函数使用
 */
exports.forbidenNoNew = function forbidenNoNew() {
  throw new TypeError('不可以作为普通函数使用');
};
