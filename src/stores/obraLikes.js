// stores/obraLikes.js
import { defineStore } from 'pinia'

export const useObraLikesStore = defineStore('obraLikes', {
  state: () => ({
    // Guardamos las obras completas para no tener que hacer solicitudes adicionales
    likedObras: {},
  }),

  actions: {
    toggleLike(obra) {
      if (!obra || !obra.id) return

      if (this.isLiked(obra.id)) {
        // Eliminar el like
        const { [obra.id]: removed, ...rest } = this.likedObras
        this.likedObras = rest
      } else {
        // Agregar el like guardando toda la información de la obra
        this.likedObras = {
          ...this.likedObras,
          [obra.id]: obra,
        }
      }

      // Persistir en localStorage
      this.guardarEnLocalStorage()
    },

    isLiked(id) {
      return !!this.likedObras[id]
    },

    getLikedIds() {
      return Object.keys(this.likedObras)
    },

    getLikedObra(id) {
      return this.likedObras[id] || null
    },

    getLikedObras() {
      return Object.values(this.likedObras)
    },

    cargarDeLocalStorage() {
      try {
        const storedLikes = localStorage.getItem('obraLikes')
        if (storedLikes) {
          this.likedObras = JSON.parse(storedLikes)
        }
      } catch (error) {
        console.error('Error al cargar likes del localStorage:', error)
        // En caso de error, mantener el estado vacío
        this.likedObras = {}
      }
    },

    guardarEnLocalStorage() {
      try {
        localStorage.setItem('obraLikes', JSON.stringify(this.likedObras))
      } catch (error) {
        console.error('Error al guardar likes en localStorage:', error)
      }
    },
  },
})

// Función que inicializa el store después de que Pinia esté disponible
export function initializeObraLikes() {
  const store = useObraLikesStore()
  store.cargarDeLocalStorage()
  return store
}

// No inicializamos automáticamente aquí, lo haremos desde main.js
