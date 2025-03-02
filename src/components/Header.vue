<template>
  <header>
    <div class="nav-container">
      <a href="/"
        ><img
          src="../assets/imgs/Art_Institute_of_Chicago_Logo.png"
          alt="Art_Institute_of_Chicago_Logo"
      /></a>
      <nav>
        <RouterLink class="enlace" to="/">Home</RouterLink>
        <RouterLink class="enlace" to="/favourite">Favoritas</RouterLink>
        <!-- <RouterLink to="/about">About</RouterLink> -->
      </nav>
    </div>
  </header>
</template>

<script setup></script>

<style>
header {
  display: flex;
  align-items: end;
  background-color: rgba(255, 255, 255, 0.144);
  color: #2f2f2f;
}

header .nav-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  align-items: end;
  margin-bottom: 10px;
}

@media (max-width: 700px) {
  header .nav-container {
    padding: 0 20px;
  }
}

header img {
  margin-top: 10px;
  width: 70px;
}

@media (min-width: 768px) {
}

@media (min-width: 1440px) {
}

img a {
  border-bottom: none;
}

header img:hover {
  filter: invert(9%) sepia(96%) saturate(4780%) hue-rotate(337deg) brightness(91%) contrast(103%);
}

nav {
  display: flex;
  justify-content: end;
  width: 100%;
  align-items: center;
  font-size: 1.7rem;
  gap: 20px;
}

.enlace {
  margin-bottom: 10px;
  padding-bottom: 0;
  border-bottom: 1px solid #a1002b;
}
</style>
