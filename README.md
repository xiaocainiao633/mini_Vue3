采用menerepo包管理模式，具体配置在另一个仓库:[monorepo](https://github.com/xiaocainiao633/the-basic-code-of-Vue3.git)
此项目是简单的vue实现，约3500行代码，大部分功能已实现，有详细注释
未实现部分：对style和script的代码处理，以及严格的类型控制，如：vnode,instance等，大部分都使用了基本类型，可以通过参数名推断类型
具体目录如下，不久之后会更新react源码，灵感来源于：[Vue3](https://cccdk.github.io/my-vue/),编译原理实现参考：[Compiler](https://vue-compiler.iamouyang.cn/)
```
Vue3.4
├── composition_render
│   ├── apiLifecycle.ts(生命周期hook)
│   ├── composition.ts(组件变换核心)
│   ├── index.ts(基础变量和方法)
│   ├── inject.ts(依赖注入)
│   ├── setup.ts(setup函数传递，包含对选项式的处理)
│   └── Text&&Fragment.ts(Text和Fragment组件的处理)
├── Compiler
│   ├── ast.ts(ast语法树的生成)
│   ├── code_exchange.ts(代码转换)
│   ├── code_generate.ts(代码生成)
│   ├── runtimeHelper.ts(存储标记)
│   ├── Template.ts(模板处理)
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
