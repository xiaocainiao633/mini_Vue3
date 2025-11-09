采用menerepo包管理模式，具体配置在另一个仓库，此仓库还未完成，已上传部分：
```
Vue3.4
├── composition_render
│   ├── apiLifecycle.ts(生命周期hook)
│   ├── composition.ts(组件变换核心)
│   ├── index.ts(基础变量和方法)
│   ├── inject.ts(依赖注入)
│   ├── setup.ts(setup函数传递，包含对选项式的处理)
│   └── Text&&Fragment.ts(Text和Fragment组件的处理)
├── Other
│   ├── AsyncComponent.ts(异步组件处理)
│   ├── KeepAlive.ts(KeepAlive实现)
│   ├── Teleport.ts(Teleport实现)
│   └── Transition.ts(Transition实现)
├── Reactivity
│   ├── baseHandlers.ts(Handler)
│   ├── computed.ts(计算属性)
│   ├── effect.ts(响应式核心)
│   ├── index.ts(全局变量)
│   ├── reactiveEffect.ts
│   ├── reactivity.ts(Reactive)
│   ├── ref.ts(ref对象、toRef、toRefs、proxyRefs、toReactive)
│   └── watch-effect.ts(事件监听)
└── render-runtime
    ├── core-diff.ts(虚拟节点创建、h、render、diff算法，组件渲染逻辑，依赖注入等整体控制)
    ├── nodeOps.ts(节点定义)
    └── patchProp.ts(对比属性)
```
<img width="1522" height="741" alt="image" src="https://github.com/user-attachments/assets/4f3983fe-1fa0-4dba-a186-f72f18da141c" />
