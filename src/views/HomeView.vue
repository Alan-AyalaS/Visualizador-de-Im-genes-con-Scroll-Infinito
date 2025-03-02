<script setup>
import TheWelcome from '../components/TheWelcome.vue'
import Galery from '@/components/Galery.vue'
</script>

<template>
  <div class="title-container">
    <h1 class="main-title">Catálogo del Instituto de Arte de Chicago</h1>
  </div>
  <main>
    <section class="galery-container">
      <Galery />
    </section>
    <TheWelcome />
  </main>
</template>

<style scope>
.title-container {
  padding-top: 35px;
  padding-bottom: 35px;

  text-align: center;
  background-color: #000000e0;
  box-shadow:
    #0000001a 0px 20px 25px -5px,
    #0000000a 0px 10px 10px -5px;
}

h1 {
  font-size: 1.8rem;
  letter-spacing: 1px;

  color: #fff;
  font-family: 'Quicksand', sans-serif;
  padding: 0px 10px;
}

main {
  margin-top: 40px;
}
</style>
