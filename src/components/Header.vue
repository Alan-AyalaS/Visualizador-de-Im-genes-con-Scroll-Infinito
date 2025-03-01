<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/favourite">Favoritas</RouterLink>
      <!-- <RouterLink to="/about">About</RouterLink> -->
    </nav>
  </header>
</template>

<script setup></script>

<style>
header {
  display: flex;
  justify-content: center;
  padding: 10px 20px;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.144);
}

nav {
  display: flex;
  justify-content: center;
  width: 100%;
  align-items: center;
  gap: 35px;
  font-size: 20px;
}
</style>
