<script>
    export let data;
    const {filteredMeals, sels} = data;
    import MealList from '../../lib/components/MealList.svelte';
    const page = 'dinner';
  </script>
  
  <MealList {filteredMeals} {page} {sels} />