<template>
  <div class="flex">
    <a href="#" class="switch flex-grow" :class="{'buy-active': buyActive}" @click="emitBuy">BUY</a>
    <a href="#" class="switch flex-grow" :class="{'sell-active': !buyActive}" @click="emitSell">SELL</a>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  emits: ['emit-change'],
  setup(props, ctx) {
    const buyActive = ref<boolean>(true);

    const emitBuy = () => {
      buyActive.value = true;
      ctx.emit('emit-change', 'buy');
    };

    const emitSell = () => {
      buyActive.value = false;
      ctx.emit('emit-change', 'sell');
    };

    return {
      buyActive,
      emitBuy,
      emitSell,
    };
  },
});
</script>

<style scoped>
.switch {
  @apply border border-gray-500 border-solid text-white text-center p-1;
}
.buy-active {
  @apply bg-db-cyan text-black;
}
.sell-active {
  @apply bg-db-purple text-white;
}
</style>
