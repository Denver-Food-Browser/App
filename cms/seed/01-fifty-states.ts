/**
 * Seed script for US states and territories
 * Exports a default function that receives authenticated Directus client context
 */

interface SeedContext {
  accessToken: string;
  directusUrl: string;
}

const states = [
  { name: "Alabama", abbreviation: "AL", type: "state" },
  { name: "Alaska", abbreviation: "AK", type: "state" },
  { name: "Arizona", abbreviation: "AZ", type: "state" },
  { name: "Arkansas", abbreviation: "AR", type: "state" },
  { name: "California", abbreviation: "CA", type: "state" },
  { name: "Colorado", abbreviation: "CO", type: "state" },
  { name: "Connecticut", abbreviation: "CT", type: "state" },
  { name: "Delaware", abbreviation: "DE", type: "state" },
  { name: "Florida", abbreviation: "FL", type: "state" },
  { name: "Georgia", abbreviation: "GA", type: "state" },
  { name: "Hawaii", abbreviation: "HI", type: "state" },
  { name: "Idaho", abbreviation: "ID", type: "state" },
  { name: "Illinois", abbreviation: "IL", type: "state" },
  { name: "Indiana", abbreviation: "IN", type: "state" },
  { name: "Iowa", abbreviation: "IA", type: "state" },
  { name: "Kansas", abbreviation: "KS", type: "state" },
  { name: "Kentucky", abbreviation: "KY", type: "state" },
  { name: "Louisiana", abbreviation: "LA", type: "state" },
  { name: "Maine", abbreviation: "ME", type: "state" },
  { name: "Maryland", abbreviation: "MD", type: "state" },
  { name: "Massachusetts", abbreviation: "MA", type: "state" },
  { name: "Michigan", abbreviation: "MI", type: "state" },
  { name: "Minnesota", abbreviation: "MN", type: "state" },
  { name: "Mississippi", abbreviation: "MS", type: "state" },
  { name: "Missouri", abbreviation: "MO", type: "state" },
  { name: "Montana", abbreviation: "MT", type: "state" },
  { name: "Nebraska", abbreviation: "NE", type: "state" },
  { name: "Nevada", abbreviation: "NV", type: "state" },
  { name: "New Hampshire", abbreviation: "NH", type: "state" },
  { name: "New Jersey", abbreviation: "NJ", type: "state" },
  { name: "New Mexico", abbreviation: "NM", type: "state" },
  { name: "New York", abbreviation: "NY", type: "state" },
  { name: "North Carolina", abbreviation: "NC", type: "state" },
  { name: "North Dakota", abbreviation: "ND", type: "state" },
  { name: "Ohio", abbreviation: "OH", type: "state" },
  { name: "Oklahoma", abbreviation: "OK", type: "state" },
  { name: "Oregon", abbreviation: "OR", type: "state" },
  { name: "Pennsylvania", abbreviation: "PA", type: "state" },
  { name: "Rhode Island", abbreviation: "RI", type: "state" },
  { name: "South Carolina", abbreviation: "SC", type: "state" },
  { name: "South Dakota", abbreviation: "SD", type: "state" },
  { name: "Tennessee", abbreviation: "TN", type: "state" },
  { name: "Texas", abbreviation: "TX", type: "state" },
  { name: "Utah", abbreviation: "UT", type: "state" },
  { name: "Vermont", abbreviation: "VT", type: "state" },
  { name: "Virginia", abbreviation: "VA", type: "state" },
  { name: "Washington", abbreviation: "WA", type: "state" },
  { name: "West Virginia", abbreviation: "WV", type: "state" },
  { name: "Wisconsin", abbreviation: "WI", type: "state" },
  { name: "Wyoming", abbreviation: "WY", type: "state" },
  { name: "District of Columbia", abbreviation: "DC", type: "district" },
  { name: "Puerto Rico", abbreviation: "PR", type: "territory" },
  { name: "Guam", abbreviation: "GU", type: "territory" },
  { name: "U.S. Virgin Islands", abbreviation: "VI", type: "territory" },
  { name: "American Samoa", abbreviation: "AS", type: "territory" },
  { name: "Northern Mariana Islands", abbreviation: "MP", type: "territory" },
];

async function post(
  directusUrl: string,
  path: string,
  body: unknown,
  token: string,
) {
  const res = await fetch(`${directusUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`   API Error (${res.status}):`, JSON.stringify(data, null, 2));
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  return data;
}

export default async function seed(context: SeedContext) {
  const { accessToken, directusUrl } = context;

  console.log("   Inserting state records...");
  const response = await post(
    directusUrl,
    "/items/state",
    states,
    accessToken,
  );

  // Handle both single object and array responses
  const data = response.data || response;
  const count = Array.isArray(data) ? data.length : states.length;
  console.log(`   ✅ Inserted ${count} state records`);
}
