import { membershipBackendJson, jsonResponse } from "../../_helpers";
import { NextRequest } from "next/server";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { res, data } = await membershipBackendJson(
    `/memberships/${id}/cancel`,
    { method: "PUT" }
  );
  return jsonResponse(data, res.status);
}