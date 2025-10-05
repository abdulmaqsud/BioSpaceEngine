const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api';

const API_BASE_URL = (() => {
	const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
	if (!envUrl || envUrl.trim().length === 0) {
		return DEFAULT_API_BASE_URL;
	}
	return envUrl.replace(/\/$/, '');
})();

type QueryParamValue = string | number | boolean | null | undefined;

interface PaginatedResponse<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
}

type RawEntity = {
	id: number;
	name?: string;
	text?: string;
	entity_type?: string;
	type?: string;
	canonical_id?: string | null;
	description?: string | null;
	study?: number;
	study_id?: number;
	start_char?: number | null;
	end_char?: number | null;
	start?: number | null;
	end?: number | null;
};

type RawTriple = {
	id: number;
	subject?: string;
	subject_name?: string;
	subject_id?: number;
	predicate?: string;
	relation?: string;
	object?: string;
	object_name?: string;
	object_id?: number;
	study_title?: string;
	study?: string;
	confidence?: number;
	qualifiers?: unknown;
};

export interface Study {
	id: number;
	title: string;
	authors?: string;
	year?: number | null;
	journal?: string;
	pmcid: string;
	pmc_url: string;
	abstract?: string;
	sections_count?: number;
	created_at?: string;
	updated_at?: string;
}

export interface EvidenceSentence {
	id: number;
	sentence_text: string;
	sentence_index: number;
	study?: number;
	study_title?: string;
	section_title?: string | null;
	created_at?: string;
	char_start?: number | null;
	char_end?: number | null;
}

export interface Section {
	id: number;
	section_type: string;
	title?: string;
	content: string;
	order: number;
}

export interface Entity {
	id: number;
	name?: string;
	text?: string;
	entity_type: string;
	canonical_id?: string | null;
	description?: string | null;
	study?: number;
	start_char?: number | null;
	end_char?: number | null;
	occurrence_count?: number;
}

export interface Triple {
	id: number;
	subject_id?: number;
	subject: string;
	predicate: string;
	object_id?: number;
	object: string;
	study_title?: string;
	confidence?: number;
	qualifiers?: Record<string, unknown> | null;
}

export interface SearchResult {
	study: Study;
	evidence_sentences: EvidenceSentence[];
	relevance_score: number;
}

export interface EntityOccurrence {
	id: number;
	study_id: number;
	entity: Entity;
	section_title?: string | null;
	section_type?: string | null;
	start_char?: number | null;
	end_char?: number | null;
	evidence_id?: number | null;
	source?: string;
}

export interface StudyEntitiesResponse {
	study_id: number;
	total_entities: number;
	entities: Entity[];
	occurrences: EntityOccurrence[];
}

export type SearchType = 'semantic' | 'text' | 'filtered';

export interface SearchResponse {
	results: SearchResult[];
	total: number;
	query: string;
	search_type: SearchType;
}

export interface FacetBucket {
	name: string;
	count: number;
}

export interface FacetsResponse {
  total_studies: number;
  organisms: FacetBucket[];
  exposures: FacetBucket[];
  systems: FacetBucket[];
  model_organisms: FacetBucket[];
  molecular: FacetBucket[];
  years: FacetBucket[];
  assays: FacetBucket[];
  missions: FacetBucket[];
  journals: FacetBucket[];
  entity_types: FacetBucket[];
}

export interface StudyListResponse {
	count: number;
	results: Study[];
	next?: string | null;
	previous?: string | null;
}

export interface StudiesFilters {
	search?: string;
	year_from?: number | string;
	year_to?: number | string;
	journal?: string;
}

export interface SearchFilters {
	organism?: string;
	exposure?: string;
	system?: string;
	year?: string;
	assay?: string;
	mission?: string;
	model_organism?: string;
	molecular?: string;
}

function buildUrl(path: string, params?: Record<string, QueryParamValue>) {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const url = new URL(`${API_BASE_URL}${normalizedPath}`);

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value === undefined || value === null || value === '') {
				return;
			}
			url.searchParams.append(key, String(value));
		});
	}

	return url.toString();
}

async function safeReadText(response: Response) {
	try {
		return await response.text();
	} catch (error) {
		console.error('Failed to read response text', error);
		return '';
	}
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, {
		credentials: 'include',
		headers: {
			Accept: 'application/json',
			...(init?.headers ?? {}),
		},
		...init,
	});

	if (!response.ok) {
		const errorText = await safeReadText(response);
		throw new Error(
			`Request failed with status ${response.status}${
				errorText ? `: ${errorText}` : ''
			}`
		);
	}

	if (response.status === 204) {
		return null as T;
	}

	return (await response.json()) as T;
}

function parseQualifiers(value: unknown): Record<string, unknown> | null {
	if (!value) {
		return null;
	}

	if (typeof value === 'string') {
		try {
			return JSON.parse(value);
		} catch (error) {
			console.warn('Failed to parse qualifiers JSON', error);
			return { raw: value } as Record<string, unknown>;
		}
	}

	if (typeof value === 'object') {
		return value as Record<string, unknown>;
	}

	return null;
}

