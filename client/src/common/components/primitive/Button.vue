<template>
  <button
    class="text-center btn"
    :class="size"
  >
    <slot/>
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    size: String,
  },
  setup() {
    return {};
  },
});
</script>

<style scoped>
.btn {
  background-color: theme('colors.db.cyan');
  font-family: 'superman', sans-serif;
  outline: none;
  color: black !important;
}

.btn:hover {
  transition: 0.5s;
  box-shadow: 0 0 20px theme('colors.db.pink');
}

.large {
  height: 60px;
  padding: 10px 45px;
  font-size: 30px;
}

.med {
  height: 45px;
  padding: 6px 30px;
  font-size: 25px;
}

.small {
  height: 35px;
  padding: 4px 20px;
  font-size: 20px;
}
</style>
