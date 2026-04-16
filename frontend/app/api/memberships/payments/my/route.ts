import { backendUrl, readJson } from "@/lib/api/backend";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await fetch(backendUrl("/memberships/payments/my"), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await readJson(res);
  return Response.json(data, { status: res.status });
}