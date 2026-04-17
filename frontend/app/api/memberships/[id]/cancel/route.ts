import { membershipBackendJson, jsonResponse } from "../../_helpers";

export async function PUT(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { res, data } = await membershipBackendJson(
    `/memberships/${params.id}/cancel`,
    { method: "PUT" }
  );
  return jsonResponse(data, res.status);
}