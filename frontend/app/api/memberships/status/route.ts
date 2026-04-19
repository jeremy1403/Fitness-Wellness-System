import { membershipBackendJson, jsonResponse } from "../_helpers";

export async function GET() {
  const { res, data } = await membershipBackendJson("/memberships/status");
  return jsonResponse(data, res.status);
}