<template>
  <footer class="site-footer">
    <div class="footer-content">
      <p>&copy; 2025 Galería de Arte Digital</p>
      <div class="footer-links">
        <a href="#">Acerca de</a>
        <a href="#">Contacto</a>
        <a href="#">Términos de uso</a>
      </div>
    </div>
  </footer>
</template>
<style>
.site-footer {
  width: 100%;
  padding: 20px 0;
  margin-top: auto;
  height: 70px;

  background-color: #000000e0;
  color: white;
}

.footer-content {
  max-width: 1200px;
  height: 100%;
  margin: 0 auto;

  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.footer-links a {
  color: white;
  margin-left: 20px;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #ccc;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-links {
    margin-top: 10px;
  }

  .footer-links a {
    margin: 0 10px;
  }
}
</style>
