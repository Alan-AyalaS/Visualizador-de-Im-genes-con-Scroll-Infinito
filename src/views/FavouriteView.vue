<template>
  <div class="title-container">
    <h1 class="main-title">Mis imágenes favoritas</h1>
  </div>
  <main>
    <div v-if="cargando" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando tus favoritos...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="cargarObrasLikeadas" class="retry-button">Reintentar</button>
    </div>

    <div v-else-if="obrasLikeadas.length === 0" class="empty-state">
      <p>No tienes imágenes favoritas aún. Explora la galería y marca las que te gusten.</p>
    </div>

    <div v-else class="favorites-grid">
      <div
        v-for="obra in obrasLikeadas"
        :key="obra.id"
        class="obra-favorita"
        @click="abrirModal(obra)"
      >
        <div class="imagen-container">
          <img :src="getImageUrl(obra.image_id)" :alt="obra.title || 'Obra de arte'" />
          <button
            @click.stop="toggleLike(obra)"
            class="like-button liked"
            title="Eliminar de favoritos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          </button>
        </div>
        <div class="informacion">
          <h2 class="obra-titulo">{{ obra.title || 'Sin título' }}</h2>
          <p class="autor">{{ obra.artist_title || 'Autor desconocido' }}</p>
          <p class="año">{{ obra.date_display || 'Fecha desconocida' }}</p>
        </div>
      </div>
    </div>

    <!-- Modal para vista detallada -->
    <div v-if="modalAbierto" class="modal-overlay" @click="cerrarModal">
      <div class="modal-content" @click.stop>
        <button class="cerrar-modal" @click="cerrarModal">&times;</button>

        <div class="modal-imagen">
          <img
            :src="getImageUrl(obraSeleccionada.image_id)"
            :alt="obraSeleccionada.title || 'Obra de arte'"
          />
        </div>

        <div class="modal-info">
          <h2>{{ obraSeleccionada.title || 'Sin título' }}</h2>
          <p class="modal-autor">
            <strong>Artista:</strong> {{ obraSeleccionada.artist_title || 'Autor desconocido' }}
          </p>
          <p class="modal-año">
            <strong>Fecha:</strong> {{ obraSeleccionada.date_display || 'Fecha desconocida' }}
          </p>

          <div v-if="obraSeleccionada.medium_display" class="modal-detalles">
            <p><strong>Medio:</strong> {{ obraSeleccionada.medium_display }}</p>
          </div>

          <div v-if="obraSeleccionada.dimensions" class="modal-detalles">
            <p><strong>Dimensiones:</strong> {{ obraSeleccionada.dimensions }}</p>
          </div>

          <div v-if="obraSeleccionada.description" class="modal-descripcion">
            <h3>Descripción</h3>
            {{ obraSeleccionada.description }}
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { useObraLikesStore } from '../stores/obraLikes.js'
import axios from 'axios'

export default {
  name: 'FavoritosView',
  data() {
    return {
      obrasLikeadas: [],
      cargando: false,
      error: null,
      modalAbierto: false,
      obraSeleccionada: {},
    }
  },
  // Usamos el hook created para asegurarnos de tener acceso al store
  created() {
    // Asegurarnos de que el store esté inicializado
    this.likesStore = useObraLikesStore()
  },
  mounted() {
    this.cargarObrasLikeadas()
    // Añadir listener para cerrar el modal con la tecla ESC
    document.addEventListener('keydown', this.manejarTeclas)
  },
  beforeUnmount() {
    // Eliminar listener cuando el componente se desmonte
    document.removeEventListener('keydown', this.manejarTeclas)
  },
  methods: {
    async cargarObrasLikeadas() {
      this.cargando = true
      this.error = null

      try {
        if (!this.likesStore) {
          this.likesStore = useObraLikesStore()
        }

        // Obtener los IDs de obras likeadas del store
        const idsLikeados = this.likesStore.getLikedIds()

        if (idsLikeados.length === 0) {
          this.obrasLikeadas = []
          this.cargando = false
          return
        }

        // Para cada ID, obtener los detalles completos de la obra
        const obrasPromesas = idsLikeados.map(async (id) => {
          // Si ya tenemos la obra completa en el store, usarla
          const obraGuardada = this.likesStore.getLikedObra(id)
          if (obraGuardada && Object.keys(obraGuardada).length > 1) {
            return obraGuardada
          }

          // Si solo tenemos el ID, hacer una petición a la API
          try {
            const response = await axios.get(`https://api.artic.edu/api/v1/artworks/${id}`)
            return response.data.data
          } catch (error) {
            console.error(`Error al cargar la obra ${id}:`, error)
            // Devolver un objeto mínimo si falla la petición
            return { id: id, title: 'Error al cargar', image_id: null }
          }
        })

        this.obrasLikeadas = await Promise.all(obrasPromesas)
      } catch (error) {
        console.error('Error al cargar obras likeadas:', error)
        this.error = 'No se pudieron cargar tus imágenes favoritas'
      } finally {
        this.cargando = false
      }
    },
    getImageUrl(imageId) {
      return imageId ? `https://www.artic.edu/iiif/2/${imageId}/full/843,/0/default.jpg` : ''
    },
    toggleLike(obra) {
      if (this.likesStore) {
        this.likesStore.toggleLike(obra)
        // Actualizar la lista después de quitar un like
        this.obrasLikeadas = this.obrasLikeadas.filter((o) => this.likesStore.isLiked(o.id))
      }
    },
    abrirModal(obra) {
      this.obraSeleccionada = obra
      this.modalAbierto = true
      // Prevenir scroll en el fondo cuando el modal está abierto
      document.body.style.overflow = 'hidden'
    },
    cerrarModal() {
      this.modalAbierto = false
      // Restaurar scroll
      document.body.style.overflow = 'auto'
    },
    manejarTeclas(e) {
      if (e.key === 'Escape' && this.modalAbierto) {
        this.cerrarModal()
      }
    },
  },
}
</script>

