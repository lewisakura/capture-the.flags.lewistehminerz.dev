<script lang="ts">
	import 'carbon-components-svelte/css/g100.css';

	import { Content, Grid, Row, Column, Header, SkipToContent } from 'carbon-components-svelte';
</script>

<Header company="Discord Flags" platformName="Capture the Flag">
	<svelte:fragment slot="skip-to-content"><SkipToContent /></svelte:fragment>
</Header>

<Content style="background: none;">
	<Grid>
		<Row>
			<Column>
				<slot />
			</Column>
		</Row>
	</Grid>
</Content>
