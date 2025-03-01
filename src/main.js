import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { initializeObraLikes } from './stores/obraLikes'

const app = createApp(App)

app.use(createPinia())
app.use(router)

initializeObraLikes()

app.mount('#app')
