import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { fetchQuery, init } from "@airstack/node";
import "dotenv/config";

const app = new Hono();

app.use(async (_, next) => {
  init(process.env.AIRSTACK_API_KEY || "");
  await next();
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/moxie-daily", async (c) => {
  const fid = c.req.query("fid");

  const query = `
  query MyQuery($fid: String!) {
    FarcasterMoxieEarningStats(
    input: {filter: {entityType: {_eq: USER}, entityId: {_eq: $fid}}, timeframe: TODAY, blockchain: ALL}
  ) {
    FarcasterMoxieEarningStat {
      allEarningsAmount
      castEarningsAmount
      frameDevEarningsAmount
      otherEarningsAmount
      endTimestamp
      startTimestamp
      timeframe
      socials {
        isFarcasterPowerUser
        profileImage
        profileDisplayName
        profileHandle
      }
      entityId
    }
  }
  FarcasterMoxieClaimDetails(
    input: {filter: {fid: {_eq: $fid}}, blockchain: ALL}
  ) {
    FarcasterMoxieClaimDetails {
      availableClaimAmount
      claimedAmount
    }
  }
  }
  `;

  const variables = { fid: fid };
  const { data, error } = await fetchQuery(query, variables);

  if (error) {
    return c.json({ error });
  }
  console.log(data);
  const moxieData = data?.FarcasterMoxieEarningStats
    .FarcasterMoxieEarningStat || {
    castEarningsAmount: 0,
  };
  const moxieClaimTotals =
    data?.FarcasterMoxieClaimDetails.FarcasterMoxieClaimDetails;

  return c.json({
    ...moxieData[0],
    moxieClaimTotals,
  });
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
