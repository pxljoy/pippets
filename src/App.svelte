<script>
	import bus from './lib/bus';
	let store = {};

	bus.on('receive-store', (event, message) => {
		store = message;
		console.log(store);
	});

	const open = (e, file) => {
		e.preventDefault();
		bus.send('drag-file', file);
	}
	const launch = (e, file) => {
		e.preventDefault();
		bus.send('open-file', file);
	}
	const renderableExts = {
		png: true,
		jpg: true,
		jpeg: true,
		bmp: true,
		svg: true,
	};
</script>

<style global lang="scss" src="./theme/index.scss"></style>

<div class="pa-4">
<p style="font-size: 10px; opacity: 0.7;" class="mb-4">Drag files into the icon to add and right click the icon to clear.</p>
	{#each (store.files || []) as file}
	<button
		class="mb-2"
		style="width: 100%; display: flex; justify-content: start; align-items: center;"
		draggable="true"
		on:dragstart={(e) => open(e, file.path)}
		on:click={(e) => launch(e, file.path)}
	>
		{#if file.directory}
			<img width="16" alt="image" src="../src/assets/folder.png">
		{:else if renderableExts[file.ext]}
			<img width="16" alt="image" src={file.path}>
		{:else if file.image}
			<img width="16" alt="image" src={file.image}>
		{/if}
		<span>
			&nbsp;
			{file.path.split('/').slice(-1)}
		</span>
	</button>
	{/each}
</div>
