<template>
  <div class="carousel-wrapper">
    <!-- Botones de navegación en la parte superior -->
    <div class="navigation-arrows">
      <button
        @click="navegarA(obraActiva - 1)"
        class="arrow-btn prev-btn"
        :disabled="obraActiva === 0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
      <button
        @click="navegarA(obraActiva + 1)"
        class="arrow-btn next-btn"
        :disabled="obraActiva >= obrasConImagen.length - 1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
      </button>
    </div>

    <div
      class="carousel-container"
      ref="contenedor"
      @mousedown="empezarArrastre"
      @mouseup="terminarArrastre"
      @mouseleave="terminarArrastre"
      @mousemove="arrastrar"
    >
      <div class="galeria" ref="galeria">
        <!-- renderiza las obras que tienen imagen -->
        <div
          v-for="(obra, index) in obrasConImagen"
          :key="obra.id"
          class="obra"
          :class="{ 'obra-activa': index === obraActiva }"
          ref="obraElements"
        >
          <div class="imagen-container">
            <img :src="getImageUrl(obra.image_id)" alt="Obra de arte" />
            <div v-if="cargando && index === obraActiva" class="loading-overlay">
              <div class="spinner"></div>
            </div>
            <button
              @click.stop="toggleLike(obra)"
              class="like-button"
              :class="{ liked: likesStore.isLiked(obra.id) }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            </button>
          </div>
          <!-- Información debajo de la imagen -->
          <div class="informacion">
            <p class="autor">{{ obra.artist_title || 'Autor desconocido' }}</p>
            <p class="año">{{ obra.date_display || 'Fecha desconocida' }}</p>
          </div>
        </div>
      </div>

      <!-- Mensaje simple de error de timeout -->
      <div v-if="timeoutError" class="timeout-error">
        <p>Tiempo de espera excedido</p>
        <button @click="reintentar" class="retry-button">Reintentar</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { useObraLikesStore } from '../stores/obraLikes.js'

