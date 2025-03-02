import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { initializeObraLikes } from './stores/obraLikes'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

initializeObraLikes()

app.mount('#app')
