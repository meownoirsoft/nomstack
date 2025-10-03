<script>
    import { notifyError } from '$lib/stores/notifications.js';
    export let type;
    export let label;
    export let value;
    export let page;
    export let lblClass;
    export let selectedItems;

    let isChecked = false;
    let isUpdating = false;
    $: isChecked = selectedItems?.includes(value);

    async function updateSelections(items, previousItems) {
      if (isUpdating) {
        return;
      }

      isUpdating = true;
      const newData = {
        type: page,
        meals: Array.isArray(items)
          ? items.map((value) => (value == null ? '' : String(value).trim())).filter((value) => value.length > 0)
          : []
      };

      try {
        const response = await fetch('/api/sels-upd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newData)
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      } catch (error) {
        selectedItems = previousItems;
        notifyError('Unable to update selections. Please try again.');
      } finally {
        isUpdating = false;
      }
    }

    function toggleCheckbox() {
      if (isUpdating) {
        return;
      }

      const previousItems = selectedItems;
      const previousSet = Array.isArray(previousItems) ? [...previousItems] : [];

      if (isChecked) {
        selectedItems = previousSet.filter((item) => item !== value);
      } else {
        selectedItems = [...previousSet, value];
      }

      if (type === 'sels') {
        updateSelections(selectedItems, previousSet);
      }
    }
</script>

<label class="flex items-center gap-3 cursor-pointer select-none">
  <input
    type="checkbox"
    class="checkbox checkbox-sm checkbox-primary"
    checked={isChecked}
    on:change={toggleCheckbox}
    disabled={isUpdating}
  />
  <span class={`text-sm ${lblClass || ''}`}>{label}</span>
</label>
