import { membershipBackendJson, jsonResponse } from "../_helpers";

export async function GET() {
  const { res, data } = await membershipBackendJson("/memberships/history");
  return jsonResponse(data, res.status);
}