function normalizeEntity(raw: RawEntity): Entity {
	const entity: Entity = {
		id: raw.id,
		name: raw.name ?? raw.text ?? undefined,
		text: raw.text ?? raw.name ?? undefined,
		entity_type: raw.entity_type ?? raw.type ?? 'unknown',
		canonical_id: raw.canonical_id ?? null,
		description: raw.description ?? null,
		study: raw.study ?? raw.study_id ?? undefined,
		start_char: raw.start_char ?? raw.start ?? null,
		end_char: raw.end_char ?? raw.end ?? null,
	};
	const maybeCount = (raw as Record<string, unknown>)['occurrence_count'];
	if (typeof maybeCount === 'number') {
		entity.occurrence_count = maybeCount;
	}
	return entity;
}

function normalizeTriple(raw: RawTriple): Triple {
	return {
		id: raw.id,
		subject_id: (raw as Record<string, unknown>)['subject_id'] as number | undefined,
		subject: raw.subject ?? raw.subject_name ?? '',
		predicate: raw.predicate ?? raw.relation ?? '',
		object_id: (raw as Record<string, unknown>)['object_id'] as number | undefined,
		object: raw.object ?? raw.object_name ?? '',
		study_title: raw.study_title ?? raw.study ?? undefined,
		confidence: typeof raw.confidence === 'number' ? raw.confidence : undefined,
		qualifiers: parseQualifiers(raw.qualifiers),
	};
}

function isPaginatedResponse<T>(data: unknown): data is PaginatedResponse<T> {
	if (!data || typeof data !== 'object') {
		return false;
	}
	const candidate = data as Record<string, unknown>;
	return Array.isArray(candidate.results) && typeof candidate.count === 'number';
}

const apiService = {
	async searchStudies(
		query: string,
		limit = 20,
		threshold = 0.5,
		filters: SearchFilters = {}
	): Promise<SearchResponse> {
		const url = buildUrl('/studies/search/', {
			query: query,
			limit,
			threshold,
			...filters,
		});

		const response = await fetchJson<SearchResponse>(url);
		return {
			...response,
			results: response.results ?? [],
		};
	},

	async getFacets(params: Record<string, QueryParamValue> = {}): Promise<FacetsResponse> {
		const url = buildUrl('/studies/facets/', params);
		const facets = await fetchJson<FacetsResponse>(url);
		return {
			total_studies: facets.total_studies ?? 0,
			organisms: facets.organisms ?? [],
			exposures: facets.exposures ?? [],
			systems: facets.systems ?? [],
			model_organisms: facets.model_organisms ?? [],
			molecular: facets.molecular ?? [],
			years: facets.years ?? [],
			assays: facets.assays ?? [],
			missions: facets.missions ?? [],
			journals: facets.journals ?? [],
			entity_types: facets.entity_types ?? [],
		};
	},

	async getStudies(
		page = 1,
		pageSize = 20,
		filters: StudiesFilters = {}
	): Promise<StudyListResponse> {
		const url = buildUrl('/studies/', {
			page,
			page_size: pageSize,
			...filters,
		});

		const data = await fetchJson<PaginatedResponse<Study> | Study[]>(url);

		if (Array.isArray(data)) {
			const start = Math.max(0, (page - 1) * pageSize);
			return {
				count: data.length,
				results: data.slice(start, start + pageSize),
				next: null,
				previous: null,
			};
		}

		if (isPaginatedResponse<Study>(data)) {
			return {
				count: data.count,
				results: data.results ?? [],
				next: data.next,
				previous: data.previous,
			};
		}

		return {
			count: 0,
			results: [],
			next: null,
			previous: null,
		};
	},

	async getStudy(studyId: number | string): Promise<Study> {
		const url = buildUrl(`/studies/${studyId}/`);
		return fetchJson<Study>(url);
	},

	async getStudySections(studyId: number | string): Promise<Section[]> {
		const url = buildUrl(`/studies/${studyId}/sections/`);
		const sections = await fetchJson<Section[]>(url);
		return sections ?? [];
	},

	async getStudyEvidence(studyId: number | string): Promise<EvidenceSentence[]> {
		const url = buildUrl(`/studies/${studyId}/evidence/`);
		const evidence = await fetchJson<EvidenceSentence[]>(url);
		return evidence ?? [];
	},

		async getEntities(params: Record<string, QueryParamValue> = {}): Promise<Entity[]> {
			const url = buildUrl('/entities/', params);
			const entities = await fetchJson<RawEntity[]>(url);
			return Array.isArray(entities)
				? entities.map((raw) => {
					const normalized = normalizeEntity(raw);
					const count = (raw as Record<string, unknown>)['occurrence_count'];
					if (typeof count === 'number') {
						normalized.occurrence_count = count;
					}
					return normalized;
				})
				: [];
	},

		async getStudyEntities(studyId: number | string): Promise<StudyEntitiesResponse> {
			const url = buildUrl(`/studies/${studyId}/entities/`);
			const response = await fetchJson<StudyEntitiesResponse>(url);
			return {
				study_id: response.study_id,
				total_entities: response.total_entities ?? response.entities?.length ?? 0,
				entities: Array.isArray(response.entities) ? response.entities : [],
				occurrences: Array.isArray(response.occurrences) ? response.occurrences : [],
			};
	},

		async getTriples(params: Record<string, QueryParamValue> = {}): Promise<Triple[]> {
		const url = buildUrl('/triples/', params);
			const triples = await fetchJson<RawTriple[]>(url);
			return Array.isArray(triples) ? triples.map(normalizeTriple) : [];
	},
};

export { apiService };

export default apiService;