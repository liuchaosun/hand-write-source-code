const { isFunction } = require('./utils');

const Promise = require('./promise.js');

// 静态方法（没有this）
Promise.resolve = function (value) {
  return new Promise((resolve) => resolve(value));
}
Promise.reject = function (reason) {
  return new Promise((resolve, reject) => reject(reason));
}
Promise.all = function () {
  console.log('all');
}
Promise.race = function () {
  console.log('race');
}


// 实例方法（有this）
Promise.prototype.catch = function (onReject) {
  return this.then(undefined, onReject);
}
Promise.prototype.finally = function (onFinally) {
  // 通过 this 拿到实例对象
  let promise = this;
  // constructor ==> Promise
  let constructor = promise.constructor;
  if (isFunction(onFinally)) {
    return promise.then(
      (value) => constructor.resolve(onFinally()).then(() => value),
      (reason) => constructor.resolve(onFinally()).then(() => { throw reason; })
    );
  }
  return promise.then(onFinally, onFinally);
}

module.exports = Promise;