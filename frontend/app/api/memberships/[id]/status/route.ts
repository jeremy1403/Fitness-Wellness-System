import { NextRequest } from "next/server";
import { membershipBackendJson, jsonResponse } from "../../_helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { res, data } = await membershipBackendJson(
    `/memberships/${id}/status`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return jsonResponse(data, res.status);
}