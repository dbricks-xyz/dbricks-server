<template>
  <a href="#">
    <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      width="50px" height="50px" viewBox="0 0 50 50" enable-background="new 0 0 50 50" xml:space="preserve">

    <g id="Layer_3">
      <line id="path2" fill="none" :stroke="color" stroke-width="3" stroke-miterlimit="10" x1="8.5" y1="41.5" x2="41.5" y2="8.5"/>
      <line id="path3" fill="none" :stroke="color" stroke-width="3" stroke-miterlimit="10" x1="41.5" y1="41.5" x2="8.5" y2="8.5"/>
    </g>
    </svg>
  </a>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    color: String,
  },
  setup() {
    return {};
  },
});
</script>

<style scoped>
svg {
  height: 24px;
  width: 24px;
  @apply m-5;
  transition: all .2s ease-in-out;
}

svg:hover {
  filter: drop-shadow(0px 0px 5px ghostwhite);
}

body {

}

#path {
  stroke-dasharray: 200;
  stroke-dashoffset: 400;

  animation: checker 2.8s linear;
  animation-fill-mode: forwards;
}

@keyframes checker {
  from {
    stroke-dashoffset: 320;
  }
  to {
    stroke-dashoffset: 400;
  }
}

#path2 {
  stroke-dasharray: 430;
  stroke-dashoffset: 800;

  animation: x 0.6s linear;
  animation-fill-mode: forwards;
}

#path3 {
  stroke-dasharray: 430;
  stroke-dashoffset: 800;

  animation: x 0.6s linear;
  animation-fill-mode: forwards;
  animation-delay: 0.3s;
}

@keyframes x {
  from {
    stroke-dasharray: 430;
  }
  to {
    stroke-dasharray: 400;
  }
}

</style>
