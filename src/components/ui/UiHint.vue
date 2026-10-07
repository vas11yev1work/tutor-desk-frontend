<template>
  <div class="flex items-start gap-2.5 rounded-[14px] bg-chip px-3.5 py-3 text-[13.5px] leading-[1.45] text-label">
    <span class="mt-px flex flex-none" aria-hidden="true"><slot name="icon" /></span>
    <span><slot /></span>
  </div>
</template>
