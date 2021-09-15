<template>
  <button class="m-4 p-4 w-40 text-white text-xl text-center btn">
    <slot/>
  </button>
</template>

<script lang="ts">
import {defineComponent} from "vue";
export default defineComponent( {
  setup() {
    return {

    }
  }
})
</script>

<style scoped>
.btn {
  background-color: #3F00FF;
  font-family: 'superman', sans-serif;
}
</style>
