<template>
  <div
    class="carousel-container"
    ref="contenedor"
    @mousedown="empezarArrastre"
    @mouseup="terminarArrastre"
    @mouseleave="terminarArrastre"
    @mousemove="arrastrar"
  >
    <div class="galeria" ref="galeria">
      <!-- Solo renderizamos las obras que tienen imagen -->
      <div
        v-for="(obra, index) in obras.filter((obra) => obra.image_id)"
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
        </div>
        <!-- Información debajo de la imagen -->
        <div class="informacion">
          <p class="autor">{{ obra.artist_title || 'Autor desconocido' }}</p>
          <p class="anio">{{ obra.date_display || 'Fecha desconocida' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      obras: [],
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
    }
  },
  mounted() {
    this.obtenerObras()
    this.agregarScrollListener()
    window.addEventListener('resize', this.calcularDimensiones)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.calcularDimensiones)
  },
  methods: {
    async obtenerObras() {
      if (this.cargando || this.finCargado) return
      this.cargando = true

      try {
        const response = await axios.get(
          `https://api.artic.edu/api/v1/artworks?page=${this.pagina}&limit=10`,
        )
        const nuevasObras = response.data.data.filter((obra) => obra.image_id)

        if (nuevasObras.length === 0) {
          this.finCargado = true
        } else {
          this.obras = [...this.obras, ...nuevasObras]
          this.pagina++
        }

        // Esperar al siguiente ciclo para asegurar que los elementos DOM estén actualizados
        this.$nextTick(() => {
          this.calcularDimensiones()
        })
      } catch (error) {
        console.error('Error al obtener obras', error)
        if (error.response && error.response.status === 404) {
          this.finCargado = true
        }
      } finally {
        this.cargando = false
      }
    },
    getImageUrl(imageId) {
      return imageId ? `https://www.artic.edu/iiif/2/${imageId}/full/843,/0/default.jpg` : ''
    },
    agregarScrollListener() {
      const contenedor = this.$refs.contenedor
      contenedor.addEventListener('scroll', () => {
        // Verificar si estamos cerca del final y cargar más elementos si es necesario
        const isNearEnd =
          contenedor.scrollLeft + contenedor.clientWidth >= contenedor.scrollWidth - 200

        if (isNearEnd && !this.cargando && !this.finCargado) {
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
  },
}
</script>

<style scoped>
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
  background-color: rgba(0, 0, 0, 0.8);
}

.autor,
.anio {
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
</style>
