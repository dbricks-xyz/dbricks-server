<template>
  <div class="holder">
    <div v-if="longContent">
      <div>long content</div>
      <div>long content</div>
      <div>long content</div>
      <div>long content</div>
      <div>long content</div>
      <div>long content</div>
    </div>
    <div v-else>
      <div>short content</div>
    </div>
    <Button size="small" @click="emitEditMe">EDIT</Button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Button from '@/components/Button.vue';

export default defineComponent({
  components: { Button },
  props: {
    brickId: Number,
    brickType: String,
  },
  emits: ['edit-me'],
  setup(props, context) {
    const longContent = ref(true);

    const emitEditMe = () => {
      longContent.value = !longContent.value;
      console.log(longContent.value);
      context.emit('edit-me', {
        brickId: props.brickId,
      });
    };

    return {
      emitEditMe,
      longContent,
    };
  },
});
</script>

<style scoped>
.holder {
  width: 400px;
  @apply bg-gray-100;
}

</style>
