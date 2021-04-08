/**
 * 需要是一个新的 promise，避免循环引用
 * @returns
 */
exports.needNewPromise = function needNewPromise() {
  return new TypeError('Chaining cycle detected for promise #<Promise>')
}

// todo 不能作为普通函数调用