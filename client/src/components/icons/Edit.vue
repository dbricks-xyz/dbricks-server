<template>
  <a href="#">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
    </svg>
  </a>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  setup() {
    return {};
  },
});
</script>

<style scoped>
svg {
  height: 24px;
  width: 24px;
  stroke: white;
  stroke-width: 1px;
  @apply m-5;
  transition: all .2s ease-in-out;
}

svg:hover {
  filter: drop-shadow(0px 0px 5px ghostwhite);
}
</style>
