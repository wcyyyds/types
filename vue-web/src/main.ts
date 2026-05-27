import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'
import permission from './directives/permission'

// 全局样式
import './styles/reset.scss'
import './styles/theme.scss'
import './styles/tailwind.css'
import './styles/management-list.scss'

const app = createApp(App)

app.directive('permission', permission)
app.use(ElementPlus, { locale: zhCn })
app.use(createPinia())
app.use(router)

app.mount('#app')
