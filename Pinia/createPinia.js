import { markRaw, ref, effectScope, provide } from "vue";
import { SymbolPinia } from "./rootStore";

export function createPinia() {
  const scope = effectScope(true);
  const _p = [];
  const state = scope.run(() => ref({}));
  const pinia = markRaw({
    install(app) {
      // pinia希望能被共享出去
      // 将pinia实例暴露到app上，所有的组件都可以通过inject注入
      pinia._a = app;
      app.provide(SymbolPinia, pinia);
      // Vue2支持的写法
      app.config.globalProperties.$pinia = pinia;
    },
    use(plugin) {
      _p.push(plugin);
      return this;
    },
    _a: null,
    state, // 所有的状态
    _e: scope, //用来管理应用的effectScope
    _s: new Map(), // 记录所有的store
  });
  return pinia;
}
