const Promise = require('./index');

new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve();
  }, 1000);
}).then(() => console.log(1))
  .then(() => console.log(2))
  .then(() => console.log(3))
  .then(() => console.log(4))