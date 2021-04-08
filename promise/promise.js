// 1.promise的构造函数中需要传入一个执行器，执行器立即执行
// 2.执行器可以接受两个函数作为参数分别是 resolve 和 reject
// 3.promise有三个状态，分别是等待、成功、失败。默认是等待状态，通过resolve可以将状态改变为成功，通过reject可以将状态改变为失败。规范中要求promise的状态只能由等待变成其他态，不能交叉改变
//   执行器抛出异常时也会导致状态变为失败态
// 4.promise有一个变量用来存储成功的值，有一个变量用来存放失败的原因
// 5.必须有一个then方法，用来进行后续的事件触发响应。then可以接受两个函数作为参数，一个是当状态改变为成功时执行的回调，一个是状态变成失败时的回调
// 6.规范中要求，then返回的必须是一个新的promise
// 7.then中的两个函数参数的执行后得到非 promise 正常返回值将作为下一个新的 promise 的成功值, 异常失败值如抛出错误 throw new Error则将作为下一个新的 promise 的失败值
//    当获取到的值是一个 promise时，需要根据promise的执行结果的状态来决定进入到下一个新promise的哪个状态
// 8.规范中要求在获取then中的函数执行结果时，必须是一个异步的过程 【promise A+ 2.2.4】
// 9.在使用 new 创建promise实例时，执行器内部可能不是同步的执行 resolve 或者 reject，因此需要能够处理异步能力（使用发布订阅模式）
const { needNewPromise } = require('./error.js');

const PENDING/*****/ = 'PENDING'; // 等待
const FULFILLED/***/ = 'FULFILLED'; // 成功
const REJECTED/****/ = 'REJECTED'; // 失败

/**
 * 构造函数
 * @param {*} executor
 */
function Promise(executor) {
  // todo 判断是否通过 new 调用
  this.status = PENDING; // 默认状态
  this.value = void 0; // 成功的值
  this.reason = void 0; // 失败的原因
  this.onResolvedCallbacks = []; // 订阅成功的回调
  this.onRejectedCallbacks = []; // 订阅失败的回调

  const resolve = (value) => {
    // 不在 promise A+ 标准中的场景 resolve 的时候返回的可能是一个 promise
    if (value instanceof Promise) {
      return value.then(resolve, reject);
    }
    if (this.status === PENDING) {
      this.value = value;
      this.status = FULFILLED;
      this.onResolvedCallbacks.forEach((fn) => fn()); // 发布
    }
  }

  const reject = (reason) => {
    if (this.status === PENDING) {
      this.reason = reason;
      this.status = REJECTED;
      this.onRejectedCallbacks.forEach((fn) => fn()); // 发布
    }
  }

  try {
    executor(resolve, reject);
  } catch (error) {
    reject(error);
  }
}

Promise.prototype.then = function (onFulfilled, onRejected) {
  // onFulfilled 和 onRejected都是可选的参数
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v; // 【promise A+ 2.2.7.3】
  onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err }; //【promise A+ 2.2.7.4】
  // ！！！！每次调用 then 都要返回一个全新的promise给下一个then使用，这样才能够实现链式调用，解决回调地狱问题
  let promise2 = new Promise((resolve, reject) => {
    // 成功时调用onFulfilled
    if (this.status === FULFILLED) {
      setTimeout(() => {
        try {
          let x = onFulfilled(this.value);
          resolvePromise(promise2, x, resolve, reject);
        } catch (error) {
          reject(error);
        }
      }, 0);
    }
    // 失败时调用onRejected
    if (this.status === REJECTED) {
      setTimeout(() => {
        try {
          let x = onRejected(this.reason);
          resolvePromise(promise2, x, resolve, reject);
        } catch (error) {
          reject(error);
        }
      }, 0);
    }

    // 执行器是异步时，还是等待状态
    if (this.status === PENDING) {
      // 订阅所有的成功回调和失败回调
      this.onResolvedCallbacks.push(() => {// AOP 切片
        // todo... 这里可以是一些其他操作代码
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      });
      this.onRejectedCallbacks.push(() => {// AOP 切片
        // todo... 这里可以是一些其他操作代码
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      });
    }
  });
  return promise2;
}

/**
 * 1.在编码时有可能返回的promise和new创建的promise指向同一个，这样会导致代码死循环，规范中要求必须不能是同一个 【promise A+ 2.3.1】
 * 2.链式处理数据时需要根据拿到的 x 判断是原始类型值还是对象，如果是对象还要区分是不是又创建了一个 promise,对应上面第7条的内容
 * @param {*} promise2
 * @param {*} x
 * @param {*} resolve
 * @param {*} reject
 */
function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(needNewPromise());
  }

  // 【promise A+ 2.3.3】
  if ((typeof x === 'object' && x != null) || typeof x === 'function') {
    // 规范要求一次执行过程中只能有一种情况被调用，如果同时调用了多种情况也只有第一次调用会生效，其他调用忽略 【promise A+ 2.3.3.3.3】+ 【promise A+ 2.3.3.3.4】
    let called = false;
    // 是对象的话继续判断是否有 then 函数
    try {
      // 【promise A+ 2.3.3.1】
      let then = x.then; // 使用 x.then获取的时候可能会导致异常【promise A+ 2.3.3.2】
      // 需要判断then是否是函数
      if (typeof then === 'function') {
        // 是函数则把x作为then的this指向来调用（不再使用x.then来调用，防止有人修改了defineProperty导致异常）【promise A+ 2.3.3.3】
        then.call(x, y => {
          if (called) return;
          called = true;
          //第一个函数 resolvePromise，可能的结果有两种：普通值y和一个新的promise ==> [[Resolve]](promise, y) 所以需要递归调用【promise A+ 2.3.3.3.1】
          resolvePromise(promise2, y, resolve, reject);
        }, r => {
          if (called) return;
          called = true;
          reject(r); // 【promise A+ 2.3.3.3.2】
        });
      } else {
        // 不是函数直接返回【promise A+ 2.3.3.4】
        resolve(x);
      }
    } catch (error) {
      if (called) return;
      called = true;
      reject(error)
    }
  } else {
    resolve(x);
  }
}

/**
 * promise A+ 测试测试用函数（标准中没有）
 * promises-aplus-tests 要求Promise.deferred()可以返回一个对象如下
 * {
 *   promise,
 *   resolve,
 *   rejected
 * }
 *
 * 这个函数也可以作为一个扩展加入到现在的标准 Promise 中，这样以后再想获取一个Promise可以直接调用这个方法，而不是通过new
 * @returns
 */
Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.reject = reject;
    dfd.resolve = resolve;
  })
  return dfd;
}

module.exports = Promise;