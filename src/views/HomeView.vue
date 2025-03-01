<script setup>
import TheWelcome from '../components/TheWelcome.vue'
import Galery from '@/components/Galery.vue'
</script>

<template>
  <main>
    <h1 class="main-title">Catálogo</h1>
    <section class="galery-container">
      <Galery />
    </section>
    <TheWelcome />
  </main>
</template>

<style scope>
.main-title {
  margin-top: 15px;
  margin-bottom: 15px;

  font-size: 2.5rem;
  font-weight: 500;
  letter-spacing: 1px;
  text-align: center;
}
</style>
