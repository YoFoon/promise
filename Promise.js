// pending: 进行中
// fulfilled: 成功的操作
// rejected: 失败的操作
// settled: 已被 fulfilled 或者 rejected
/**
 * Promise 的两个重要方法
 * 1. then  将事物添加到事物队列中
 * 2. resolve  开启流程， 让整个操作从第一个事物开始执行
 */


var PENDING = 0; //进行中
var FULFILLED = 1; //成功
var REJECTED = 2; //失败

function Promise(fn) {

	//存储PENDING, FULFILLED 或者 REJECTED 的状态
	var state = PENDING; //一开始是PENDING状态

	//存储成功或者失败的结果
	var value = null;

	//存储成功或者失败的处理程序。 通过 `.then` 或者 `.done` 方法
	var handlers = [];

	//成功状态变化
	function fulfill ( result ) {
		state = FULFILLED;
		value = result;

		handlers.forEach(handle);
		handlers = null;
	} 

	//失败状态变化
	function reject ( err ) {
		state = REJECTED;
		value = err;

		handlers.forEach(handle);
		handlers = null;
	}

	/**
	 * resolve 的实现
	 * resolve 方法可以接收的参数有两种
	 * 
	 * 1. 一个普通的值/对象
	 * 		直接把结果传递到下一个对象
	 * 		
	 * 2.一个Promise对象
	 * 		必选先等这个子任务序列完成 	
	 */
	
	function resolve(result) {

		try{

			var then = getThen(result);

			//如果是一个Promise对象
			if ( then ) {
				doResolve(then.bind(result), resolve, reject);
				return;
			}
			//修改状态，传递到下一个事物
			fulfill(result);

		} catch ( e ) {
			// 失败
			reject(e);

		}

	}

	// 不同的状态，进行不同的处理
	function handle( handler ) {
		if( state === PENDING ) {
			handlers.push(handler);
		} else {

			if ( state === FULFILLED && typeof handler.onFulfilled === 'function' ) {
				handler.onFulfilled(value);
			}

			if ( state === REJECTED && typeof handler.onRejected === 'function' ){
				handler.onRejected(value);
			}

		}
	}


	this.done = function (onFulfilled, onRejected) {
		// 保证异步
		setTimeout(function() {
			handle({
				onFulfilled: onFulfilled,
				onRejected: onRejected
			});
		}, 0);
	}

	// then 实现
	// 在处理程序中新建一个Promise
	
	this.then = function(onFulfilled, onRejected) {

		var self = this;

		return new Promise( function(resolve, reject) {

			return self.done(  function( result ) {

				if( typeof onFulfilled == 'function' ) {
					try {
						return resolve(onFulfilled(result));
					} catch (e) {
						return reject(e);
					}
				} else {
					return resolve(result);
				}

			}, function(err) {

				if (typeof onRejected === 'function') {
					try{
						return resolve(onRejected(err));
					}catch(e) {
						return reject(e);
					}
				}else {
					return reject(err);
				}

			} )

		} )

	}


	//fn 允许调用resolve 或者 reject多次，甚至抛出异常
	//取决于我们去保证Promise对象仅被resolved或者rejected一次，切状态不能随意改变
	doResolve(fn, resolve, reject);
}

/**
 * 判断 value 是否为一个 Promise 对象
 * @param  object || function  then对象
 */
function getThen(value) {
	var t = typeof value;

	if ( value && ( t === 'object' || t === 'function' ) ) {

		var then = value.then;
		if ( typeof then === 'function' ) {
			return then;
		}
	}

	return null;
}

/**
 * 让未完成的Promise完成后，执行then中的Peomise
 * onFulfilled 和 onRejected 只执行一次
 * @param  {Function} fn          [description]
 * @param  {[type]}   onFulfilled [description]
 * @param  {[type]}   onRejected  [description]
 * @return {[type]}               [description]
 */
function doResolve( fn, onFulfilled, onRejected ) {

	var done = false;

	try {

		fn( function(value) {

			if(done) return;
			done = true;
			onFulfilled(value);

		}, function(reason) {

			if(done) return;
			done = true;
			onRejected(reason);

		});

	} catch ( e ) {
		if(done) return;
		done = true;
		onRejected(e);
	}

}