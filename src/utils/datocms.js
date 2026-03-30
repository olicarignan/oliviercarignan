export async function fetchDato(query, variables = {}) {
  console.log("[fetchDato] NEXT_PUBLIC_DATO_TOKEN defined:", !!process.env.NEXT_PUBLIC_DATO_TOKEN);
  console.log("[fetchDato] NEXT_PUBLIC_DATO_URL defined:", !!process.env.NEXT_PUBLIC_DATO_URL);
  const res = await fetch("https://graphql.datocms.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_DATO_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join("\n"));
  }

  return json.data;
}
