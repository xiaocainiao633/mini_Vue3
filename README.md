采用menerepo包管理模式，具体配置在另一个仓库，已上传部分：

```
Vue3.4
├── Reactivity
│   ├── baseHandlers.ts(Handler)
│   ├── computed.ts(计算属性)
│   ├── effect.ts(响应式基础)
│   ├── index.ts(全局变量)
│   ├── reactiveEffect.ts
│   ├── reactivity.ts(Reactive)
│   ├── ref.ts(ref对象、toRef、toRefs、proxyRefs、toReactive)
│   └── watch-effect.ts(事件监听)
└── render-runtime
    ├── core-diff.ts(虚拟节点创建、h、render、diff算法)
    ├── nodeOps.ts(节点定义)
    └── patchProp.ts(对比属性)
```
<img width="1522" height="741" alt="image" src="https://github.com/user-attachments/assets/4f3983fe-1fa0-4dba-a186-f72f18da141c" />
