<template>
  <div class="z-50 p-10 modal">
    <div class="flex flex-auto justify-between">
      <CloseButton color="black"/>
      <h1>Add a brick</h1>
      <CloseButton class="cursor-pointer" color="white" @click="handleClick"/>
    </div>
    <slot/>
  </div>
  <div class="z-40 fixed inset-0 opacity-75 bg-black" @click="handleClick"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CloseButton from '@/components/CloseButton.vue';

export default defineComponent({
  components: { CloseButton },
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
</style>
