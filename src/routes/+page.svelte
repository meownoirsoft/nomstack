<script>
  export let data;
  const {meals, sels, cats, srcs} = data;
  import MealList from '../lib/components/MealList.svelte';
  const page = 'all';
</script>

<MealList {meals} {sels} {cats} {srcs} {page} />