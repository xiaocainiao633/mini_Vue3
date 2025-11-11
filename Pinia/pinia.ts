import { defineStore } from 'pinia'

function ref(value: any) {
  return Object({
    get value() {
      return value
    },
    set value(v: any) {
      value = v
    }
  })
}

function computed(getter: () => any) {
  return {
    get value() {
      return getter()
    }
  }
}

export const useAlertStore = defineStore('alerts', {
  // 其他配置
})

// Setup Store
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const name = ref('Eduardo')
  const doubleCount = computed(() => {
    count.value *2
  })
  function increment() {
    count.value++
  }
  function $reset() {
    count.value = 0
  }

  return { count, name, doubleCount, increment, $reset }
})

// import { useCounterStore } from './pinia'
// const store = useCounterStore()
// const { name , doubleCount } = storeToRefs(store)
// action可以被
// 解构

interface State {
  userList: UserInfo[],
  user: UserInfo | null
}

const usesStore = defineStore('storeId', {
  state: (): State => {
    return {
      userList: [],
      user: null
    }
  },
})

interface UserInfo{
  name: string,
  age: number
}

// const store = useStore()
// store.count++
// store.$reset()将state重置为初始值
// 使用$patch变更state或者替换整个state
// store.$patch({ count: 10 })
// store.$patch((state) => {
//   state.count += 10
// })

// 订阅：
const store = usesStore()
store.$subscribe((mutation, state) => {
  mutation.type // 'direct' | 'patch object' | 'patch function'
  mutation.storeId // 'storeId'
  mutation.events // 传递给 $patch 的参数
  localStorage.setIten('store', JSON.stringify(state))
})

// 刷新时间：
{flush: 'sync'}

store.$subscribe(() => {}, { detached: true })