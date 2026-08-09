const [, , rawUrl] = process.argv;
const target = rawUrl || process.env.PORTAL_HEALTHCHECK_URL || "https://quecomproo.app";
const url = new URL("/api/portal-token", target).toString();

console.log(`Portal healthcheck target: ${target}`);
console.log(`Fetching token endpoint: ${url}`);

try {
  const res = await fetch(url, {
    method: "GET",
    redirect: "manual",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  let json;

  if (contentType.includes("application/json")) {
    try {
      json = JSON.parse(text);
    } catch (err) {
      // ignore parse error
    }
  }

  console.log(`Response status: ${res.status}`);

  if (res.status === 307 || res.status === 302) {
    console.log("⚠ El endpoint está protegido y redirige a /login para peticiones sin sesión.");
    console.log("Esto es normal si ejecutas el script desde el terminal sin cookie de sesión.");
    if (res.headers.get("location")) {
      console.log(`Location: ${res.headers.get("location")}`);
    }
    process.exit(0);
  }

  if (res.status === 401) {
    console.log("✔ Endpoint reachable y auth requerido. El endpoint está vivo y la app no está devolviendo 500.");
    console.log("Con sesión iniciada en el navegador, /api/portal-token debería devolver 200 y un token.");
    process.exit(0);
  }

  if (res.status === 500) {
    console.error("✖ El endpoint de token respondió 500.");
    console.error("Falta PORTAL_SECRET_KEY en Vercel, o PORTAL_ENV_ID apunta a otro environment.");
    if (json?.error) {
      console.error(`Error: ${json.error}`);
    } else {
      console.error(`Body: ${text}`);
    }
    process.exit(1);
  }

  if (res.status === 502) {
    console.error("✖ Portal rechazó la petición de acuñado.");
    console.error(`Código de Portal: ${json?.code ?? "desconocido"}`);
    console.error("invalid_api_key ⇒ la secret key en Vercel es de otro proyecto o está revocada.");
    process.exit(1);
  }

  if (res.ok) {
    if (json?.token) {
      console.log("✔ Endpoint devuelve token correctamente.");
      console.log(`Token length: ${String(json.token).length}`);
      process.exit(0);
    }
    console.log("✔ Endpoint devuelve OK, pero la respuesta no incluye token JSON.");
    console.log(`Body: ${text}`);
    process.exit(res.status === 200 ? 0 : 1);
  }

  console.error(`✖ Respuesta inesperada: ${res.status}`);
  console.error(`Body: ${text}`);
  process.exit(1);
} catch (error) {
  console.error("✖ Error de red al consultar el endpoint.");
  console.error(error);
  process.exit(1);
}
