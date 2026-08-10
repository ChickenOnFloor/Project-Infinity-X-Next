// Checks the x-admin-key header against ADMIN_API_KEY.
// Returns null if authorized, or a Response to return immediately if not.
export function checkAdminAuth(request) {
  const provided = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;

  if (!expected) {
    console.error("[admin] ADMIN_API_KEY is not set on the server");
    return Response.json(
      { error: "admin panel is not configured" },
      { status: 500 }
    );
  }
  if (!provided || provided !== expected) {
    return Response.json({ error: "invalid admin key" }, { status: 401 });
  }
  return null;
}