export default {
  data() {
    return {
      obras: [],
      obrasConImagen: [],
      pagina: 1,
      cargando: false,
      arrastrando: false,
      inicioX: 0,
      scrollIzq: 0,
      obraActiva: 0,
      carouselItems: [],
      itemWidth: 0,
      scrolling: false,
      snapTimeout: null,
      finCargado: false,
      timeoutError: false,
      timeoutId: null,
    }
  },
  computed: {
    likesStore() {
      return useObraLikesStore()
    },
  },
  mounted() {
    this.obtenerObras()
    this.agregarScrollListener()
    window.addEventListener('resize', this.calcularDimensiones)
    window.addEventListener('keydown', this.manejarTeclas)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.calcularDimensiones)
    window.removeEventListener('keydown', this.manejarTeclas)
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
  },
  methods: {
    async obtenerObras() {
      if (this.cargando || this.finCargado) return
      this.cargando = true
      this.timeoutError = false

      // Configurar timeout
      this.timeoutId = setTimeout(() => {
        this.timeoutError = true
        this.cargando = false
      }, 10000) // 10 segundos de timeout

      try {
        const response = await axios.get(
          `https://api.artic.edu/api/v1/artworks?page=${this.pagina}&limit=10`,
        )

        // Limpiar el timeout si la petición fue exitosa
        clearTimeout(this.timeoutId)

        const nuevasObras = response.data.data

        if (nuevasObras.length === 0) {
          this.finCargado = true
        } else {
          // Filtrar las nuevas obras que tienen imagen
          const nuevasObrasConImagen = nuevasObras.filter((obra) => obra.image_id)

          // Agregar solo las obras con imagen
          this.obrasConImagen = [...this.obrasConImagen, ...nuevasObrasConImagen]
          this.obras = [...this.obras, ...nuevasObras]
          this.pagina++

          // Verificar si hay suficientes obras con imagen
          if (this.obrasConImagen.length < 10 && !this.finCargado) {
            this.obtenerObras()
          }
        }

        this.$nextTick(() => {
          this.calcularDimensiones()
        })
      } catch (error) {
        clearTimeout(this.timeoutId)
        console.error('Error al obtener obras', error)
        this.timeoutError = true

        if (error.response && error.response.status === 404) {
          this.finCargado = true
        }
      } finally {
        this.cargando = false
      }
    },
    reintentar() {
      this.timeoutError = false
      this.obtenerObras()
    },
    getImageUrl(imageId) {
      return imageId ? `https://www.artic.edu/iiif/2/${imageId}/full/843,/0/default.jpg` : ''
    },
    agregarScrollListener() {
      const contenedor = this.$refs.contenedor
      contenedor.addEventListener('scroll', () => {
        // Verificar si estamos cerca del final y cargar más elementos
        const isNearEnd =
          contenedor.scrollLeft + contenedor.clientWidth >= contenedor.scrollWidth - 200

        if (isNearEnd && !this.cargando && !this.finCargado && !this.timeoutError) {
          this.obtenerObras()
        }

        // Actualizar el elemento activo basado en scroll
        this.actualizarElementoActivo()

        // Configurar snap al finalizar el scroll
        if (this.snapTimeout) {
          clearTimeout(this.snapTimeout)
        }
        this.scrolling = true
        this.snapTimeout = setTimeout(() => {
          this.scrolling = false
          this.snapAlCentro()
        }, 150)
      })
    },
    calcularDimensiones() {
      if (!this.$refs.obraElements || !this.$refs.obraElements.length) return

      this.carouselItems = this.$refs.obraElements
      const containerWidth = this.$refs.contenedor.clientWidth
      this.itemWidth = this.carouselItems[0].offsetWidth

      // Añadir margen a los elementos para asegurar espaciado adecuado
      const marginHorizontal = (containerWidth - this.itemWidth) / 2
      this.$refs.galeria.style.paddingLeft = `${marginHorizontal}px`
      this.$refs.galeria.style.paddingRight = `${marginHorizontal}px`

      // Centrar el primer elemento si estamos al inicio
      if (this.$refs.contenedor.scrollLeft === 0 && this.obraActiva === 0) {
        this.centrarElemento(0)
      }
    },
    actualizarElementoActivo() {
      if (!this.carouselItems.length) return

      const containerCenter =
        this.$refs.contenedor.scrollLeft + this.$refs.contenedor.clientWidth / 2
      let closestIndex = 0
      let closestDistance = Infinity

      this.carouselItems.forEach((item, index) => {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2
        const distance = Math.abs(containerCenter - itemCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      // Solo actualizar si el índice ha cambiado
      if (this.obraActiva !== closestIndex) {
        this.obraActiva = closestIndex
      }
    },
    centrarElemento(index) {
      if (!this.carouselItems.length || index >= this.carouselItems.length) return

      const item = this.carouselItems[index]
      const container = this.$refs.contenedor
      const itemCenter = item.offsetLeft + item.offsetWidth / 2
      const containerCenter = container.clientWidth / 2

      // Usar scrollTo con behavior: 'smooth' para una transición suave
      container.scrollTo({
        left: itemCenter - containerCenter,
        behavior: 'smooth',
      })
    },
    snapAlCentro() {
      if (this.scrolling) return
      this.centrarElemento(this.obraActiva)
    },
    empezarArrastre(event) {
      this.arrastrando = true
      this.inicioX = event.pageX - this.$refs.contenedor.offsetLeft
      this.scrollIzq = this.$refs.contenedor.scrollLeft
      this.$refs.contenedor.style.cursor = 'grabbing'
      event.preventDefault()
    },
    terminarArrastre() {
      this.arrastrando = false
      this.$refs.contenedor.style.cursor = 'grab'
      this.snapAlCentro()
    },
    arrastrar(event) {
      if (!this.arrastrando) return
      event.preventDefault()
      const x = event.pageX - this.$refs.contenedor.offsetLeft
      const desplazamiento = (x - this.inicioX) * 2
      this.$refs.contenedor.scrollLeft = this.scrollIzq - desplazamiento
    },
    toggleLike(obra) {
      this.likesStore.toggleLike(obra)
    },
    // Método para navegar a la obra con el índice dado
    navegarA(index) {
      if (index < 0 || index >= this.obrasConImagen.length) return
      this.obraActiva = index
      this.centrarElemento(index)

      // Si estamos cerca del final, cargar más obras
      if (index >= this.obrasConImagen.length - 3 && !this.cargando && !this.finCargado) {
        this.obtenerObras()
      }
    },
    // Manejo de navegación con teclado (flechas izquierda/derecha)
    manejarTeclas(event) {
      if (event.key === 'ArrowLeft') {
        this.navegarA(this.obraActiva - 1)
      } else if (event.key === 'ArrowRight') {
        this.navegarA(this.obraActiva + 1)
      }
    },
  },
}
</script>

<style scoped>
/* Contenedor principal que envuelve todo el carrusel */
.carousel-wrapper {
  position: relative;
  width: 100%;
}

/* Estilos para las flechas de navegación en la parte superior */
.navigation-arrows {
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 20px;
}

@media (min-width: 500px) {
  .navigation-arrows {
    justify-content: end;
    margin-right: 80px;
  }
}

.arrow-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #1f1f1f;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.arrow-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.carousel-container {
  width: 100%;
  overflow-x: auto;
  position: relative;
  padding: 40px 0;
  display: flex;
  cursor: grab;
  user-select: none;
  scroll-behavior: smooth;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
}

.carousel-container::-webkit-scrollbar {
  display: none;
}

.galeria {
  display: flex;
  gap: 30px;
}

.obra {
  flex: 0 0 auto;
  width: 250px;
  height: 350px;
  position: relative;
  transition: all 0.3s ease;
  transform: scale(0.85);
  opacity: 0.7;
  filter: blur(1px);
  scroll-snap-align: center;
}

.obra-activa {
  transform: scale(1.1);
  opacity: 1;
  filter: blur(0);
  z-index: 10;
}

.informacion {
  position: relative;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 5px;
  border-radius: 3px;
  z-index: 10;
  margin-top: 10px;
  transition: all 0.3s ease;
}

.obra-activa .informacion {
  background-color: rgba(0, 0, 0, 0.877);
}

.autor,
.año {
  margin: 0;
  font-size: 14px;
}

/* Estilo de contenedor de la imagen */
.imagen-container {
  width: 100%;
  height: 70%;
  background-color: #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.obra-activa .imagen-container {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  border-radius: 5px;
  user-select: none;
  transition: all 0.3s ease;
}

/* Estilos para el indicador de carga */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
  border-radius: 5px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Estilos del mensaje de error de timeout */
.timeout-error {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ff0019ea;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 1000;
  text-align: center;
  box-shadow: 0 1px 20cqb rgba(0, 0, 0, 0.349);
}

.timeout-error p {
  font-size: 1.8rem;
  font-weight: 600;
}

.retry-button {
  margin: 5px 0px;
  margin-left: 10px;
  padding: 7px 12px;
  font-weight: bold;
  background-color: white;
  color: #dc3545;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

/* Estilos para el botón de like */
.like-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.7);
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 15;
  transition: all 0.2s ease;
  color: #888;
}

.like-button:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

.like-button.liked {
  color: #ff3b5c;
  background-color: rgba(255, 255, 255, 0.9);
}

.obra-activa .like-button {
  opacity: 1;
}
</style>
