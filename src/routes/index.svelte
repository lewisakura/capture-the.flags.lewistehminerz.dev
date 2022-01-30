<script lang="ts">
	import { goto } from '$app/navigation';

	import {
		Form,
		Checkbox,
		InlineNotification,
		Loading,
		FileUploaderButton,
		FileUploaderItem,
		FormGroup,
		Grid,
		Row,
		Column,
		Button,
		InlineLoading,
		MultiSelect,
		NumberInput,
		TextInput
	} from 'carbon-components-svelte';

	import { unzip } from 'unzipit';

	let userId: string;
	let flagNum: string = null;

	let selectedPlatforms: string[] = [];

	let state: 'waiting' | 'loading' | 'success' | 'error' = 'waiting';

	async function submit(e) {
		e.preventDefault();

		if (flagNum === null) return; // dont do anything if there isnt any flags!

		state = 'loading';

		const formData = new FormData(e.target);
		const data: any = {};

		for (const [key] of formData) {
			data[key] = true;
		}

		data.platformsUsed = selectedPlatforms;

		const result = await fetch('/submit', {
			method: 'POST',
			body: JSON.stringify({
				flags: flagNum,
				userId,
				form: data
			})
		});

		if (result.ok) {
			state = 'success';
		} else {
			state = 'error';
			setTimeout(() => (state = 'waiting'), 3000);
		}
	}

	async function load() {
		const userData = await fetch('/user');

		if (!userData.ok) {
			return goto(
				`https://discord.com/api/oauth2/authorize?client_id=936986233807200256&redirect_uri=${window.location.origin}/callback&response_type=code&scope=identify`
			);
		}

		const data = await userData.json();
		userId = data.id;

		return data;
	}

	let fileName: string = null;
	let invalidFile = false;
	let fileStatus: 'uploading' | 'complete' | 'edit' = 'uploading';

	function reset() {
		fileName = null;
		invalidFile = false;
		fileStatus = 'uploading';
		flagNum = null;
	}

	async function loadFlags(e) {
		reset();

		e.preventDefault();
		const pkg = this.files[0] as File;
		fileName = pkg.name;

		try {
			const unzipped = await unzip(pkg);
			const userJson = JSON.parse(
				await (await unzipped.entries['account/user.json'].blob()).text()
			);
			flagNum = userJson.flags.toString();
		} catch (e) {
			invalidFile = true;
			fileStatus = 'edit';
			return;
		}

		fileStatus = 'edit';
	}
</script>

{#await load()}
	<Loading />
{:then data}
	<Grid padding>
		<Row>
			<Column>
				<div class="container">
					<div class="avatar">
						<img src={data.avatar} alt={data.username} />
					</div>
					<div class="text">
						<h1>Hi, {data.username}!</h1>
						<h4>Here's a few questions for you. Thanks for helping to contribute to our CTF!</h4>
					</div>
				</div>
			</Column>
		</Row>
		<Row>
			<Column>
				<Form on:submit={submit}>
					<FormGroup legendText="Flags">
						<p>
							Submit your data package below to get your private flags. This will all be done in
							your browser.
						</p>
						<FileUploaderButton
							labelText="Load package"
							accept={['.zip']}
							disableLabelChanges
							on:change={loadFlags}
						/>
						{#if fileName}
							<FileUploaderItem
								name={fileName}
								status={fileStatus}
								invalid={invalidFile}
								errorSubject="Invalid package"
								errorBody="This doesn't appear to be a valid Discord data package."
								on:delete={reset}
							/>
						{/if}
						<InlineNotification
							lowContrast
							hideCloseButton
							kind="warning"
							title="Do not upload data packages randomly."
						>
							<svelte:fragment slot="subtitle">
								Your data package contains sensitive account information. Uploading a package
								without trusting the site involved is a very bad idea. Capture the Flag utilises
								your data package clientside (specifically, it reads <code>account/user.json</code>
								to retrieve the <code>flags</code> property) but other sites may send your data off somewhere
								else without your consent. Make sure that you have full trust in the site before you
								upload the package.
							</svelte:fragment>
						</InlineNotification>
						<p>
							If that scared you away from uploading your package (which is completely
							understandable), you can type in your flags manually here:
						</p>
						<TextInput
							labelText="Flags"
							bind:value={flagNum}
							readonly={fileName !== null}
							invalid={isNaN(parseInt(flagNum))}
							invalidText="Invalid flags"
						/>
					</FormGroup>
					<FormGroup legendText="Mini questionnaire">
						<p>
							The following questions here help us determine what each flag means. Please fill them
							out honestly.
						</p>
						<br />
						<MultiSelect
							type="inline"
							titleText="Platforms used"
							name="platformsUsed"
							label="Select every platform you've used"
							items={[
								{ id: 'Desktop', text: 'Desktop' },
								{ id: 'Web', text: 'Web' },
								{ id: 'iOS', text: 'iOS' },
								{ id: 'Android', text: 'Android' }
							]}
							bind:selectedIds={selectedPlatforms}
						/>
						<br />
						<Checkbox
							name="selfbotted"
							labelText="I have selfbotted/used my token outside of the client"
						/>
						<Checkbox name="modded" labelText="I have used a custom/modded client" />
						<Checkbox name="disabled" labelText="I have been disabled before" />
						<Checkbox name="selfDisabled" labelText="I have disabled my own account" />
						<Checkbox name="hasAlts" labelText="I have an alternative account" />
						<Checkbox name="hasBeenWarned" labelText="I have been warned by Trust and Safety" />
						<Checkbox name="hasSystemMessage" labelText="I have had a system message" />
						<Checkbox
							name="markedSuspicious"
							labelText="I have been marked as suspicious (i.e., put through phone number verification or have been locked out)"
						/>
						<Checkbox
							name="usedZendesk"
							labelText="I have logged in to Discord's support system (Zendesk)"
						/>
						<Checkbox name="botApplication" labelText="I have created a bot application before" />
						<Checkbox name="verifiedEmail" labelText="I have verified my e-mail address" />
						<Checkbox name="verifiedPhone" labelText="I have verified my phone number" />
						<Checkbox name="dataTracking" labelText="I have data tracking enabled in settings" />
						<Checkbox name="2fa" labelText="I have 2FA enabled" />
						<Checkbox name="over18" labelText="I have told Discord I am over 18" />
					</FormGroup>
					<FormGroup legendText="Anonymity">
						<p>You can choose to remain anonymous here.</p>
						<Checkbox name="anonymity" labelText="I want to remain anonymous" />
					</FormGroup>
					{#if state === 'waiting'}
						<Button type="submit" disabled={flagNum === null}>Submit</Button>
					{:else}
						<InlineLoading
							status={state === 'loading' ? 'active' : state === 'success' ? 'finished' : 'error'}
							description={state === 'loading'
								? 'Submitting answers...'
								: state === 'success'
								? 'Thank you! Your answers have been submitted successfully.'
								: 'An error has occurred.'}
						/>
					{/if}
				</Form>
			</Column>
		</Row>
	</Grid>
{:catch e}
	<InlineNotification
		title="Error:"
		subtitle="An error has occurred. Refresh to try again."
		hideCloseButton
	/>
{/await}

<style>
	.container {
		display: flex;
		align-items: center;
	}

	.avatar {
		margin-right: 20px;
	}

	.avatar > img {
		height: 100px;
		border-radius: 100%;
	}

	.container > div {
		float: left;
	}
</style>
