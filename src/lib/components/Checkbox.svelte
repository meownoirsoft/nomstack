<script>
    export let type;
    export let label;
    export let value;
    export let page;
    export let lblClass;
    export let selectedItems = [];

    let isChecked = false;
    $: isChecked = selectedItems?.includes(value);

    async function updateSelections(items) {
      let newData = { id: page, meals: items };
      const response = await fetch('/api/sels-upd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
    }

    function toggleCheckbox() {
        if (isChecked) {
            selectedItems = selectedItems.filter(item => item !== value);
        } else {
            selectedItems = [...selectedItems, value];
        }
        if(type === 'sels'){
            updateSelections(selectedItems);
        }
    }
</script>

<label class="chklbl">
    <span class={lblClass || ''}>{label}</span>
    <input type="checkbox" checked={isChecked} on:change={toggleCheckbox} />
    <span class="checkbox-override"></span>
</label>