<style scoped>
.title-container {
  padding-top: 35px;
  padding-bottom: 35px;
  text-align: center;
  background-color: #000000e0;
  box-shadow:
    rgba(0, 0, 0, 0.1) 0px 20px 25px -5px,
    rgba(0, 0, 0, 0.04) 0px 10px 10px -5px;
}

h1 {
  font-size: 3rem;
  letter-spacing: 1px;
  color: #fff;
  font-family: 'Quicksand', sans-serif;
  padding: 0px 10px;
}

main {
  color: black;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.empty-state,
.loading-state,
.error-state {
  text-align: center;
  padding: 50px 20px;
  font-size: 1.2rem;
  color: #666;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #333;
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  color: #d32f2f;
}

.retry-button {
  margin: 10px 0;
  padding: 8px 16px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
  padding: 20px 0;
}

.obra-favorita {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  cursor: pointer;
}

.obra-favorita:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.imagen-container {
  width: 100%;
  height: 250px;
  position: relative;
  overflow: hidden;
}

.imagen-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.obra-favorita:hover img {
  transform: scale(1.05);
}

.informacion {
  padding: 15px;
  background-color: #fff;
}

.obra-titulo {
  font-size: 1.2rem;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.autor,
.año {
  margin: 5px 0;
  font-size: 0.9rem;
  color: #555;
}

.like-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 15;
  transition: all 0.2s ease;
}

.like-button.liked {
  color: #ff3b5c;
}

.like-button:hover {
  transform: scale(1.1);
  background-color: white;
}

/* Estilos del modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.modal-content {
  position: relative;
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
}

.modal-content::-webkit-scrollbar {
  display: none;
}

.cerrar-modal {
  position: absolute;
  top: 15px;
  right: 17px;
  background: rgba(0, 0, 0, 0.637);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 25px;
  font-size: 24px;
  cursor: pointer;
  z-index: 20;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cerrar-modal:hover {
  background: rgba(0, 0, 0, 0.7);
}

.modal-imagen {
  margin-top: 30px;
  margin-bottom: 30px;
  width: 100%;
  text-align: center;
  padding: 15px 15px 0 15px;
}

.modal-imagen img {
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  max-height: 50vh;
  display: block;
  margin: 0 auto;
}

.modal-info {
  padding: 60px 30px 30px 30px;
}

.modal-info h2 {
  font-size: 1.8rem;
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.modal-autor,
.modal-año {
  margin: 10px 0;
  font-size: 1.1rem;
  color: #555;
}

.modal-detalles {
  margin: 15px 0;
}

.modal-descripcion {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.modal-descripcion h3 {
  font-size: 1.3rem;
  margin-bottom: 10px;
  color: #333;
}

/* Estilos responsivos */
@media (min-width: 768px) {
  .modal-content {
    flex-direction: row;
    max-height: 85vh;
  }

  .modal-imagen {
    flex: 1;
    max-height: 85vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px;
  }

  .modal-imagen img {
    max-height: 85vh;
    max-width: 100%;
  }

  .modal-info {
    flex: 1;
    overflow-y: auto;
    max-height: 85vh;
  }
}

@media (max-width: 768px) {
  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
  }

  h1 {
    font-size: 2.2rem;
  }

  .imagen-container {
    height: 200px;
  }

  .modal-content {
    width: 95%;
    height: auto;
    max-height: 95vh;
  }

  .modal-imagen {
    height: auto;
    max-height: 40vh;
    overflow: visible;
  }

  .modal-imagen img {
    max-height: 40vh;
  }

  .modal-info {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .favorites-grid {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 1.8rem;
  }

  .modal-imagen {
    padding: 10px 10px 0 10px;
  }

  .modal-info {
    padding: 15px;
  }

  .modal-info h2 {
    font-size: 1.5rem;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
    max-height: 90vh;
  }
}
</style>
