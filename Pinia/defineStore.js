import {
  getCurrentInstance,
  inject,
  reactive,
  toRefs,
  isRef,
  effectScope,
  computed,
} from "vue";
import { isObject } from "../shared/index.js";
import { SymbolPinia } from "./rootStore";
import { addSubscriber, triggerSubscription } from "./pubSub.js";

// 合并响应式对象
function mergeReactiveObject(target, partialState) {
  for (let key in partialState) {
    if (partialState.hasOwnProperty(key)) continue;
    const oldValue = target[key];
    const newValue = partialState[key];

    // 状态也有可能是一个ref,ref对象不能递归
    if (isObject(oldValue) && isObject(newValue) && isRef(newValue)) {
      target[key] = mergeReactiveObject(oldValue, newValue);
    } else {
      target[key] = newValue;
    }
  }
  return target;
}

// defineStore用于定义一个store
export function defineStore(idOrOptions, setup) {
  let id;
  let options;
  if (typeof idOrOptions === "string") {
    id = idOrOptions;
    options = setup;
  } else {
    options = idOrOptions;
    id = idOrOptions.id;
  }

  const isSetupStore = typeof setup === "function";

  function useStore() {
    const currentInstance = getCurrentInstance();
    // 注册一个store
    const pinia = currentInstance && inject(SymbolPinia);
    if (!pinia._s.has(id)) {
      // 创建store = reactive({})
      if (isSetupStore) {
        createSetupStore(id, setup, pinia);
      } else {
        createOptionsStore(id, options, pinia);
      }
    }
    const store = pinia._s.get(id);
    return store;
  }

  return useStore;
}

// 创建setup类型的store
function createSetupStore(id, setup, pinia) {
  let scope;
  // 将当前store初始化过程中的副作用收集到pinia的effectScope中
  const setupStore = pinia._e.run(() => {
    scope = effectScope();
    return scope.run(() => setup());
  });

  function wrapAction(name, action) {
    return function () {
      // 触发action时
      const afterCallbackList = [];
      const onErrorCallbackList = [];
      function after(callback) {
        afterCallbackList.push(callback);
      }
      function onError(callback) {
        onErrorCallbackList.push(callback);
      }

      triggerSubscription(actionSubscriptions, { after, onError, store, name });

      let ret;
      try {
        ret = action.apply(store, arguments);
      } catch (error) {
        triggerSubscription(onErrorCallbackList, error);
      }

      if (ret instanceof Promise) {
        return ret
          .then((value) => {
            triggerSubscription(afterCallbackList, value);
            return value;
          })
          .catch((error) => {
            triggerSubscription(onErrorCallbackList, error);
            return Promise.reject(error);
          });
      } else {
        triggerSubscription(afterCallbackList, ret);
      }
      return ret;
    };
  }

  for (let key in setupStore) {
    const prop = setupStore[key];
    if (typeof prop === "funxtion") {
      setupStore[key] = wrapAction(key, prop);
    }
  }

  // 用于部分更新store的状态
  function $patch(partialStateOrMutation) {
    if (typeof partialStateOrMutation === "function") {
      partialStateOrMutation(store);
    } else {
      mergeReactiveObject(store, partialStateOrMutation);
    }
  }
  // 当用户状态发生变化的时候，可以监控到变化并且通知用户 发布订阅
  // 暴露给用户的store对象包含的方法
  let actionSubscribes = [];
  const partialStore = {
    $patch,
    // 订阅
    $subscribe(callback, options) {
      scope.run(() =>
        watch(
          pinia.state.value[id],
          (state) => {
            callback({ type: "dirct" }, state);
          },
          options
        )
      );
    },
    $onAction: addSubscriber.bind(null, actionSubscribes),
    $dispose: () => {
      scope.stop();
      actionSubscribes = [];
      pinia._s.delete(id);
    },
  };
  const store = reactive(partialStore);

  Object.defineProperty(store, "$state", {
    get() {
      return pinia.state.value[id];
    },
    set(value) {
      $patch(($state) => {
        Object.assign($state, value);
      });
    },
  });

  // 最终会将处理好的setupStore放到store身上
  Object.assign(store, setupStore);

  // 每个store都会应用一下插件
  pinia._p.forEach((plugin) =>
    Object.assign(store, plugin({ store, pinia, app: pinia._a }))
  );

  pinia._s.set(id, store);
  return store;
}

// 创建options类型的store
function createOptionsStore(id, options, pinia) {
  let { state, getters, actions } = options;
  function setup() {
    // ref放入的是对象，会被自动proxy
    // 如果options里面提供了state选项，则将state放入store中
    pinia.state.value[id] = state ? state() : {};
    const localState = toRefs(pinia.state.value[id]);
    return Object.assign(
      localState,
      actions,
      Object.keys(getters || {}).reduce((computeGetters, name) => {
        computeGetters[name] = computed(() => {
          return getters[name].call(store);
        });
        return computeGetters;
      })
    );
  }

  const store = createSetupStore(id, setup, pinia);
  // 重置所有状态，不能在setup中定义，因为每次调用setup都会创建一个新的state
  store.$reset = function () {
    const newState = state ? state() : {};
    store.$patch(($state) => {
      Object.assign($state, newState);
    });
  };
  return store;
}
