<template>
  <div class="text-center mt-10">
    <h1 class="text-4xl font text-white">dbricks.xyz</h1>
  </div>
  <!--<div id="nav">-->
  <!--  <router-link to="/">Home</router-link> |-->
  <!--</div>-->
  <router-view/>
</template>

<style>
body {
  height: 100vh;
  background-color: theme('colors.db.gray');
}
@font-face {
  font-family: "superman";
  src: local("superman"), url('assets/superman.otf') format("truetype");
}
.font {
  font-family: 'superman', sans-serif;
  /*transform: rotate(-3deg);*/
}
@font-face {
  font-family: "glory";
  src: local("glory"), url('assets/glory.ttf') format("truetype");
}
</style>
