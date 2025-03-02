<template>
  <div class="carousel-wrapper">
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
        <div
          v-for="(obra, index) in obrasConImagen"
          :key="obra.id"
          class="obra"
          :class="{ 'obra-activa': index === obraActiva }"
          ref="obraElements"
        >
          <div class="imagen-container">
            <img
              v-if="debeCargarImagen(index)"
              :src="getImageUrl(obra.image_id)"
              :data-src="getImageUrl(obra.image_id)"
              alt="Obra de arte"
              loading="lazy"
              @load="imagenCargada(index)"
            />
            <div v-else class="imagen-placeholder"></div>
            <div
              v-if="imagenesEnCarga[index] || (cargando && index === obraActiva)"
              class="loading-overlay"
            >
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
          <div class="informacion">
            <p class="autor">{{ obra.artist_title || 'Autor desconocido' }}</p>
            <p class="año">{{ obra.date_display || 'Fecha desconocida' }}</p>
          </div>
        </div>
      </div>
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
      obras: [], // Todas las obras
      obrasConImagen: [], // Solo obras con imagen disponible
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
      imagenesEnCarga: {}, // Control de lazy loading
      imagenesCargadas: {},
      margenDeCarga: 2, // Imágenes a precargar antes/después de la actual
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

      // Timeout de seguridad por si la API tarda demasiado
      this.timeoutId = setTimeout(() => {
        this.timeoutError = true
        this.cargando = false
      }, 10000)

      try {
        const response = await axios.get(
          `https://api.artic.edu/api/v1/artworks?page=${this.pagina}&limit=10`,
        )
        clearTimeout(this.timeoutId)
        const nuevasObras = response.data.data

        if (nuevasObras.length === 0) {
          this.finCargado = true
        } else {
          // Filtramos solo las que tienen imagen
          const nuevasObrasConImagen = nuevasObras.filter((obra) => obra.image_id)

          this.obrasConImagen = [...this.obrasConImagen, ...nuevasObrasConImagen]
          this.obras = [...this.obras, ...nuevasObras]
          this.pagina++

          // Si no tenemos suficientes obras, seguimos cargando
          if (this.obrasConImagen.length < 10 && !this.finCargado) {
            this.obtenerObras()
          }
        }

        this.$nextTick(() => {
          this.calcularDimensiones()
          this.verificarImagenesParaCargar()
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
        // Detecta cuando estamos cerca del final para cargar más
        const isNearEnd =
          contenedor.scrollLeft + contenedor.clientWidth >= contenedor.scrollWidth - 200
        if (isNearEnd && !this.cargando && !this.finCargado && !this.timeoutError) {
          this.obtenerObras()
        }

        this.actualizarElementoActivo()

        // Configuramos snap al centro con debounce
        if (this.snapTimeout) {
          clearTimeout(this.snapTimeout)
        }
        this.scrolling = true
        this.snapTimeout = setTimeout(() => {
          this.scrolling = false
          this.snapAlCentro()
        }, 150)

        this.verificarImagenesParaCargar()
      })
    },

    // Sistema de carga perezosa para las imágenes
    debeCargarImagen(index) {
      // Si ya la cargamos, la mostramos
      if (this.imagenesCargadas[index]) {
        return true
      }

      // Solo cargamos las cercanas a la vista actual
      return (
        index >= this.obraActiva - this.margenDeCarga &&
        index <= this.obraActiva + this.margenDeCarga
      )
    },

    verificarImagenesParaCargar() {
      // Marcamos para cargar las imágenes que están en el margen de visibilidad
      for (
        let i = this.obraActiva - this.margenDeCarga;
        i <= this.obraActiva + this.margenDeCarga;
        i++
      ) {
        if (i >= 0 && i < this.obrasConImagen.length) {
          if (!this.imagenesCargadas[i] && !this.imagenesEnCarga[i]) {
            this.imagenesEnCarga[i] = true
          }
        }
      }
    },

    imagenCargada(index) {
      this.imagenesEnCarga[index] = false
      this.imagenesCargadas[index] = true
    },

    calcularDimensiones() {
      if (!this.$refs.obraElements || !this.$refs.obraElements.length) return

      this.carouselItems = this.$refs.obraElements
      const containerWidth = this.$refs.contenedor.clientWidth
      this.itemWidth = this.carouselItems[0].offsetWidth

      // Calculamos márgenes para centrar las obras
      const marginHorizontal = (containerWidth - this.itemWidth) / 2
      this.$refs.galeria.style.paddingLeft = `${marginHorizontal}px`
      this.$refs.galeria.style.paddingRight = `${marginHorizontal}px`

      // Centramos la primera obra al inicio
      if (this.$refs.contenedor.scrollLeft === 0 && this.obraActiva === 0) {
        this.centrarElemento(0)
        this.verificarImagenesParaCargar()
      }
    },

    // Determina qué obra es la más cercana al centro visual
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

      if (this.obraActiva !== closestIndex) {
        this.obraActiva = closestIndex
        this.verificarImagenesParaCargar()
      }
    },

    centrarElemento(index) {
      if (!this.carouselItems.length || index >= this.carouselItems.length) return

      const item = this.carouselItems[index]
      const container = this.$refs.contenedor
      const itemCenter = item.offsetLeft + item.offsetWidth / 2
      const containerCenter = container.clientWidth / 2

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
      const desplazamiento = (x - this.inicioX) * 2 // Multiplicador para ajustar sensibilidad
      this.$refs.contenedor.scrollLeft = this.scrollIzq - desplazamiento
    },

    toggleLike(obra) {
      this.likesStore.toggleLike(obra)
    },

    navegarA(index) {
      if (index < 0 || index >= this.obrasConImagen.length) return

      this.obraActiva = index
      this.centrarElemento(index)
      this.verificarImagenesParaCargar()

      // Carga anticipada si nos acercamos al final
      if (index >= this.obrasConImagen.length - 3 && !this.cargando && !this.finCargado) {
        this.obtenerObras()
      }
    },

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
.carousel-wrapper {
  position: relative;
  width: 100%;
}
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
.imagen-placeholder {
  width: 100%;
  height: 100%;
  background-color: #e6e6e6;
  border-radius: 5px;
}
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
