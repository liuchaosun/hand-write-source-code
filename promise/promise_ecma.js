const Promise = require('./promise_A+.js');

// 静态方法（没有this）
Promise.resolve = function () {
  console.log('resolve');
}
Promise.reject = function () {
  console.log('reject');
}
Promise.all = function () {
  console.log('all');
}
Promise.race = function () {
  console.log('race');
}
// 实例方法（有this）
Promise.prototype.catch = function () {
  console.log('catch');
}
Promise.prototype.finally = function () {
  console.log('finally');
}

module.exports = Promise;