<template>
  <header>
    <img
      src="../assets/imgs/Art_Institute_of_Chicago_Logo.png"
      alt="Art_Institute_of_Chicago_Logo"
    />
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

header img {
  width: 90px;
}

nav {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  align-items: center;
  font-size: 2rem;
}
</style>
