<template>
  <div
    class="box"
    :class="[{disabled:disabled}, {selected:selected}]"
    :style="style"
  >
    <div :class="{lowOpacity : disabled}">
      <slot/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  props: {
    disabled: Boolean,
    selected: Boolean,
    color: String,
  },
  setup(props) {
    const style = computed(():{'--color': string} => ({ '--color': props.color ? props.color : 'ghostwhite' }));

    return {
      style,
    };
  },
});
</script>

<style scoped>
.box {
  @apply p-2 m-2 flex-grow text-center
  border-solid border-2 border-white;
}

.box:hover {
  @apply cursor-pointer;
  filter: drop-shadow(0px 0px 20px var(--color));
}

.selected {
  box-shadow: inset 0px 0px 20px var(--color);
}

.disabled {
  box-shadow: inset 0px 0px 0px var(--color) !important;
}

.disabled:hover {
  @apply cursor-default;
  filter: drop-shadow(0px 0px 0px #000) !important;
}

.lowOpacity {
  opacity: 0.2;
}

</style>
