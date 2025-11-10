// defineAsyncComponent函数是一个高阶组件，他的返回值是一个包装组件。此包装组件会根据状态来决定渲染的内容，加载成功后渲染组件，在未渲染成功时渲染一个占位符节点

import { h } from '../render-runtime/core-diff'
import { ref } from '../Rectivity/ref'
import { Fragment } from '../composition_render/Text&&Fragment'

// 基本实现，定义一个异步组件，如何使用
// 包含成功逻辑、错误逻辑、加载逻辑、加载重试处理
let asyncComponent = defineAsyncComponent({
  // 传入的第一个参数是加载器函数
  loader: () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          render: () => h('div', 'Hello')
        })
      }, 1000)
    })
  },
  timeout: 2000,
  errorComponent: {
    render: () => h('Text', '超时错误')
  },
  delay: 1000,
  loadingComponent: {
    render: () => h('h2', 'loading....')
  },
  onError(retry: any) {
    console.log("错了")
    retry()
  }
})

// 导出工厂函数
export function defineAsyncComponent(options: any) {
  // 若传入的是函数，自动包装为对象
  if(typeof options === 'function') {
    options = { loader: options }
  }
  // 用于存储加载完成后的组件定义
  let Comp: any = null
  // 返回一个组件对象
  return {
    setup() {
      // 从配置中获取加载器函数
      const { loader } = options
      // 标记是否加载完成
      const loaded = ref(false)
      const error = ref(false) // 是否超时
      const loading = ref(false) // 是否显示加载组件
      let loadingTimer: any = null // 用于延迟显示加载状态的定时器，避免闪烁

      if(options.delay) {
        // 如果配置了延迟时间
        loadingTimer = setTimeout(() => {
          loading.value = true
        }, options.delay)
      } else {
        // 未配置：立即显示加载提示
        loading.value = true
      }

      // 执行加载器函数
      loader().then((c: any) => {
        // 组件定义赋值给Comp
        Comp = c
        loaded.value = true
      }).catch((err: any) => {
        if(options.onError) {
          return new Promise((resolve, reject) => {
            const retry = () => resolve(loader())
            const fail = () => reject(err)
            options.onError(retry, fail)
          })
        } else{
          throw err
        }
      })
      .finally(() => {
        // 无论成果还是失败都关闭加载提示
        loading.value = false
        clearTimeout(loadingTimer)
      })

      // 若配置了超时时间
      if(options.timeout) {
        setTimeout(() => {
          // 标记为错误状态
          error.value = true
        }, options.timeout)
      }
      // 空内容作为占位符
      const placeHolder = h(Fragment, '')
      // 返回一个渲染函数
      return () => {
        if(loaded.value) {
          // 加载成功
          return h(Comp)
        } else if(error.value && options.errorComponent) {
          // 加载失败返回错误组件
          return h(options.errorComponent)
        } else if(loading.value && options.loading.loadingComponent) {
          return h(options.loadingComponent)
        }
        // 加载中，返回占位符
        return placeHolder
      }
    }
  }
}