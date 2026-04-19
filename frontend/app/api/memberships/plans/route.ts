import { NextRequest } from "next/server";
import { membershipBackendJson, jsonResponse } from "../_helpers";

export async function GET() {
  const { res, data } = await membershipBackendJson("/memberships/plans");
  return jsonResponse(data, res.status);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { res, data } = await membershipBackendJson("/memberships/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonResponse(data, res.status);
}