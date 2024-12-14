<script>
    import PrintView from '../../lib/components/PrintView.svelte';
    export let data;
    const {meals, lunchSels, dinnerSels} = data;
</script>
  
<PrintView {meals} {lunchSels} {dinnerSels} />