<template>
  <div class="holder">
    <div class="flex justify-center align-middle">
      <p class="my-5 ml-5">{{ protocol.name }} - {{ action.name }}</p>
      <Edit @click="emitStartEdit"/>
    </div>
    <div class="line"></div>
    <div v-if="showFull">
      <div>long content</div>
      <div>long content</div>
      <div>long content</div>
      <div>long content</div>
      <div>long content</div>
      <div>long content</div>
      <Button size="small" @click="emitEndEdit">DONE</Button>
    </div>
    <div v-else>
      <div>short content</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Button from '@/components/Button.vue';
import { getProtocol, getAction } from '@/common/protocols';
import Edit from '@/components/icons/Edit.vue';

export default defineComponent({
  components: { Edit, Button },
  props: {
    brick: {
      type: Object,
      required: true,
    },
  },
  emits: ['start-edit', 'end-edit'],
  setup(props, context) {
    const showFull = ref(true);
    const protocol = getProtocol(props.brick.protocolId);
    const action = getAction(protocol.id, props.brick.actionId);

    const emitStartEdit = () => {
      showFull.value = true;
      context.emit('start-edit', {
        brickId: props.brick.id,
      });
    };

    const emitEndEdit = () => {
      showFull.value = false;
      context.emit('end-edit', {
        brickId: props.brick.id,
      });
    };

    return {
      showFull,
      protocol,
      action,
      emitStartEdit,
      emitEndEdit,
    };
  },
});
</script>

<style scoped>
.holder {
  width: 400px !important;
  @apply border border-solid border-white bg-black;
}

.line {
  @apply border-t border-solid border-white;
  height: 1px;
}
</style>
