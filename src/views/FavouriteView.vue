<template>
  <div class="title-container">
    <h1 class="main-title">Mis imágenes favoritas</h1>
  </div>
  <main>
    <p>Aquí se mostrarán las imágenes que te gustaron.</p>
  </main>
</template>

<script>
export default {
  name: 'FavoritosView',
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
}
</style>
