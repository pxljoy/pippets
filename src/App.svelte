<script>
	import bus from './lib/bus';
	let store = {};

	bus.on('receive-store', (event, message) => {
		store = message;
	});

	const open = (e, file) => {
		e.preventDefault();
		bus.send('drag-file', file);
	}
</script>

<style global lang="scss" src="./theme/index.scss"></style>

<div class="pa-4">
<p style="font-size: 10px; opacity: 0.7;" class="mb-4">Drag files into the icon to add and right click the icon to clear.</p>
	{#each (store.files || []) as file}
	<button style="width: 100%;" draggable="true" on:dragstart={(e) => open(e, file)}>{file.split('/').slice(-1)}</button>
	{/each}
</div>
