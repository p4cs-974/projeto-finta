type StoredValue = {
	value: string;
	expirationTime: number | null;
};

function cloneStoredValue(value: StoredValue): StoredValue {
	return {
		value: value.value,
		expirationTime: value.expirationTime,
	};
}

export function createFakeKvNamespace(startTime = Date.now()): KVNamespace & {
	advanceTime: (ms: number) => void;
	readRaw: (key: string) => string | null;
} {
	let now = startTime;
	const store = new Map<string, StoredValue>();

	function purgeExpired(key: string): void {
		const value = store.get(key);

		if (value && value.expirationTime !== null && value.expirationTime <= now) {
			store.delete(key);
		}
	}

	function readValue(key: string): StoredValue | null {
		purgeExpired(key);
		const value = store.get(key);
		return value ? cloneStoredValue(value) : null;
	}

	const fakeKv = {
		async get(
			key: string | string[],
			typeOrOptions?: string | { type?: string },
		) {
			const type =
				typeof typeOrOptions === "string"
					? typeOrOptions
					: typeOrOptions?.type;

			if (Array.isArray(key)) {
				return new Map(
					key.map((item) => {
						const value = readValue(item);

						if (!value) {
							return [item, null];
						}

						if (type === "json") {
							return [item, JSON.parse(value.value) as unknown];
						}

						return [item, value.value];
					}),
				);
			}

			const value = readValue(key);

			if (!value) {
				return null;
			}

			if (type === "json") {
				return JSON.parse(value.value) as unknown;
			}

			return value.value;
		},
		async getWithMetadata(
			key: string | string[],
			typeOrOptions?: string | { type?: string },
		) {
			const value = await fakeKv.get(key, typeOrOptions);
			return {
				value,
				metadata: null,
				cacheStatus: null,
			};
		},
		async put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: KVNamespacePutOptions) {
			if (typeof value !== "string") {
				throw new Error("Fake KV only supports string values");
			}

			let expirationTime: number | null = null;

			if (typeof options?.expiration === "number") {
				expirationTime = options.expiration * 1000;
			}

			if (typeof options?.expirationTtl === "number") {
				expirationTime = now + options.expirationTtl * 1000;
			}

			store.set(key, {
				value,
				expirationTime,
			});
		},
		async delete(key: string) {
			store.delete(key);
		},
		async list(options?: KVNamespaceListOptions) {
			const prefix = options?.prefix ?? "";
			const limit = Number(options?.limit ?? 1000);
			const cursor = options?.cursor ? Number.parseInt(options.cursor, 10) : 0;
			const matchingKeys = [...store.keys()]
				.map((key) => {
					purgeExpired(key);
					return key;
				})
				.filter((key) => store.has(key) && key.startsWith(prefix))
				.sort();
			const keys = matchingKeys
				.slice(cursor, cursor + limit)
				.map((key) => ({
					name: key,
					expiration: undefined,
					metadata: undefined,
				}));
			const nextCursor = cursor + keys.length;
			const listComplete = nextCursor >= matchingKeys.length;

			return {
				keys,
				list_complete: listComplete,
				cursor: listComplete ? "" : String(nextCursor),
				cacheStatus: null,
			};
		},
		advanceTime(ms: number) {
			now += ms;
		},
		readRaw(key: string) {
			return readValue(key)?.value ?? null;
		},
	};

	return fakeKv as unknown as KVNamespace & {
		advanceTime: (ms: number) => void;
		readRaw: (key: string) => string | null;
	};
}
