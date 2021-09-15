<template>
  <div class="text-center mt-10">
    <h1>dbricks.xyz</h1>
  </div>
  <!--<div id="nav">-->
  <!--  <router-link to="/">Home</router-link> |-->
  <!--</div>-->
  <router-view/>
</template>

<style>
@font-face {
  font-family: "superman";
  src: local("superman"), url('assets/superman.otf') format("truetype");
}

@font-face {
  font-family: "roboto";
  src: local("roboto"), url('assets/roboto.ttf') format("truetype");
}

body {
  height: 100vh;
  background-color: theme('colors.db.gray');
}

h1 {
  @apply text-4xl text-white text-center m-5 !important;
  font-family: 'superman', sans-serif;
}

h2 {
  @apply text-3xl text-white text-center m-5;
  font-family: 'superman', sans-serif;
}

h3 {
  @apply text-2xl text-white text-center m-5;
  font-family: 'superman', sans-serif;
}

p {
  @apply m-3 text-white;
  font-family: 'roboto', monospace;
}

a {
  @apply m-3 text-db-pink;
}

</style>
