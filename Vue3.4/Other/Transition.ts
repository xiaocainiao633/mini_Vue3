// Transition使用：
// <script type="module">
// 	import {
// 		Transition,
// 		Teleport,
// 		defineAsyncComponent,
// 		createRenderer,
// 		h,
// 		render,
// 		Text,
// 		Fragment,
// 		ref,
// 		reactive,
// 		getCurrentInstance,
// 		onMounted,
// 		provide,
// 		inject,
// 		toRef,
// 		KeepAlive
// 	} from '/node_modules/@vue/runtime-dom/dist/runtime-dom.esm-browser.js';
// 	const props = {
// 		onBeforeEnter(el) {
// 			console.log(el, 'beforeEnter');
// 		},
// 		onEnter(el) {
// 			console.log(el, 'enter');
// 		},
// 		onLeave(el) {
// 			console.log(el, 'leave');
// 		}
// 	};
// 	render(
// 		h(Transition, props, {
// 			default: () => {
// 				return h(
// 					'div',
// 					{ style: { width: '100px', height: '100px', background: 'red' } },
// 					'haha'
// 				);
// 			}
// 		}),
// 		app
// 	);
// 	setTimeout(() => {
// 		render(
// 			h(Transition, props, {
// 				default: () => {
// 					return h(
// 						'p',
// 						{ style: { width: '100px', height: '100px', background: 'blue' } },
// 						'world'
// 					);
// 				}
// 			}),
// 			app
// 		);
// 	}, 4000);
// 	setTimeout(() => {
// 		render(
// 			h(Transition, props, {
// 				default: () => {
// 					return h(
// 						'div',
// 						{ style: { width: '100px', height: '100px', background: 'red' } },
// 						'haha'
// 					);
// 				}
// 			}),
// 			app
// 		);
// 	}, 8000);
// </script>
// <style>
// 	.v-enter-active,
// 	.v-leave-active {
// 		transition: opacity 2s ease;
// 	}

// 	.v-enter-from,
// 	.v-leave-to {
// 		opacity: 0;
// 	}
// </style>


// 核心实现，绑定
import { isKeepAlive } from './KeepAlive';
import { h } from '../render-runtime/core-diff';
function nextFrame(cb: any) {
	requestAnimationFrame(() => {
		requestAnimationFrame(cb);
	});
}
function resolveTransitionProps(rawProps: any) {
	const {
		name = 'v',
		enterFromClass = `${name}-enter-from`,
		enterActiveClass = `${name}-enter-active`,
		enterToClass = `${name}-enter-to`,
		leaveFromClass = `${name}-leave-from`,
		leaveActiveClass = `${name}-leave-active`,
		leaveToClass = `${name}-leave-to`,
		onBeforeEnter, // 进入前
		onEnter, // 进入
		onLeave // 离开时
	} = rawProps;

	return {
		onBeforeEnter(el: any) {
			onBeforeEnter && onBeforeEnter(el);
			el.classList.add(enterFromClass); // 进入前添加的类名
			el.classList.add(enterActiveClass);
		},
		onEnter(el: any, done: any) {
			const resolve = () => {
				// 进入完毕后全部移除
				el.classList.remove(enterActiveClass);
				el.classList.remove(enterToClass);
				done && done();
			};
			onEnter && onEnter(el, resolve);
			nextFrame(() => {
				el.classList.remove(enterFromClass);
				el.classList.add(enterToClass); // 进入后添加类名
				// 绑定transition组件

				// 用户没传递onEnter 或者onEnter参数只有一个
				if (!onEnter || onEnter.length <= 1) {
					// 监听transitionend事件
					el.addEventListener('transitionend', resolve);
				}
			});
		},
		onLeave(el: any, done: any) {
			const resolve = () => {
				// 进入完毕后全部移除
				el.classList.remove(leaveActiveClass);
				el.classList.remove(leaveToClass);
				done && done();
			};
			el.classList.add(leaveFromClass); // 离开
			document.body.offsetHeight; // 让leaveFromClass 立即影响变化
			el.classList.add(leaveActiveClass);
			nextFrame(() => {
				el.classList.remove(leaveFromClass);
				el.classList.add(leaveToClass); // 离开

				if (!onLeave || onLeave.length <= 1) {
					// 监听transitionend事件
					el.addEventListener('transitionend', resolve);
				}
			});
			onLeave && onLeave(el, resolve); // 调用leave
		}
	};
}

// 挂载元素
// 同理在core_diff中寻找即可
// const mountElement = (vnode, container, anchor, parentComponent) => {
// 	const { type, props, children, shapeFlag, transition } = vnode;
// 	const el = (vnode.el = hostCreateElement(type));
// 	if (props) {
// 		for (let key in props) {
// 			hostPatchProp(el, key, null, props[key]);
// 		}
// 	}
// 	if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
// 		mountChildren(children, el);
// 	} else if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
// 		hostSetElementText(el, children);
// 	}
// 	// 插入前
// 	if (transition) {
// 		transition.beforeEnter(el);
// 	}
// 	// 插入
// 	hostInsert(el, container, anchor);
// 	// 插入后
// 	if (transition) {
// 		transition.enter(el);
// 	}
// };
