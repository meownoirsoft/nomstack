<script>
    export let data;
    const {meals, sels} = data;
    import MealList from '../../lib/components/MealList.svelte';
    const page = 'lunch';
  </script>
  
  <MealList {meals} {page} {sels} />