<script>
    export let meals;
    export let lunchSels;
    export let dinnerSels;

    let lunchMeals = meals.filter(meal => lunchSels.includes(meal.id));
    let dinnerMeals = meals.filter(meal => dinnerSels.includes(meal.id));
</script>
<div class="print-view">
    <button class="btn btn-sm mr-2" style="position: absolute; top: 10px; right: 80px;" on:click={() => window.location.href = '/'}>&laquo; Back</button>
    <button class="btn btn-sm mr-2" style="position: absolute; top: 10px; right: 10px;" on:click={() => window.print()}>Print</button>
    <h3 style="font-size: 1.5em; margin: 0">Mobile view may look weird, Printed one should be fine.</h3>
    <div class="container">
        <div class="list">
            <h2 style="font-size: 1.6em; font-weight: bold; color: #663399;">Lunch</h2>
            <ul>
                {#each lunchMeals as meal}
                    <li style="font-size: 1.4em;">{meal.name}</li>
                {/each}
            </ul>
        </div>
        <div class="list">
            <h2 style="font-size: 1.6em; font-weight: bold; color: #663399;">Dinner</h2>
            <ul>
                {#each dinnerMeals as meal}
                    <li style="font-size: 1.4em;">{meal.name}</li>
                {/each}
            </ul>
        </div>
    </div>
</div>
<style>
    /* Hide everything except the print view when printing */
    /* @svelte-ignore unused-selector */
    @media print {
      :global(body *:global) {
        visibility: hidden;
      }
  
      .print-view, .print-view * {
        visibility: visible;
      }

      .print-view h3{visibility: hidden;}
  
      .print-view {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
      }
  
      button {
        display: none; /* Hide buttons during printing */
      }
    }
  
    /* Mobile-friendly layout adjustments */
    .print-view {
      padding: 16px;
      font-size: 14px;
      line-height: 1.5;
    }
  
    .print-view ul {
      list-style: none;
      padding: 0;
    }
  
    .print-view li {
      margin: 4px 0;
    }

    .container {
        display: flex;
        justify-content: space-between; /* Space between the two lists */
        align-items: flex-start; /* Align items at the top */
    }

    .list {
        margin-top: 30px;
        width: 45%; /* Adjust widths as needed */
    }
  </style>