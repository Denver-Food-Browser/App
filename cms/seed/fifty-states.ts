/**
 * Seed script for US states and territories
 * Exports a default function that receives authenticated Directus client context
 */

/* oxlint-disable no-console */

type SeedContext = {
  readonly accessToken: string
  readonly directusUrl: string
}

type DirectusResponse = {
  readonly data?: unknown
}

type PostResponse = DirectusResponse

const states = [
  { abbreviation: 'AL', name: 'Alabama', type: 'state' },
  { abbreviation: 'AK', name: 'Alaska', type: 'state' },
  { abbreviation: 'AZ', name: 'Arizona', type: 'state' },
  { abbreviation: 'AR', name: 'Arkansas', type: 'state' },
  { abbreviation: 'CA', name: 'California', type: 'state' },
  { abbreviation: 'CO', name: 'Colorado', type: 'state' },
  { abbreviation: 'CT', name: 'Connecticut', type: 'state' },
  { abbreviation: 'DE', name: 'Delaware', type: 'state' },
  { abbreviation: 'FL', name: 'Florida', type: 'state' },
  { abbreviation: 'GA', name: 'Georgia', type: 'state' },
  { abbreviation: 'HI', name: 'Hawaii', type: 'state' },
  { abbreviation: 'ID', name: 'Idaho', type: 'state' },
  { abbreviation: 'IL', name: 'Illinois', type: 'state' },
  { abbreviation: 'IN', name: 'Indiana', type: 'state' },
  { abbreviation: 'IA', name: 'Iowa', type: 'state' },
  { abbreviation: 'KS', name: 'Kansas', type: 'state' },
  { abbreviation: 'KY', name: 'Kentucky', type: 'state' },
  { abbreviation: 'LA', name: 'Louisiana', type: 'state' },
  { abbreviation: 'ME', name: 'Maine', type: 'state' },
  { abbreviation: 'MD', name: 'Maryland', type: 'state' },
  { abbreviation: 'MA', name: 'Massachusetts', type: 'state' },
  { abbreviation: 'MI', name: 'Michigan', type: 'state' },
  { abbreviation: 'MN', name: 'Minnesota', type: 'state' },
  { abbreviation: 'MS', name: 'Mississippi', type: 'state' },
  { abbreviation: 'MO', name: 'Missouri', type: 'state' },
  { abbreviation: 'MT', name: 'Montana', type: 'state' },
  { abbreviation: 'NE', name: 'Nebraska', type: 'state' },
  { abbreviation: 'NV', name: 'Nevada', type: 'state' },
  { abbreviation: 'NH', name: 'New Hampshire', type: 'state' },
  { abbreviation: 'NJ', name: 'New Jersey', type: 'state' },
  { abbreviation: 'NM', name: 'New Mexico', type: 'state' },
  { abbreviation: 'NY', name: 'New York', type: 'state' },
  { abbreviation: 'NC', name: 'North Carolina', type: 'state' },
  { abbreviation: 'ND', name: 'North Dakota', type: 'state' },
  { abbreviation: 'OH', name: 'Ohio', type: 'state' },
  { abbreviation: 'OK', name: 'Oklahoma', type: 'state' },
  { abbreviation: 'OR', name: 'Oregon', type: 'state' },
  { abbreviation: 'PA', name: 'Pennsylvania', type: 'state' },
  { abbreviation: 'RI', name: 'Rhode Island', type: 'state' },
  { abbreviation: 'SC', name: 'South Carolina', type: 'state' },
  { abbreviation: 'SD', name: 'South Dakota', type: 'state' },
  { abbreviation: 'TN', name: 'Tennessee', type: 'state' },
  { abbreviation: 'TX', name: 'Texas', type: 'state' },
  { abbreviation: 'UT', name: 'Utah', type: 'state' },
  { abbreviation: 'VT', name: 'Vermont', type: 'state' },
  { abbreviation: 'VA', name: 'Virginia', type: 'state' },
  { abbreviation: 'WA', name: 'Washington', type: 'state' },
  { abbreviation: 'WV', name: 'West Virginia', type: 'state' },
  { abbreviation: 'WI', name: 'Wisconsin', type: 'state' },
  { abbreviation: 'WY', name: 'Wyoming', type: 'state' },
  { abbreviation: 'DC', name: 'District of Columbia', type: 'district' },
  { abbreviation: 'PR', name: 'Puerto Rico', type: 'territory' },
  { abbreviation: 'GU', name: 'Guam', type: 'territory' },
  { abbreviation: 'VI', name: 'U.S. Virgin Islands', type: 'territory' },
  { abbreviation: 'AS', name: 'American Samoa', type: 'territory' },
  { abbreviation: 'MP', name: 'Northern Mariana Islands', type: 'territory' },
]

const post = async ({
  directusUrl,
  path,
  body,
  token,
}: {
  readonly directusUrl: string
  readonly path: string
  readonly body: unknown
  readonly token: string
}): Promise<PostResponse> => {
  const res = await fetch(`${directusUrl}${path}`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const data: unknown = await res.json()

  if (!res.ok) {
    console.error(
      `   API Error (${res.status}):`,
      JSON.stringify(data, null, 2),
    )
    throw new Error(`API request failed: ${res.status} ${res.statusText}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response is untyped
  return data as PostResponse
}

export default async function seed(context: Readonly<SeedContext>) {
  const { accessToken, directusUrl } = context

  console.log('   Inserting state records...')
  const response = await post({
    directusUrl,
    path: '/items/state',
    body: states,
    token: accessToken,
  })

  // Handle both single object and array responses
  const data: unknown =
    typeof response === 'object' && response !== null && 'data' in response
      ? (response.data ?? response)
      : response
  const count = Array.isArray(data) ? data.length : states.length
  console.log(`   ✅ Inserted ${count} state records`)
}
