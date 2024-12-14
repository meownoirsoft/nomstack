<script>
    export let data;
    const {cats} = data;
    import CategoryList from '../../lib/components/CategoryList.svelte';
    const page = 'all';
  </script>
  
  <CategoryList {cats} {page} />