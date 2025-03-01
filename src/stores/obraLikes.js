// stores/obraLikes.js
import { defineStore } from 'pinia'

export const useObraLikesStore = defineStore('obraLikes', {
  state: () => ({
    likedObras: [],
  }),

  actions: {
    toggleLike(obra) {
      const index = this.likedObras.findIndex((item) => item.id === obra.id)

      if (index === -1) {
        // Añadir a favoritos
        this.likedObras.push({
          id: obra.id,
          image_id: obra.image_id,
          artist_title: obra.artist_title,
          date_display: obra.date_display,
          title: obra.title,
        })
      } else {
        // Quitar de favoritos
        this.likedObras.splice(index, 1)
      }

      // Guardar en localStorage
      this.saveToLocalStorage()
    },

    isLiked(obraId) {
      return this.likedObras.some((obra) => obra.id === obraId)
    },

    saveToLocalStorage() {
      localStorage.setItem('likedObras', JSON.stringify(this.likedObras))
    },

    loadFromLocalStorage() {
      const saved = localStorage.getItem('likedObras')
      if (saved) {
        this.likedObras = JSON.parse(saved)
      }
    },
  },

  getters: {
    likedCount: (state) => state.likedObras.length,
  },
})

// Inicializar store - debe ser importado y llamado en el archivo principal de la app
export function initializeObraLikes() {
  const store = useObraLikesStore()
  store.loadFromLocalStorage()
  return store
}
