<template>
  <div class="p-10 modal z500">
    <div class="flex flex-auto justify-between">
      <Close color="black"/>
      <h1>Add a brick</h1>
      <Close class="cursor-pointer" color="white" @click="handleClick"/>
    </div>
    <slot/>
  </div>
  <div class="fixed inset-0 opacity-75 bg-black z400" @click="handleClick"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Close from '@/common/components/icons/Close.vue';

export default defineComponent({
  components: { Close },
  emits: ['cancel-modal'],
  props: {
    title: String,
  },
  setup(props, ctx) {
    const handleClick = () => {
      ctx.emit('cancel-modal');
    };
    return {
      handleClick,
    };
  },
});
</script>

<style scoped>
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 700px;
  background-color: black;
  filter: drop-shadow(0px 0px 20px ghostwhite);
  overflow: auto;
  max-height: calc(100vh - 150px);
}
.z500 {
  z-index: 500;
}
.z400 {
  z-index: 400;
}
</style>
